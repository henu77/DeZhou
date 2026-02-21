/**
 * 德州扑克牌型评估工具函数
 * 用于评估手牌、比较牌型大小
 */

// 牌型等级（从高到低）
const HAND_RANKS = {
  ROYAL_FLUSH: 10,      // 皇家同花顺
  STRAIGHT_FLUSH: 9,    // 同花顺
  FOUR_OF_A_KIND: 8,    // 四条
  FULL_HOUSE: 7,        // 葫芦
  FLUSH: 6,             // 同花
  STRAIGHT: 5,          // 顺子
  THREE_OF_A_KIND: 4,   // 三条
  TWO_PAIR: 3,          // 两对
  ONE_PAIR: 2,          // 一对
  HIGH_CARD: 1          // 高牌
};

// 牌型名称
const HAND_NAMES = {
  [HAND_RANKS.ROYAL_FLUSH]: '皇家同花顺',
  [HAND_RANKS.STRAIGHT_FLUSH]: '同花顺',
  [HAND_RANKS.FOUR_OF_A_KIND]: '四条',
  [HAND_RANKS.FULL_HOUSE]: '葫芦',
  [HAND_RANKS.FLUSH]: '同花',
  [HAND_RANKS.STRAIGHT]: '顺子',
  [HAND_RANKS.THREE_OF_A_KIND]: '三条',
  [HAND_RANKS.TWO_PAIR]: '两对',
  [HAND_RANKS.ONE_PAIR]: '一对',
  [HAND_RANKS.HIGH_CARD]: '高牌'
};

/**
 * 点数转数值（用于比较）
 * @param {string} rank - 点数
 * @returns {number} 数值
 */
function rankToValue(rank) {
  const values = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
    '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
  };
  return values[rank] || 0;
}

/**
 * 解析单张牌
 * @param {string} card - 牌（如 '♠A'）
 * @returns {Object} {rank, suit, value}
 */
function parseCard(card) {
  // 处理10的特殊情况
  let rank, suit;
  if (card.length === 3) {
    suit = card[0];
    rank = card.substring(1);
  } else {
    suit = card[0];
    rank = card.substring(1);
  }
  return {
    rank,
    suit,
    value: rankToValue(rank)
  };
}

/**
 * 解析多张牌
 * @param {string[]} cards - 牌数组
 * @returns {Object[]} 解析后的牌数组
 */
function parseCards(cards) {
  return cards.map(card => parseCard(card));
}

/**
 * 检查是否为同花
 * @param {Object[]} cards - 解析后的牌数组
 * @returns {Object|null} 同花牌组或null
 */
function checkFlush(cards) {
  const suitGroups = {};
  cards.forEach(card => {
    if (!suitGroups[card.suit]) {
      suitGroups[card.suit] = [];
    }
    suitGroups[card.suit].push(card);
  });

  for (const suit in suitGroups) {
    if (suitGroups[suit].length >= 5) {
      // 按点数降序排序
      return suitGroups[suit].sort((a, b) => b.value - a.value);
    }
  }
  return null;
}

/**
 * 检查是否为顺子
 * @param {Object[]} cards - 解析后的牌数组（去重后）
 * @returns {Object|null} 最大顺子牌组或null
 */
function checkStraight(cards) {
  // 按点数降序排序并去重
  const uniqueCards = [];
  const seenValues = new Set();
  cards.forEach(card => {
    if (!seenValues.has(card.value)) {
      seenValues.add(card.value);
      uniqueCards.push(card);
    }
  });
  uniqueCards.sort((a, b) => b.value - a.value);

  // 特殊处理 A-2-3-4-5 顺子（A作为1）
  const hasAce = uniqueCards.some(c => c.value === 14);
  if (hasAce) {
    const has2 = uniqueCards.some(c => c.value === 2);
    const has3 = uniqueCards.some(c => c.value === 3);
    const has4 = uniqueCards.some(c => c.value === 4);
    const has5 = uniqueCards.some(c => c.value === 5);

    if (has2 && has3 && has4 && has5) {
      // 找到5-4-3-2
      const wheelCards = uniqueCards
        .filter(c => [2, 3, 4, 5].includes(c.value))
        .sort((a, b) => b.value - a.value);
      // 添加A作为最低点数
      const aceCard = uniqueCards.find(c => c.value === 14);
      if (wheelCards.length === 4) {
        return [...wheelCards, { ...aceCard, value: 1 }];
      }
    }
  }

  // 检查普通顺子
  for (let i = 0; i <= uniqueCards.length - 5; i++) {
    let isStraight = true;
    for (let j = 0; j < 4; j++) {
      if (uniqueCards[i + j].value - uniqueCards[i + j + 1].value !== 1) {
        isStraight = false;
        break;
      }
    }
    if (isStraight) {
      return uniqueCards.slice(i, i + 5);
    }
  }

  return null;
}

