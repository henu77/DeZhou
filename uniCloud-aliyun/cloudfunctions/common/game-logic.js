/**
 * 德州扑克游戏逻辑
 */

/**
 * 初始化游戏状态
 * @param {Array} players - 玩家数组
 * @param {number} smallBlind - 小盲注
 * @param {number} bigBlind - 大盲注
 * @returns {Object} 初始游戏状态
 */
function initGameState(players, smallBlind, bigBlind) {
  return {
    round: 'preflop',           // 翻牌前
    dealerIndex: 0,             // 庄位索引
    currentPlayerIndex: -1,     // 当前行动玩家索引（待计算）
    communityCards: [],         // 公共牌
    pot: 0,                     // 主底池
    sidePots: [],               // 边池
    currentBet: 0,              // 当前轮次最高下注额
    lastRaiseAmount: 0,         // 上次加注金额
    roundBets: Array(players.length).fill(0), // 本轮每个玩家的下注额
    players: players.map((player, index) => ({
      ...player,
      cards: [],              // 手牌
      fold: false,            // 是否弃牌
      allIn: false,           // 是否全下
      betAmount: 0,           // 总下注额
      canAct: true,           // 能否行动（未弃牌且未全下）
      lastAction: null,       // 最后一次行动
      seat: index             // 座位号
    })),
    smallBlind: smallBlind,
    bigBlind: bigBlind
  };
}

/**
 * 发牌
 * @param {Object} gameState - 游戏状态
 * @param {Array} deck - 牌组
 * @returns {Object} {gameState, deck}
 */
function dealCards(gameState, deck) {
  const { players, round } = gameState;

  if (round === 'preflop') {
    // 翻牌前：给每个玩家发2张底牌
    const newPlayers = players.map(player => {
      const { deck: remainingDeck, cards: holeCards } = _deal(deck, 2);
      deck = remainingDeck;
      return {
        ...player,
        cards: holeCards.map(c => `${c.suit}${c.rank}`)
      };
    });
    return { gameState: { ...gameState, players: newPlayers }, deck };
  }

  if (round === 'flop') {
    // 翻牌：发3张公共牌
    const { deck: remainingDeck, cards: flopCards } = _deal(deck, 3);
    return {
      gameState: {
        ...gameState,
        communityCards: flopCards.map(c => `${c.suit}${c.rank}`)
      },
      deck: remainingDeck
    };
  }

  if (round === 'turn' || round === 'river') {
    // 转牌/河牌：各发1张公共牌
    const { deck: remainingDeck, cards: newCard } = _deal(deck, 1);
    return {
      gameState: {
        ...gameState,
        communityCards: [
          ...gameState.communityCards,
          `${newCard[0].suit}${newCard[0].rank}`
        ]
      },
      deck: remainingDeck
    };
  }

  return { gameState, deck };
}

/**
 * 辅助函数：发牌
 * @param {Array} deck - 牌组
 * @param {number} count - 牌数量
 * @returns {Object} {deck, cards}
 */
function _deal(deck, count) {
  return {
    deck: deck.slice(count),
    cards: deck.slice(0, count)
  };
}

/**
 * 计算小盲和大盲
 * @param {Object} gameState - 游戏状态
 * @returns {Object} {gameState, potIncrease}
 */
function postBlinds(gameState) {
  const { players, dealerIndex, smallBlind, bigBlind } = gameState;
  const playerCount = players.length;

  const smallBlindIndex = (dealerIndex + 1) % playerCount;
  const bigBlindIndex = (dealerIndex + 2) % playerCount;

  const newPlayers = players.map((player, index) => {
    if (index === smallBlindIndex) {
      const betAmount = Math.min(smallBlind, player.coins);
      return {
        ...player,
        betAmount: betAmount,
        coins: player.coins - betAmount,
        allIn: player.coins <= smallBlind,
        lastAction: 'blind'
      };
    }
    if (index === bigBlindIndex) {
      const betAmount = Math.min(bigBlind, player.coins);
      return {
        ...player,
        betAmount: betAmount,
        coins: player.coins - betAmount,
        allIn: player.coins <= bigBlind,
        lastAction: 'blind'
      };
    }
    return player;
  });

  const potIncrease = Math.min(smallBlind, players[smallBlindIndex].coins) +
                     Math.min(bigBlind, players[bigBlindIndex].coins);

  // 设置当前行动玩家为大盲注之后的玩家
  const currentPlayerIndex = (bigBlindIndex + 1) % playerCount;

  return {
    gameState: {
      ...gameState,
      players: newPlayers,
      currentBet: bigBlind,
      currentPlayerIndex,
      pot: gameState.pot + potIncrease
    },
    potIncrease
  };
}

