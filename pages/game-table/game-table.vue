<template>
	<view class="container">
		<view v-if="loading" class="loading">加载中...</view>

		<view v-else-if="room" class="game-container">
			<view class="room-header">
				<text class="room-name">🏠 {{room.roomName}}</text>
				<text class="round-text">{{getRoundText(room.round)}}</text>
			</view>

			<view class="pot-display">
				<text class="pot-label">💰 底池: {{room.pot}}</text>
			</view>

			<!-- 公共牌区域 -->
			<view class="community-cards">
				<view v-if="room.communityCards.length > 0" class="cards-container">
					<view
						v-for="(card, index) in room.communityCards"
						:key="index"
						class="card"
					>
						<text class="card-text">{{formatCard(card)}}</text>
					</view>
				</view>
				<view v-else class="empty-cards">
					<text>暂无公共牌</text>
				</view>
			</view>

			<!-- 玩家区域 - 上方对手 -->
			<view class="opponents-area">
				<view
					v-for="(player, index) in opponents"
					:key="player.userId"
					class="opponent-card"
				>
					<view class="player-name">
						<text>{{player.nickname}}</text>
						<text v-if="player.folded" class="folded-text">[❌ 弃牌]</text>
						<text v-if="player.allIn" class="allin-text">[🔴 全下]</text>
					</view>
					<view class="player-coins">
						<text>💰 {{player.coins}}</text>
					</view>
					<view v-if="!player.folded" class="player-bet">
						<text>下注: {{player.betAmount || 0}}</text>
					</view>
					<view v-if="index === room.currentPlayerIndex" class="current-player">
						<text>⏳ 等待行动</text>
					</view>
				</view>
			</view>

			<!-- 自己的手牌 -->
			<view class="my-cards">
				<view class="my-cards-label">🃏 你的手牌:</view>
				<view v-if="myPlayer && myPlayer.cards" class="my-cards-container">
					<view
						v-for="(card, index) in myPlayer.cards"
						:key="index"
						class="my-card"
					>
						<text class="card-text">{{formatCard(card)}}</text>
					</view>
				</view>
				<view v-else class="no-cards">
					<text>暂无手牌</text>
				</view>

				<view v-if="myPlayer" class="my-status">
					<text>💰 金币: {{myPlayer.coins}}</text>
					<text v-if="myPlayer.betAmount"> | 已下注: {{myPlayer.betAmount}}</text>
				</view>

				<view v-if="isMyTurn" class="my-turn">
					<text class="highlight">👉 你的回合！</text>
				</view>
			</view>

			<!-- 行动面板 -->
			<view v-if="isMyTurn && !gameEnded" class="action-panel">
				<view class="action-row">
					<button
						v-if="canCheck"
						class="action-btn check-btn"
						@click="doAction('check')"
					>
						✓ 过牌
					</button>
					<button
						v-else
						class="action-btn call-btn"
						@click="doAction('call')"
					>
						✓ 跟注 {{currentCallAmount}}
					</button>
				</view>

				<view class="action-row">
					<view class="raise-input">
						<button class="action-btn raise-btn" @click="showRaiseInput">
							⬆️ 加注
						</button>
						<input
							v-if="showRaise"
							v-model="raiseAmount"
							class="raise-amount"
							type="number"
							placeholder="输入金额"
							@confirm="doRaise"
						/>
						<button v-if="showRaise" class="confirm-btn" @click="doRaise">✓</button>
					</view>

					<button class="action-btn allin-btn" @click="doAction('allin')">
						🔴 全下
					</button>
				</view>

				<view class="action-row">
					<button class="action-btn fold-btn" @click="doFold">
						❌ 弃牌
					</button>
				</view>
			</view>

			<!-- 游戏结束提示 -->
			<view v-if="gameEnded" class="game-over">
				<text class="game-over-text">🎉 游戏结束！</text>
				<button class="result-btn" @click="goToResult">📊 查看结果</button>
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
			currentUserId: '',
			showRaise: false,
			raiseAmount: '',
			timer: null,
			gameStarted: false
		}
	},

	computed: {
		myPlayer() {
			if (!this.room) return null
			return this.room.players.find(p => p.userId === this.currentUserId)
		},

		opponents() {
			if (!this.room) return []
			return this.room.players.filter(p => p.userId !== this.currentUserId)
		},

		currentCallAmount() {
			if (!this.room || !this.myPlayer) return 0
			return this.room.currentBet - (this.myPlayer.betAmount || 0)
		},

		canCheck() {
			if (!this.room || !this.myPlayer) return false
			return this.room.currentBet === (this.myPlayer.betAmount || 0)
		},

		isMyTurn() {
			if (!this.room || !this.myPlayer) return false
			const myIndex = this.room.players.findIndex(p => p.userId === this.currentUserId)
			return this.room.currentPlayerIndex === myIndex
		},

		gameEnded() {
			if (!this.room) return false
			return this.room.gameState === 'finished'
		}
	},

	onLoad(options) {
		this.roomId = options.roomId
		this.loadGameInfo()
		this.startAutoRefresh()

		// 获取当前用户信息
		const userInfo = uni.getStorageSync('userInfo')
		if (userInfo && userInfo.uid) {
			this.currentUserId = userInfo.uid
		}
	},

	onUnload() {
		this.stopAutoRefresh()
	},

	methods: {
		async loadGameInfo() {
			this.loading = true
			try {
				const db = uniCloud.database()
				const res = await db.collection('game_rooms')
					.doc(this.roomId)
					.get()

				if (res.data && res.data.length > 0) {
					this.room = res.data[0]

					// 检查游戏是否结束
					if (this.room.gameState === 'finished' && !this.gameEnded) {
						this.gameEnded = true
					}
				} else {
					uni.showToast({
						title: '房间不存在',
						icon: 'none'
					})
					setTimeout(() => {
						uni.navigateBack()
					}, 1500)
				}
			} catch (error) {
				console.error('加载游戏信息失败:', error)
				uni.showToast({
					title: '加载失败',
					icon: 'none'
				})
			} finally {
				this.loading = false
			}
		},

		async doAction(actionType, amount) {
			try {
				uni.showLoading({ title: '处理中...' })

				// 调用云函数
				const res = await uniCloud.callFunction({
					name: 'player-action',
					data: {
						roomId: this.roomId,
						action: actionType,
						amount: amount || 0
					}
				})

				uni.hideLoading()

				if (res.result.code === 200) {
					uni.showToast({
						title: '行动成功',
						icon: 'success'
					})
					this.loadGameInfo()
					this.showRaise = false
					this.raiseAmount = ''
				} else {
					uni.showToast({
						title: res.result.message || '行动失败',
						icon: 'none'
					})
				}
			} catch (error) {
				console.error('行动失败:', error)
				uni.hideLoading()
				uni.showToast({
					title: error.message || '行动失败',
					icon: 'none'
				})
			}
		},

		doRaise() {
			const amount = parseInt(this.raiseAmount)
			if (!amount || amount <= this.room.currentBet) {
				uni.showToast({
					title: '加注金额必须大于当前下注额',
					icon: 'none'
				})
				return
			}
			this.doAction('raise', amount)
		},

		doFold() {
			uni.showModal({
				title: '确认弃牌？',
				content: '弃牌后将失去本局游戏资格',
				success: (res) => {
					if (res.confirm) {
						this.doAction('fold')
					}
				}
			})
		},

		showRaiseInput() {
			this.showRaise = true
			this.$nextTick(() => {
				// 聚焦输入框
			})
		},

		formatCard(card) {
			if (!card) return ''
			// card 格式: suit + rank, 例如 "heartA", "spadeK"
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

		getRoundText(round) {
			const roundMap = {
				'preflop': '🎴 翻牌前',
				'flop': '🎴 翻牌',
				'turn': '🎴 转牌',
				'river': '🎴 河牌',
				'showdown': '🎴 摊牌'
			}
			return roundMap[round] || round
		},

		goToResult() {
			uni.navigateTo({
				url: `/pages/game-result/game-result?roomId=${this.roomId}`
			})
		},

		startAutoRefresh() {
			this.timer = setInterval(() => {
				this.loadGameInfo()
			}, 1500)
		},

		stopAutoRefresh() {
			if (this.timer) {
				clearInterval(this.timer)
				this.timer = null
			}
		}
	}
}
</script>