/**
 * 统计点数出现次数
 * @param {Object[]} cards - 解析后的牌数组
 * @returns {Object} 点数统计
 */
function countRanks(cards) {
  const counts = {};
  cards.forEach(card => {
    if (!counts[card.value]) {
      counts[card.value] = { count: 0, cards: [] };
    }
    counts[card.value].count++;
    counts[card.value].cards.push(card);
  });
  return counts;
}

/**
 * 评估最佳牌型
 * @param {string[]} holeCards - 底牌（2张）
 * @param {string[]} communityCards - 公共牌（3-5张）
 * @returns {Object} {rank, name, cards, value}
 */
function evaluateHand(holeCards, communityCards) {
  const allCards = parseCards([...holeCards, ...communityCards]);
  allCards.sort((a, b) => b.value - a.value);

  // 1. 检查同花顺（包括皇家同花顺）
  const flushCards = checkFlush(allCards);
  if (flushCards) {
    const straightFlush = checkStraight(flushCards);
    if (straightFlush) {
      // 检查是否为皇家同花顺（10-J-Q-K-A）
      const isRoyal = straightFlush[0].value === 14 && straightFlush[4].value === 10;
      return {
        rank: isRoyal ? HAND_RANKS.ROYAL_FLUSH : HAND_RANKS.STRAIGHT_FLUSH,
        name: isRoyal ? HAND_NAMES[HAND_RANKS.ROYAL_FLUSH] : HAND_NAMES[HAND_RANKS.STRAIGHT_FLUSH],
        cards: straightFlush.map(c => `${c.suit}${c.rank}`),
        value: straightFlush[0].value
      };
    }
  }

  // 2. 检查四条
  const rankCounts = countRanks(allCards);
  const fourOfAKind = Object.entries(rankCounts).find(([_, data]) => data.count === 4);
  if (fourOfAKind) {
    const [value, data] = fourOfAKind;
    const kickers = allCards.filter(c => c.value !== parseInt(value)).slice(0, 1);
    return {
      rank: HAND_RANKS.FOUR_OF_A_KIND,
      name: HAND_NAMES[HAND_RANKS.FOUR_OF_A_KIND],
      cards: [...data.cards.map(c => `${c.suit}${c.rank}`), ...kickers.map(c => `${c.suit}${c.rank}`)],
      value: parseInt(value)
    };
  }

  // 3. 检查葫芦
  const threeOfAKind = Object.entries(rankCounts).find(([_, data]) => data.count === 3);
  const pairs = Object.entries(rankCounts).filter(([_, data]) => data.count >= 2);
  if (threeOfAKind) {
    const threeValue = parseInt(threeOfAKind[0]);
    const pair = pairs.find(([value, _]) => parseInt(value) !== threeValue);
    if (pair) {
      const [pairValue, pairData] = pair;
      return {
        rank: HAND_RANKS.FULL_HOUSE,
        name: HAND_NAMES[HAND_RANKS.FULL_HOUSE],
        cards: [
          ...threeOfAKind[1].cards.map(c => `${c.suit}${c.rank}`),
          ...pairData.cards.slice(0, 2).map(c => `${c.suit}${c.rank}`)
        ],
        value: threeValue * 100 + parseInt(pairValue)
      };
    }
  }

  // 4. 检查同花
  if (flushCards) {
    const bestFlush = flushCards.slice(0, 5);
    return {
      rank: HAND_RANKS.FLUSH,
      name: HAND_NAMES[HAND_RANKS.FLUSH],
      cards: bestFlush.map(c => `${c.suit}${c.rank}`),
      value: bestFlush[0].value
    };
  }

  // 5. 检查顺子
  const straight = checkStraight(allCards);
  if (straight) {
    return {
      rank: HAND_RANKS.STRAIGHT,
      name: HAND_NAMES[HAND_RANKS.STRAIGHT],
      cards: straight.map(c => `${c.suit}${c.rank}`),
      value: straight[0].value
    };
  }

  // 6. 检查三条
  if (threeOfAKind) {
    const [value, data] = threeOfAKind;
    const kickers = allCards.filter(c => c.value !== parseInt(value)).slice(0, 2);
    return {
      rank: HAND_RANKS.THREE_OF_A_KIND,
      name: HAND_NAMES[HAND_RANKS.THREE_OF_A_KIND],
      cards: [...data.cards.map(c => `${c.suit}${c.rank}`), ...kickers.map(c => `${c.suit}${c.rank}`)],
      value: parseInt(value)
    };
  }

  // 7. 检查两对
  if (pairs.length >= 2) {
    const sortedPairs = pairs.sort((a, b) => parseInt(b[0]) - parseInt(a[0]));
    const [highPair, lowPair] = [sortedPairs[0], sortedPairs[1]];
    const usedValues = [parseInt(highPair[0]), parseInt(lowPair[0])];
    const kickers = allCards.filter(c => !usedValues.includes(c.value)).slice(0, 1);

    return {
      rank: HAND_RANKS.TWO_PAIR,
      name: HAND_NAMES[HAND_RANKS.TWO_PAIR],
      cards: [
        ...highPair[1].cards.slice(0, 2).map(c => `${c.suit}${c.rank}`),
        ...lowPair[1].cards.slice(0, 2).map(c => `${c.suit}${c.rank}`),
        ...kickers.map(c => `${c.suit}${c.rank}`)
      ],
      value: parseInt(highPair[0]) * 100 + parseInt(lowPair[0])
    };
  }

  // 8. 检查一对
  if (pairs.length === 1) {
    const [value, data] = pairs[0];
    const kickers = allCards.filter(c => c.value !== parseInt(value)).slice(0, 3);

    return {
      rank: HAND_RANKS.ONE_PAIR,
      name: HAND_NAMES[HAND_RANKS.ONE_PAIR],
      cards: [...data.cards.slice(0, 2).map(c => `${c.suit}${c.rank}`), ...kickers.map(c => `${c.suit}${c.rank}`)],
      value: parseInt(value)
    };
  }

  // 9. 高牌
  const bestHighCards = allCards.slice(0, 5);
  return {
    rank: HAND_RANKS.HIGH_CARD,
    name: HAND_NAMES[HAND_RANKS.HIGH_CARD],
    cards: bestHighCards.map(c => `${c.suit}${c.rank}`),
    value: bestHighCards[0].value * 100000000 +
           (bestHighCards[1]?.value || 0) * 1000000 +
           (bestHighCards[2]?.value || 0) * 10000 +
           (bestHighCards[3]?.value || 0) * 100 +
           (bestHighCards[4]?.value || 0)
  };
}

