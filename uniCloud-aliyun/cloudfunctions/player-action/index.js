'use strict';

/**
 * 玩家行动
 */

const gameLogic = require('../../../utils/game-logic.js');
const handEvaluator = require('../../../utils/hand-evaluator.js');

exports.main = async (event, context) => {
  const db = uniCloud.database();

  // 验证登录
  if (!event.userInfo || !event.userInfo.uid) {
    return {
      code: 401,
      message: '请先登录'
    };
  }

  const { roomId, action } = event;

  // 验证房间号
  if (!roomId) {
    return {
      code: 400,
      message: '房间号不能为空'
    };
  }

  // 验证行动
  if (!action || !action.type) {
    return {
      code: 400,
      message: '行动类型不能为空'
    };
  }

  // 合法的行动类型
  const validActions = ['check', 'call', 'raise', 'fold', 'allin'];
  if (!validActions.includes(action.type)) {
    return {
      code: 400,
      message: '无效的行动类型'
    };
  }

  // 如果是加注，验证金额
  if (action.type === 'raise') {
    if (typeof action.amount !== 'number' || action.amount <= 0) {
      return {
        code: 400,
        message: '加注金额必须大于0'
      };
    }
  }

  // 获取房间信息
  const roomRes = await db.collection('game_rooms')
    .where({ _id: roomId })
    .get();

  if (!roomRes.data || roomRes.data.length === 0) {
    return {
      code: 404,
      message: '房间不存在'
    };
  }

  const room = roomRes.data[0];

  // 验证房间状态
  if (room.gameState !== 'playing') {
    return {
      code: 400,
      message: '游戏未在进行中'
    };
  }

  // 查找玩家在房间中的索引
  const playerIndex = room.players.findIndex(p => p.userId === event.userInfo.uid);
  if (playerIndex === -1) {
    return {
      code: 400,
      message: '您不在该房间中'
    };
  }

  // 获取当前玩家
  const currentPlayer = room.players[playerIndex];

  // 验证玩家是否有权行动
  if (currentPlayer.folded || currentPlayer.allIn) {
    return {
      code: 400,
      message: '您已弃牌或全下，无法行动'
    };
  }

  // 验证是否为当前行动玩家
  if (room.currentPlayerIndex !== playerIndex) {
    return {
      code: 400,
      message: '不是您的回合'
    };
  }

  // 验证玩家是否有足够的金币（针对加注和跟注）
  if (action.type === 'raise' || action.type === 'call') {
    const requiredAmount = action.type === 'raise'
      ? action.amount - (room.roundBets[playerIndex] || 0)
      : room.currentBet - (room.roundBets[playerIndex] || 0);

    if (requiredAmount > currentPlayer.coins) {
      return {
        code: 400,
        message: '金币不足'
      };
    }
  }

  try {
    const now = new Date();

    // 构建游戏状态
    const gameState = {
      players: room.players,
      round: room.round,
      dealerIndex: room.dealerIndex,
      currentPlayerIndex: room.currentPlayerIndex,
      communityCards: room.communityCards || [],
      pot: room.pot,
      sidePots: room.sidePots || [],
      currentBet: room.currentBet,
      lastRaiseAmount: room.lastRaiseAmount || 0,
      roundBets: room.roundBets || Array(room.players.length).fill(0),
      smallBlind: room.smallBlind,
      bigBlind: room.bigBlind
    };

    // 执行玩家行动
    const { gameState: newGameState, nextPlayerIndex, roundEnded } = gameLogic.playerAction(
      gameState,
      playerIndex,
      action
    );

    // 准备更新数据
    const updateData = {
      players: newGameState.players,
      currentBet: newGameState.currentBet,
      lastRaiseAmount: newGameState.lastRaiseAmount,
      roundBets: newGameState.roundBets,
      pot: newGameState.pot,
      currentPlayerIndex: nextPlayerIndex,
      updateTime: now
    };

    let gameEnded = false;
    let winners = [];
    let potDistribution = [];

    // 检查轮次是否结束
    if (roundEnded) {
      console.log('轮次结束，进入下一阶段');

      // 检查游戏是否结束（只剩一个玩家未弃牌，或已到河牌轮）
      const activePlayers = newGameState.players.filter(p => !p.folded);

      if (activePlayers.length === 1 || newGameState.round === 'river') {
        // 游戏结束，进行结算
        console.log('游戏结束，进行结算');

        const settlement = gameLogic.settleGame(newGameState, handEvaluator.evaluateHand);

        winners = settlement.winners;
        potDistribution = settlement.potDistribution;

        // 更新获胜者和玩家的金币
        const winnerMap = {};
        potDistribution.forEach(dist => {
          winnerMap[dist.userId] = (winnerMap[dist.userId] || 0) + dist.amount;
        });

        // 更新所有玩家的金币
        const playerUpdates = newGameState.players.map(async (player) => {
          const winAmount = winnerMap[player.userId] || 0;
          const newCoins = player.coins + winAmount;

          await db.collection('users')
            .doc(player.userId)
            .update({
              coins: newCoins,
              roomId: '',  // 离开房间
              ready: false,
              updateTime: now
            });
        });

        await Promise.all(playerUpdates);

        // 更新房间状态为已结束
        updateData.gameState = 'ended';
        updateData.winners = winners;
        updateData.potDistribution = potDistribution;
        updateData.handResults = settlement.handResults;
        updateData.endedTime = now;

        gameEnded = true;
      } else {
        // 进入下一游戏轮次
        const { gameState: nextGameState, newRound, gameEnded: shouldEnd } = gameLogic.advanceRound(newGameState);

        updateData.round = nextRound;
        updateData.currentPlayerIndex = nextGameState.currentPlayerIndex;
        updateData.roundBets = nextGameState.roundBets;
        updateData.currentBet = nextGameState.currentBet;
        updateData.lastRaiseAmount = nextGameState.lastRaiseAmount;

        // 如果是翻牌/转牌/河牌，需要发公共牌
        if (newRound === 'flop' || newRound === 'turn' || newRound === 'river') {
          const deck = handEvaluator.parseCards(room.remainingDeck || []);
          const { gameState: gameStateWithCommunity, deck: newRemainingDeck } = gameLogic.dealCards(
            nextGameState,
            deck
          );

          updateData.communityCards = gameStateWithCommunity.communityCards;
          updateData.remainingDeck = handEvaluator.cardsToString(newRemainingDeck);
        }
      }
    }

    // 更新房间
    await db.collection('game_rooms')
      .doc(roomId)
      .update(updateData);

    // 返回结果
    const result = {
      code: 200,
      message: '行动成功',
      data: {
        roomId,
        currentPlayerIndex: updateData.currentPlayerIndex,
        round: updateData.round || room.round,
        currentBet: updateData.currentBet,
        pot: updateData.pot,
        roundEnded: roundEnded,
        gameEnded: gameEnded
      }
    };

    // 如果游戏结束，返回获胜者信息
    if (gameEnded) {
      result.data.winners = winners;
      result.data.potDistribution = potDistribution;
    }

    return result;
  } catch (error) {
    console.error('玩家行动失败:', error);
    return {
      code: 500,
      message: '玩家行动失败',
      error: error.message
    };
  }
};