<style scoped>
.container {
	padding: 20rpx;
	background-color: #1a1a1a;
	min-height: 100vh;
}

.loading {
	text-align: center;
	padding: 200rpx 0;
	font-size: 32rpx;
	color: #999;
}

.game-container {
	background-color: #2a2a2a;
	border-radius: 20rpx;
	padding: 30rpx;
	box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.5);
}

.room-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20rpx;
	padding-bottom: 20rpx;
	border-bottom: 2rpx solid #444;
}

.room-name {
	font-size: 36rpx;
	font-weight: bold;
	color: #fff;
}

.round-text {
	font-size: 28rpx;
	color: #FF9500;
}

.pot-display {
	text-align: center;
	margin-bottom: 30rpx;
	padding: 20rpx;
	background-color: #333;
	border-radius: 10rpx;
}

.pot-label {
	font-size: 32rpx;
	color: #FFD700;
	font-weight: bold;
}

.community-cards {
	margin-bottom: 40rpx;
}

.cards-container {
	display: flex;
	justify-content: center;
	gap: 20rpx;
	margin-bottom: 20rpx;
}

.card {
	width: 120rpx;
	height: 160rpx;
	background-color: #fff;
	border-radius: 10rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 4rpx 8rpx rgba(0,0,0,0.3);
}

