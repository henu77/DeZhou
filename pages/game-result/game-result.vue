<template>
	<view class="container">
		<view v-if="loading" class="loading">加载中...</view>

		<view v-else-if="room" class="result-container">
			<view class="winner-section">
				<text class="winner-crown">🏆</text>
				<text class="winner-title">游戏结束</text>
				<text class="winner-name" v-if="winners.length > 0">
					获胜者: {{getWinnerNames()}}
				</text>
			</view>

			<!-- 公共牌展示 -->
			<view v-if="room.communityCards.length > 0" class="community-cards">
				<text class="section-title">🎴 公共牌</text>
				<view class="cards-container">
					<view
						v-for="(card, index) in room.communityCards"
						:key="index"
						class="card"
					>
						<text class="card-text">{{formatCard(card)}}</text>
					</view>
				</view>
			</view>

			<!-- 玩家结果列表 -->
			<view class="players-results">
				<text class="section-title">👥 玩家战绩</text>

				<view
					v-for="(player, index) in room.players"
					:key="player.userId"
					class="player-result"
					:class="{ winner: isWinner(player.userId), folded: player.folded }"
				>
					<view class="player-header">
						<text class="player-rank">{{index + 1}}.</text>
						<text class="player-name">
							{{player.nickname}}
							<text v-if="isWinner(player.userId)" class="crown">👑</text>
						</text>
						<text v-if="player.folded" class="folded-badge">[弃牌]</text>
					</view>

					<view class="player-cards">
						<text>🃏 手牌:</text>
						<view class="cards-row">
							<view
								v-for="(card, idx) in player.cards"
								:key="idx"
								class="small-card"
							>
								<text class="card-text">{{formatCard(card)}}</text>
							</view>
						</view>
					</view>

					<view class="player-hand">
						<text>🎯 牌型: {{getHandType(player)}}</text>
					</view>

					<view class="player-coins">
						<text>💰 金币: {{player.coins}}</text>
						<text v-if="player.netChange !== undefined" :class="['net-change', getChangeClass(player.netChange)]">
							{{player.netChange >= 0 ? '+' : ''}}{{player.netChange}}
						</text>
					</view>
				</view>
			</view>

			<!-- 底池分配 -->
			<view v-if="room.pot > 0" class="pot-distribution">
				<text class="section-title">💰 底池分配</text>
				<text class="pot-total">总底池: {{room.pot}}</text>
			</view>

			<!-- 按钮组 -->
			<view class="action-buttons">
				<button class="back-room-btn" @click="backToRoom">🏠 返回房间</button>
				<button class="back-home-btn" @click="backToHome">⌂ 首页</button>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			roomId: '',
			room: null,
			loading: false,
			winners: []
		}
	},

	onLoad(options) {
		this.roomId = options.roomId
		this.loadResult()
	},

	methods: {
		async loadResult() {
			this.loading = true
			try {
				const db = uniCloud.database()
				const res = await db.collection('game_rooms')
					.doc(this.roomId)
					.get()

				if (res.data && res.data.length > 0) {
					this.room = res.data[0]

					// 计算获胜者（简化逻辑：金币增加最多的玩家）
					this.calculateWinners()
				} else {
					uni.showToast({
						title: '房间不存在',
						icon: 'none'
					})
				}
			} catch (error) {
				console.error('加载结果失败:', error)
				uni.showToast({
					title: '加载失败',
					icon: 'none'
				})
			} finally {
				this.loading = false
			}
		},

		calculateWinners() {
			if (!this.room) return

			// 简化逻辑：找出没有弃牌且金币最多的玩家
			const activePlayers = this.room.players.filter(p => !p.folded)
			if (activePlayers.length === 0) return

			const maxCoins = Math.max(...activePlayers.map(p => p.coins))
			this.winners = activePlayers.filter(p => p.coins === maxCoins).map(p => p.userId)
		},

		getWinnerNames() {
			if (!this.room || this.winners.length === 0) return '无人获胜'
			return this.winners.map(winnerId => {
				const player = this.room.players.find(p => p.userId === winnerId)
				return player ? player.nickname : ''
			}).join('、')
		},

		isWinner(userId) {
			return this.winners.includes(userId)
		},

		getHandType(player) {
			// TODO: 调用牌型评估函数
			// 这里暂时显示简化信息
			if (player.folded) return '已弃牌'
			if (!player.cards || player.cards.length === 0) return '未发牌'

			// 简化显示：根据牌面猜测
			// 实际应该调用 hand-evaluator.js
			return '待计算'
		},

		formatCard(card) {
			if (!card) return ''
			const suitMap = {
				'spade': '♠',
				'heart': '♥',
				'diamond': '♦',
				'club': '♣'
			}
			const suit = card.slice(0, -1)
			const rank = card.slice(-1)
			const suitChar = suitMap[suit] || suit
			return `${suitChar}${rank}`
		},

		getChangeClass(change) {
			return change >= 0 ? 'positive' : 'negative'
		},

		backToRoom() {
			uni.showModal({
				title: '提示',
				content: '返回房间后可以继续游戏',
				confirmText: '确认返回',
				cancelText: '取消',
				success: (res) => {
					if (res.confirm) {
						uni.redirectTo({
							url: `/pages/room-detail/room-detail?roomId=${this.roomId}`
						})
					}
				}
			})
		},

		backToHome() {
			uni.showModal({
				title: '提示',
				content: '返回首页后将离开当前房间',
				confirmText: '确认离开',
				cancelText: '取消',
				success: (res) => {
					if (res.confirm) {
						uni.redirectTo({
							url: '/pages/index/index'
						})
					}
				}
			})
		}
	}
}
</script>

