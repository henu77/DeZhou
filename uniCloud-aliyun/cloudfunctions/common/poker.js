/**
 * 扑克牌工具函数
 */

// 花色
const SUITS = ['♠', '♥', '♣', '♦'];
// 点数
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

/**
 * 创建一副新牌
 * @returns {Array} 牌组
 */
function createDeck() {
	const deck = [];
	for (const suit of SUITS) {
		for (const rank of RANKS) {
			deck.push({
				suit,
				rank,
				value: getRankValue(rank)
			});
		}
	}
	return deck;
}

/**
 * 获取点数值
 * @param {string} rank - 点数
 * @returns {number} 点数值
 */
function getRankValue(rank) {
	const values = {
		'2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
		'J': 11, 'Q': 12, 'K': 13, 'A': 14
	};
	return values[rank];
}

/**
 * 洗牌
 * @param {Array} deck - 牌组
 * @returns {Array} 洗牌后的牌组
 */
function shuffleDeck(deck) {
	const shuffled = [...deck];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled;
}

/**
 * 将字符串格式转换为牌对象
 * @param {Array} cardStrings - 字符串格式牌数组
 * @returns {Array} 牌对象数组
 */
function stringToCards(cardStrings) {
	return cardStrings.map(str => {
		const suit = str.charAt(0);
		const rank = str.substring(1);
		return {
			suit,
			rank,
			value: getRankValue(rank)
		};
	});
}

/**
 * 将牌转换为字符串格式
 * @param {Array} cards - 牌数组
 * @returns {Array} 字符串格式牌数组
 */
function cardsToString(cards) {
	return cards.map(card => `${card.suit}${card.rank}`);
}

/**
 * 获取牌的显示文本（用于调试）
 * @param {Object} card - 牌对象
 * @returns {string} 显示文本
 */
function getCardDisplay(card) {
	return `${card.suit}${card.rank}`;
}

module.exports = {
	SUITS,
	RANKS,
	createDeck,
	getRankValue,
	shuffleDeck,
	cardsToString,
	stringToCards,
	getCardDisplay
};