/**
 * 玩家行动
 * @param {Object} gameState - 游戏状态
 * @param {number} playerIndex - 玩家索引
 * @param {Object} action - 行动 { type: 'check' | 'call' | 'raise' | 'fold' | 'allin', amount?: number }
 * @returns {Object} { gameState, nextPlayerIndex, roundEnded }
 */
function playerAction(gameState, playerIndex, action) {
  const { players, currentBet, roundBets, pot } = gameState;
  const currentPlayer = players[playerIndex];

  if (currentPlayer.fold || currentPlayer.allIn) {
    throw new Error('玩家已弃牌或全下，不能行动');
  }

  let newGameState = { ...gameState };
  let newPlayers = [...players];
  let potIncrease = 0;

  switch (action.type) {
    case 'check':
      // 过牌
      if (currentBet > roundBets[playerIndex]) {
        throw new Error('不能过牌，需要跟注');
      }
      newPlayers[playerIndex] = {
        ...currentPlayer,
        lastAction: 'check'
      };
      break;

    case 'call':
      // 跟注
      const callAmount = currentBet - roundBets[playerIndex];
      const actualCall = Math.min(callAmount, currentPlayer.coins);
      potIncrease = actualCall;

      newPlayers[playerIndex] = {
        ...currentPlayer,
        coins: currentPlayer.coins - actualCall,
        betAmount: currentPlayer.betAmount + actualCall,
        allIn: currentPlayer.coins <= callAmount,
        lastAction: currentPlayer.coins <= callAmount ? 'allin' : 'call'
      };

      roundBets[playerIndex] = currentBet;
      break;

    case 'raise':
      // 加注
      if (!action.amount || action.amount <= currentBet) {
        throw new Error('加注金额必须大于当前下注额');
      }
      const raiseAmount = action.amount - roundBets[playerIndex];
      const actualRaise = Math.min(raiseAmount, currentPlayer.coins);
      potIncrease = actualRaise;

      newPlayers[playerIndex] = {
        ...currentPlayer,
        coins: currentPlayer.coins - actualRaise,
        betAmount: currentPlayer.betAmount + actualRaise,
        allIn: currentPlayer.coins <= raiseAmount,
        lastAction: currentPlayer.coins <= raiseAmount ? 'allin' : 'raise'
      };

      newGameState.currentBet = action.amount;
      newGameState.lastRaiseAmount = action.amount - currentBet;
      roundBets[playerIndex] = action.amount;
      // 重置其他人的本轮下注，需要重新跟注
      for (let i = 0; i < roundBets.length; i++) {
        if (i !== playerIndex) {
          roundBets[i] = 0;
        }
      }
      break;

    case 'allin':
      // 全下
      potIncrease = currentPlayer.coins;
      newPlayers[playerIndex] = {
        ...currentPlayer,
        coins: 0,
        betAmount: currentPlayer.betAmount + currentPlayer.coins,
        allIn: true,
        lastAction: 'allin'
      };

      if (currentPlayer.coins + roundBets[playerIndex] > currentBet) {
        // 如果全下金额大于当前下注，则视为加注
        const newBet = currentPlayer.coins + roundBets[playerIndex];
        newGameState.currentBet = newBet;
        newGameState.lastRaiseAmount = newBet - currentBet;
        // 重置其他人的本轮下注
        for (let i = 0; i < roundBets.length; i++) {
          if (i !== playerIndex) {
            roundBets[i] = 0;
          }
        }
        roundBets[playerIndex] = newBet;
      } else {
        // 否则视为跟注
        roundBets[playerIndex] = currentBet;
      }
      break;

    case 'fold':
      // 弃牌
      newPlayers[playerIndex] = {
        ...currentPlayer,
        fold: true,
        lastAction: 'fold',
        canAct: false
      };
      break;

    default:
      throw new Error('无效的行动类型');
  }

  newGameState.players = newPlayers;
  newGameState.pot = pot + potIncrease;
  newGameState.roundBets = [...roundBets];

  // 计算下一个行动玩家
  const { nextPlayerIndex, roundEnded } = _getNextPlayer(gameState, playerIndex);

  newGameState.currentPlayerIndex = nextPlayerIndex;

  return {
    gameState: newGameState,
    nextPlayerIndex,
    roundEnded
  };
}

