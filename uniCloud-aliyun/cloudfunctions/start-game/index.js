'use strict';

/**
 * 开始游戏
 */

const gameLogic = require('../../../utils/game-logic.js');
const poker = require('../../../utils/poker.js');
const handEvaluator = require('../../../utils/hand-evaluator.js');

exports.main = async (event, context) => {
  const db = uniCloud.database();

  // 从 event 中获取 userId（前端传递）
  const userId = event.userId;

  // 验证登录
  if (!userId) {
    return {
      code: 401,
      message: '请先登录'
    };
  }

  const { roomId } = event;

  // 验证房间号
  if (!roomId) {
    return {
      code: 400,
      message: '房间号不能为空'
    };
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

  // 验证房主权限
  if (room.creatorId !== userId) {
    return {
      code: 403,
      message: '只有房主可以开始游戏'
    };
  }

  // 验证房间状态
  if (room.gameState !== 'waiting') {
    return {
      code: 400,
      message: '房间状态异常，无法开始游戏'
    };
  }

  // 验证玩家数量（至少2人）
  if (room.players.length < 2) {
    return {
      code: 400,
      message: '至少需要2名玩家才能开始游戏'
    };
  }

  // 验证所有玩家都已准备
  const unreadyPlayers = room.players.filter(p => !p.ready);
  if (unreadyPlayers.length > 0) {
    return {
      code: 400,
      message: `还有 ${unreadyPlayers.length} 名玩家未准备`
    };
  }

  // 再次验证所有玩家的金币是否足够
  const insufficientPlayers = room.players.filter(p => p.coins < room.bigBlind * 2);
  if (insufficientPlayers.length > 0) {
    return {
      code: 400,
      message: '有玩家金币不足，无法开始游戏'
    };
  }

  try {
    const now = new Date();

    // 初始化游戏状态
    const gameState = gameLogic.initGameState(
      room.players,
      room.smallBlind,
      room.bigBlind
    );

    // 创建并洗牌
    const deck = poker.createDeck();
    const shuffledDeck = poker.shuffleDeck(deck);

    // 发底牌
    const { gameState: gameStateWithHoleCards, deck: remainingDeck } = gameLogic.dealCards(
      gameState,
      shuffledDeck
    );

    // 设置盲注
    const { gameState: gameStateWithBlinds, potIncrease } = gameLogic.postBlinds(
      gameStateWithHoleCards
    );

    // 更新房间状态
    const updateData = {
      gameState: 'playing',           // 游戏进行中
      players: gameStateWithBlinds.players,
      currentPlayerIndex: gameStateWithBlinds.currentPlayerIndex,
      dealerIndex: gameStateWithBlinds.dealerIndex,
      communityCards: gameStateWithBlinds.communityCards,
      pot: gameStateWithBlinds.pot,
      sidePots: gameStateWithBlinds.sidePots || [],
      currentBet: gameStateWithBlinds.currentBet,
      round: gameStateWithBlinds.round,
      roundBets: gameStateWithBlinds.roundBets,
      lastRaiseAmount: gameStateWithBlinds.lastRaiseAmount || 0,
      remainingDeck: poker.cardsToString(remainingDeck),  // 保存剩余牌组
      gameStartTime: now,
      updateTime: now
    };

    await db.collection('game_rooms')
      .doc(roomId)
      .update(updateData);

    // 更新所有玩家的状态（可选：记录游戏开始）
    const playerUpdates = room.players.map(p => {
      return db.collection('users')
        .doc(p.userId)
        .update({
          updateTime: now
        });
    });

    await Promise.all(playerUpdates);

    return {
      code: 200,
      message: '游戏开始',
      data: {
        roomId,
        currentPlayerIndex: gameStateWithBlinds.currentPlayerIndex,
        currentBet: gameStateWithBlinds.currentBet,
        pot: gameStateWithBlinds.pot,
        round: gameStateWithBlinds.round
      }
    };
  } catch (error) {
    console.error('开始游戏失败:', error);
    return {
      code: 500,
      message: '开始游戏失败',
      error: error.message
    };
  }
};