.card-text {
	font-size: 40rpx;
	font-weight: bold;
}

.empty-cards {
	text-align: center;
	padding: 40rpx 0;
	color: #666;
}

.opponents-area {
	margin-bottom: 40rpx;
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

.opponent-card {
	background-color: #333;
	padding: 20rpx;
	border-radius: 10rpx;
}

.player-name {
	font-size: 28rpx;
	color: #fff;
	margin-bottom: 10rpx;
}

.player-name text:last-child {
	margin-left: 10rpx;
}

.folded-text {
	color: #ff4444;
	font-size: 24rpx;
}

.allin-text {
	color: #ff0000;
	font-size: 24rpx;
}

.player-coins {
	font-size: 26rpx;
	color: #FFD700;
	margin-bottom: 10rpx;
}

.player-bet {
	font-size: 24rpx;
	color: #999;
}

.current-player {
	margin-top: 10rpx;
	padding: 10rpx;
	background-color: #4a90e2;
	border-radius: 5rpx;
}

.current-player text {
	color: white;
	font-size: 24rpx;
}

.my-cards {
	margin-bottom: 40rpx;
	padding: 30rpx;
	background-color: #333;
	border-radius: 10rpx;
}

.my-cards-label {
	font-size: 28rpx;
	color: #fff;
	margin-bottom: 20rpx;
}

.my-cards-container {
	display: flex;
	justify-content: center;
	gap: 20rpx;
	margin-bottom: 20rpx;
}

.my-card {
	width: 140rpx;
	height: 180rpx;
	background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
	border-radius: 10rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 8rpx 16rpx rgba(0,0,0,0.5);
}

.my-card .card-text {
	font-size: 48rpx;
	color: white;
	font-weight: bold;
}

.no-cards {
	text-align: center;
	padding: 40rpx 0;
	color: #666;
}

.my-status {
	font-size: 26rpx;
	color: #FFD700;
	margin-top: 20rpx;
	text-align: center;
}

.my-turn {
	margin-top: 15rpx;
	text-align: center;
}

.highlight {
	color: #4CAF50;
	font-size: 28rpx;
	font-weight: bold;
	animation: pulse 1.5s infinite;
}

@keyframes pulse {
	0%, 100% { opacity: 1; }
	50% { opacity: 0.5; }
}

.action-panel {
	margin-top: 30rpx;
	padding: 30rpx;
	background-color: #333;
	border-radius: 10rpx;
}

.action-row {
	display: flex;
	gap: 20rpx;
	margin-bottom: 20rpx;
}

.action-btn {
	flex: 1;
	padding: 20rpx 0;
	border-radius: 10rpx;
	border: none;
	font-size: 28rpx;
	font-weight: bold;
}

.check-btn {
	background-color: #4CAF50;
	color: white;
}

.call-btn {
	background-color: #2196F3;
	color: white;
}

.raise-btn {
	background-color: #FF9800;
	color: white;
}

.allin-btn {
	background-color: #f44336;
	color: white;
}

.fold-btn {
	background-color: #999;
	color: white;
}

.raise-input {
	display: flex;
	align-items: center;
	gap: 15rpx;
	flex: 1;
}

.raise-amount {
	flex: 1;
	background-color: #444;
	color: white;
	border: 2rpx solid #555;
	border-radius: 5rpx;
	padding: 10rpx 15rpx;
	font-size: 26rpx;
}

.confirm-btn {
	background-color: #4CAF50;
	color: white;
	border: none;
	border-radius: 5rpx;
	padding: 10rpx 20rpx;
	font-size: 26rpx;
}

.game-over {
	text-align: center;
	margin-top: 40rpx;
	padding: 40rpx;
	background-color: #4CAF50;
	border-radius: 10rpx;
}

.game-over-text {
	display: block;
	font-size: 36rpx;
	color: white;
	margin-bottom: 20rpx;
}

.result-btn {
	background-color: white;
	color: #4CAF50;
	border: none;
	border-radius: 50rpx;
	padding: 20rpx 60rpx;
	font-size: 30rpx;
	font-weight: bold;
	margin-top: 20rpx;
}
</style>