/**
 * 计算下一个行动玩家
 * @param {Object} gameState - 游戏状态
 * @param {number} currentPlayerIndex - 当前玩家索引
 * @returns {Object} { nextPlayerIndex, roundEnded }
 */
function _getNextPlayer(gameState, currentPlayerIndex) {
  const { players, currentBet, roundBets, round } = gameState;
  const activePlayers = players.filter(p => !p.fold && !p.allIn);
  const playerCount = players.length;

  if (activePlayers.length === 0) {
    // 所有人都弃牌或全下，轮次结束
    return { nextPlayerIndex: -1, roundEnded: true };
  }

  // 找出还有未完成行动的玩家
  const remainingPlayers = players
    .map((p, i) => ({ ...p, index: i }))
    .filter(p => !p.fold && !p.allIn && roundBets[p.index] < currentBet);

  if (remainingPlayers.length === 0) {
    // 所有玩家都已下注相同金额，轮次结束
    return { nextPlayerIndex: -1, roundEnded: true };
  }

  // 找到下一个需要行动的玩家
  let nextIndex = (currentPlayerIndex + 1) % playerCount;
  while (players[nextIndex].fold || players[nextIndex].allIn || roundBets[nextIndex] >= currentBet) {
    nextIndex = (nextIndex + 1) % playerCount;
    // 防止无限循环
    if (nextIndex === currentPlayerIndex) {
      break;
    }
  }

  return { nextPlayerIndex: nextIndex, roundEnded: false };
}

/**
 * 检查轮次是否结束
 * @param {Object} gameState - 游戏状态
 * @returns {boolean}
 */
function isRoundEnded(gameState) {
  const { players, currentBet, roundBets } = gameState;

  const remainingPlayers = players.filter(p => !p.fold && !p.allIn);
  if (remainingPlayers.length === 0) {
    return true;
  }

  // 检查所有玩家是否已下注相同金额
  return players.every((p, i) => {
    if (p.fold || p.allIn) return true;
    return roundBets[i] >= currentBet;
  });
}

/**
 * 进入下一游戏轮次
 * @param {Object} gameState - 游戏状态
 * @returns {Object} { gameState, newRound, gameEnded }
 */
function advanceRound(gameState) {
  const { round, communityCards } = gameState;

  const roundOrder = ['preflop', 'flop', 'turn', 'river', 'showdown'];
  const currentRoundIndex = roundOrder.indexOf(round);

  if (currentRoundIndex === -1 || currentRoundIndex === roundOrder.length - 1) {
    return { gameState, newRound: round, gameEnded: false };
  }

  const newRound = roundOrder[currentRoundIndex + 1];
  let newGameState = { ...gameState, round: newRound };

  // 重置本轮下注
  newGameState.currentBet = 0;
  newGameState.roundBets = Array(gameState.players.length).fill(0);
  newGameState.lastRaiseAmount = 0;

  // 设置第一个行动玩家（翻牌后从庄位开始）
  if (newRound !== 'showdown') {
    newGameState.currentPlayerIndex = gameState.dealerIndex;
  }

  // 检查游戏是否结束（只剩一个玩家）
  const activePlayers = gameState.players.filter(p => !p.fold);
  const gameEnded = activePlayers.length === 1 || newRound === 'showdown';

  return {
    gameState: newGameState,
    newRound,
    gameEnded
  };
}