<style scoped>
.container {
	padding: 20rpx;
	background-color: #f5f5f5;
	min-height: 100vh;
}

.loading {
	text-align: center;
	padding: 200rpx 0;
	font-size: 32rpx;
	color: #999;
}

.result-container {
	background-color: white;
	border-radius: 20rpx;
	padding: 40rpx;
	box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.1);
}

.winner-section {
	text-align: center;
	margin-bottom: 40rpx;
	padding-bottom: 30rpx;
	border-bottom: 4rpx solid #FFD700;
}

.winner-crown {
	font-size: 80rpx;
	display: block;
	margin-bottom: 20rpx;
}

.winner-title {
	display: block;
	font-size: 40rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 15rpx;
}

.winner-name {
	display: block;
	font-size: 28rpx;
	color: #666;
}

.community-cards {
	margin-bottom: 40rpx;
}

.section-title {
	display: block;
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 25rpx;
}

.cards-container {
	display: flex;
	justify-content: center;
	gap: 15rpx;
	flex-wrap: wrap;
}

.card {
	width: 100rpx;
	height: 140rpx;
	background-color: #f9f9f9;
	border: 2rpx solid #e0e0e0;
	border-radius: 10rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.card-text {
	font-size: 32rpx;
	font-weight: bold;
}

.players-results {
	margin-bottom: 40rpx;
}

.player-result {
	background-color: #f9f9f9;
	border-radius: 15rpx;
	padding: 25rpx;
	margin-bottom: 20rpx;
	border-left: 8rpx solid #ccc;
}

.player-result.winner {
	background-color: #FFF9E6;
	border-left-color: #FFD700;
	box-shadow: 0 4rpx 8rpx rgba(255,215,0,0.2);
}

.player-result.folded {
	opacity: 0.6;
}

.player-header {
	display: flex;
	align-items: center;
	margin-bottom: 15rpx;
}

.player-rank {
	font-size: 28rpx;
	color: #999;
	margin-right: 10rpx;
	min-width: 40rpx;
}

.player-name {
	font-size: 30rpx;
	font-weight: bold;
	color: #333;
	flex: 1;
}

.crown {
	font-size: 28rpx;
	margin-left: 10rpx;
	color: #FFD700;
}

.folded-badge {
	font-size: 24rpx;
	color: #ff4444;
	background-color: #ffebee;
	padding: 5rpx 10rpx;
	border-radius: 5rpx;
}

.player-cards {
	display: flex;
	align-items: center;
	margin-bottom: 10rpx;
}

.player-cards text {
	font-size: 26rpx;
	color: #666;
	margin-right: 15rpx;
}

.cards-row {
	display: flex;
	gap: 10rpx;
}

.small-card {
	width: 80rpx;
	height: 110rpx;
	background-color: #fff;
	border: 2rpx solid #e0e0e0;
	border-radius: 8rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.player-hand {
	margin-bottom: 10rpx;
}

.player-hand text {
	font-size: 26rpx;
	color: #666;
}

.player-coins {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.player-coins text:first-child {
	font-size: 28rpx;
	color: #FF9500;
	font-weight: bold;
}

.net-change {
	font-size: 28rpx;
	font-weight: bold;
	padding: 5rpx 15rpx;
	border-radius: 50rpx;
}

.net-change.positive {
	background-color: #e6f7ee;
	color: #52c41a;
}

.net-change.negative {
	background-color: #fff1f0;
	color: #ff4d4f;
}

.pot-distribution {
	margin-bottom: 40rpx;
	padding: 25rpx;
	background-color: #FFF9E6;
	border-radius: 15rpx;
	border-left: 8rpx solid #FFD700;
}

.pot-total {
	display: block;
	font-size: 28rpx;
	color: #333;
	margin-top: 10rpx;
}

.action-buttons {
	display: flex;
	gap: 20rpx;
}

.back-room-btn,
.back-home-btn {
	flex: 1;
	padding: 25rpx 0;
	border-radius: 50rpx;
	border: none;
	font-size: 30rpx;
	font-weight: bold;
}

.back-room-btn {
	background-color: #007AFF;
	color: white;
}

.back-home-btn {
	background-color: #f5f5f5;
	color: #666;
}
</style>