/**
 * 比较两手牌的大小
 * @param {Object} hand1 - 第一手牌评估结果
 * @param {Object} hand2 - 第二手牌评估结果
 * @returns {number} 1: hand1大, -1: hand2大, 0: 相等
 */
function compareHands(hand1, hand2) {
  // 先比较牌型等级
  if (hand1.rank !== hand2.rank) {
    return hand1.rank > hand2.rank ? 1 : -1;
  }

  // 同牌型比较牌力值
  if (hand1.value !== hand2.value) {
    return hand1.value > hand2.value ? 1 : -1;
  }

  // 如果还相同，比较踢脚牌
  for (let i = 0; i < Math.min(hand1.cards.length, hand2.cards.length); i++) {
    const card1Value = rankToValue(parseCard(hand1.cards[i]).rank);
    const card2Value = rankToValue(parseCard(hand2.cards[i]).rank);
    if (card1Value !== card2Value) {
      return card1Value > card2Value ? 1 : -1;
    }
  }

  return 0;
}

/**
 * 找出获胜者
 * @param {Array} players - 玩家数组，每个包含 {userId, holeCards, folded}
 * @param {string[]} communityCards - 公共牌
 * @returns {Object} {winners: Array, handResults: Array}
 */
function findWinners(players, communityCards) {
  // 评估每个未弃牌玩家的手牌
  const handResults = players
    .filter(p => !p.folded)
    .map(player => {
      const hand = evaluateHand(player.holeCards, communityCards);
      return {
        userId: player.userId,
        ...hand
      };
    });

  // 按牌力排序
  handResults.sort((a, b) => compareHands(b, a));

  // 找出所有获胜者（可能有多个平分）
  const winners = [handResults[0]];
  for (let i = 1; i < handResults.length; i++) {
    if (compareHands(handResults[0], handResults[i]) === 0) {
      winners.push(handResults[i]);
    } else {
      break;
    }
  }

  return {
    winners,
    handResults
  };
}

/**
 * 获取牌型名称
 * @param {number} rank - 牌型等级
 * @returns {string}
 */
function getHandName(rank) {
  return HAND_NAMES[rank] || '未知';
}

module.exports = {
  HAND_RANKS,
  HAND_NAMES,
  evaluateHand,
  compareHands,
  findWinners,
  getHandName,
  parseCard,
  parseCards
};