/**
 * 计算底池分配（包括主池和边池）
 * @param {Object} gameState - 游戏状态
 * @returns {Object} { mainPot, sidePots }
 */
function calculatePots(gameState) {
  const { players } = gameState;

  // 按总下注额排序玩家
  const sortedPlayers = [...players]
    .filter(p => !p.fold)
    .sort((a, b) => a.betAmount - b.betAmount);

  const sidePots = [];
  let remainingPlayers = [...sortedPlayers];

  while (remainingPlayers.length > 1) {
    const smallestBet = remainingPlayers[0].betAmount;
    const potAmount = smallestBet * remainingPlayers.length;

    sidePots.push({
      amount: potAmount,
      players: remainingPlayers.map(p => p.userId),
      minBet: smallestBet
    });

    // 从剩余玩家的下注中扣除已分配的部分
    remainingPlayers = remainingPlayers.map(p => ({
      ...p,
      betAmount: p.betAmount - smallestBet
    })).filter(p => p.betAmount > 0);
  }

  // 最后一个边池（如果有）
  if (remainingPlayers.length === 1 && remainingPlayers[0].betAmount > 0) {
    sidePots.push({
      amount: remainingPlayers[0].betAmount,
      players: [remainingPlayers[0].userId],
      minBet: remainingPlayers[0].betAmount
    });
  }

  return { sidePots };
}

/**
 * 结算游戏
 * @param {Object} gameState - 游戏状态
 * @param {Function} evaluateHand - 牌型评估函数
 * @returns {Object} { winners, potDistribution, handResults }
 */
function settleGame(gameState, evaluateHand) {
  const { players, communityCards, pot } = gameState;

  // 计算底池分配
  const { sidePots } = calculatePots(gameState);

  // 评估每个玩家的手牌
  const handResults = players
    .filter(p => !p.fold)
    .map(player => ({
      userId: player.userId,
      hand: evaluateHand(player.cards, communityCards)
    }));

  // 按牌力排序
  handResults.sort((a, b) => a.hand.rank !== b.hand.rank
    ? b.hand.rank - a.hand.rank
    : b.hand.value - a.hand.value
  );

  // 分配底池
  const potDistribution = [];
  const winners = [];

  for (let index = 0; index < sidePots.length; index++) {
    const sidePot = sidePots[index];
    // 找出参与该边池的玩家中牌力最好的
    const participants = handResults.filter(hr =>
      sidePot.players.includes(hr.userId)
    );

    if (participants.length === 0) continue;

    const bestHandRank = participants[0].hand.rank;
    const bestHandValue = participants[0].hand.value;

    // 找出所有牌力相同的玩家
    const potWinners = participants.filter(p =>
      p.hand.rank === bestHandRank && p.hand.value === bestHandValue
    );

    const share = Math.floor(sidePot.amount / potWinners.length);
    const remainder = sidePot.amount % potWinners.length;

    potWinners.forEach((winner, i) => {
      const winAmount = share + (i < remainder ? 1 : 0);
      potDistribution.push({
        userId: winner.userId,
        amount: winAmount,
        potIndex: index
      });
      winners.push(winner.userId);
    });
  }

  return {
    winners: [...new Set(winners)],
    potDistribution,
    handResults,
    sidePots
  };
}

/**
 * 更新庄位
 * @param {Object} gameState - 游戏状态
 * @returns {Object} 新的游戏状态
 */
function advanceDealer(gameState) {
  const { dealerIndex, players } = gameState;
  const newDealerIndex = (dealerIndex + 1) % players.length;
  return { ...gameState, dealerIndex: newDealerIndex };
}

module.exports = {
  initGameState,
  dealCards,
  postBlinds,
  playerAction,
  isRoundEnded,
  advanceRound,
  calculatePots,
  settleGame,
  advanceDealer,
  _deal
};