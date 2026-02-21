<template>
	<view class="container">
		<view v-if="loading" class="loading">加载中...</view>

		<view v-else-if="room" class="room-container">
			<view class="room-header">
				<text class="room-name">🏠 {{room.roomName}}</text>
				<text class="room-id">ID: {{room._id}}</text>
			</view>

			<view class="room-info">
				<text>👥 {{room.players.length}}/{{room.maxPlayers}}人</text>
				<text>💰 小{{room.smallBlind}}/大{{room.bigBlind}}</text>
				<text class="status">{{getStatusText(room.gameState)}}</text>
			</view>

			<view class="players-list">
				<view class="players-title">👥 玩家列表</view>

				<view class="player-item" v-for="(player, index) in room.players" :key="player.userId">
					<view class="player-left">
						<text :class="['status-dot', getPlayerStatusClass(player)]">
							{{getPlayerStatusEmoji(player)}}
						</text>
						<text class="player-name">{{player.nickname}}</text>
					</view>

					<view class="player-right">
						<text class="coins">💰 {{player.coins}}</text>
						<view class="player-action" v-if="player.userId === currentUserId">
							<button
								class="ready-btn"
								:class="{'ready': isReady}"
								@click="toggleReady"
							>
								{{ isReady ? '✓ 已准备' : '✓ 准备' }}
							</button>
						</view>
						<view class="player-ready" v-else>
							<text :class="['ready-status', player.ready ? 'ready' : 'not-ready']">
								{{player.ready ? '✓ 已准备' : '○ 未准备'}}
							</text>
						</view>
					</view>
				</view>
			</view>

			<view class="action-buttons">
				<view v-if="isOwner && allReady && room.players.length > 1" class="owner-actions">
					<button class="start-btn" @click="startGame">🚀 开始游戏</button>
				</view>

				<view v-if="!isOwner || room.players.length === 1" class="player-actions">
					<button v-if="isOwner" class="leave-btn" @click="leaveRoom">🚪 离开房间</button>
					<button v-else class="leave-btn" @click="leaveRoom">🚪 离开房间</button>
				</view>
			</view>

			<view v-if="room.gameState === 'playing'" class="game-started">
				<text>🎮 游戏已开始，正在跳转...</text>
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
			isOwner: false,
			isReady: false,
			timer: null,
			gameStarted: false
		}
	},

	computed: {
		allReady() {
			return this.room && this.room.players.every(p => p.ready)
		}
	},

	onLoad(options) {
		this.roomId = options.roomId
		this.joinRoom()

		// 获取当前用户信息
		const currentUser = uni.getStorageSync('currentUser')
		if (currentUser && currentUser._id) {
			this.currentUserId = currentUser._id
		}
	},

	onShow() {
		this.loadRoomInfo()
	},

	onUnload() {
		// 无需清理
	},

	methods: {
		async joinRoom() {
			// 获取当前用户信息
			const currentUser = uni.getStorageSync('currentUser')
			if (!currentUser || !currentUser._id) {
				uni.showToast({
					title: '请先登录',
					icon: 'none'
				})
				setTimeout(() => {
					uni.navigateTo({
						url: '/pages/login/login'
					})
				}, 1500)
				return
			}
			this.currentUserId = currentUser._id

			// 检查是否已在房间中（通过检查本地存储的房间 ID）
			const joinedRoomId = uni.getStorageSync('joinedRoomId')
			if (joinedRoomId === this.roomId) {
				// 已在房间中，直接加载信息
				this.loadRoomInfo()
				return
			}

			try {
				// 调用云函数加入房间
				const res = await uniCloud.callFunction({
					name: 'join-room',
					data: {
						roomId: this.roomId,
						userId: this.currentUserId
					}
				})

				if (res.result.code === 200) {
					// 保存已加入的房间 ID
					uni.setStorageSync('joinedRoomId', this.roomId)
					this.loadRoomInfo()
				} else {
					// 加入失败（如房间已满），显示错误
					uni.showToast({
						title: res.result.message || '加入失败',
						icon: 'none',
						duration: 3000
					})
					setTimeout(() => {
						uni.navigateBack()
					}, 1500)
				}
			} catch (error) {
				console.error('加入房间失败:', error)
				uni.showToast({
					title: error.message || '加入失败',
					icon: 'none',
					duration: 3000
				})
			}
		},

		async loadRoomInfo() {
			this.loading = true
			try {
				const db = uniCloud.database()
				const res = await db.collection('game_rooms')
					.doc(this.roomId)
					.get()

				if (res.data) {
					this.room = res.data
					this.isOwner = this.room.creatorId === this.currentUserId

					// 检查当前用户是否已准备
					const currentPlayer = this.room.players.find(p => p.userId === this.currentUserId)
					this.isReady = currentPlayer ? currentPlayer.ready : false

					// 检查游戏是否已开始
					if (this.room.gameState === 'playing' && !this.gameStarted) {
						this.gameStarted = true
						setTimeout(() => {
							this.goToGameTable()
						}, 1000)
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
				console.error('加载房间信息失败:', error)
				uni.showToast({
					title: '加载失败',
					icon: 'none'
				})
			} finally {
				this.loading = false
			}
		},

		async toggleReady() {
			try {
				uni.showLoading({ title: '处理中...' })

				// 调用云函数
				const res = await uniCloud.callFunction({
					name: 'ready-game',
					data: {
						roomId: this.roomId,
						ready: !this.isReady,
						userId: this.currentUserId
					}
				})

				uni.hideLoading()

				if (res.result.code === 200) {
					this.isReady = !this.isReady
					uni.showToast({
						title: this.isReady ? '准备成功' : '取消准备',
						icon: 'success'
					})
					this.loadRoomInfo()
				} else {
					uni.showToast({
						title: res.result.message || '操作失败',
						icon: 'none'
					})
				}
			} catch (error) {
				console.error('准备操作失败:', error)
				uni.hideLoading()
				uni.showToast({
					title: error.message || '操作失败',
					icon: 'none'
				})
			}
		},

		async startGame() {
			if (!this.allReady) {
				uni.showToast({
					title: '请等待所有玩家准备',
					icon: 'none'
				})
				return
			}

			try {
				uni.showLoading({ title: '游戏开始中...' })

				// 调用云函数
				const res = await uniCloud.callFunction({
					name: 'start-game',
					data: {
						roomId: this.roomId,
						userId: this.currentUserId
					}
				})

				uni.hideLoading()

				if (res.result.code === 200) {
					uni.showToast({
						title: '游戏开始',
						icon: 'success'
					})
					// 等待房间状态更新
					setTimeout(() => {
						this.goToGameTable()
					}, 1000)
				} else {
					uni.showToast({
						title: res.result.message || '游戏开始失败',
						icon: 'none'
					})
				}
			} catch (error) {
				console.error('开始游戏失败:', error)
				uni.hideLoading()
				uni.showToast({
					title: error.message || '游戏开始失败',
					icon: 'none'
				})
			}
		},

		async leaveRoom() {
			try {
				const confirm = await this.showConfirm('确认离开房间？')
				if (!confirm) return

				uni.showLoading({ title: '退出中...' })

				// 调用云函数
				const res = await uniCloud.callFunction({
					name: 'leave-room',
					data: {
						roomId: this.roomId,
						userId: this.currentUserId
					}
				})

				uni.hideLoading()

				if (res.result.code === 200) {
					uni.showToast({
						title: '已退出房间',
						icon: 'success'
					})
					setTimeout(() => {
						uni.navigateBack()
					}, 1000)
				} else {
					uni.showToast({
						title: res.result.message || '退出失败',
						icon: 'none'
					})
				}
			} catch (error) {
				console.error('退出房间失败:', error)
				uni.hideLoading()
				uni.showToast({
					title: error.message || '退出失败',
					icon: 'none'
				})
			}
		},

		goToGameTable() {
			uni.navigateTo({
				url: `/pages/game-table/game-table?roomId=${this.roomId}`
			})
		},

		getStatusText(status) {
			const statusMap = {
				waiting: '🟡 等待中',
				playing: '🔴 进行中',
				finished: '⚫ 已结束'
			}
			return statusMap[status] || '🟡 等待中'
		},

		getPlayerStatusClass(player) {
			if (player.folded) return 'folded'
			if (player.allIn) return 'all-in'
			if (player.ready) return 'ready'
			return 'not-ready'
		},

		getPlayerStatusEmoji(player) {
			if (player.folded) return '⚫'
			if (player.allIn) return '🔴'
			if (player.ready) return '🟢'
			return '🟡'
		},

		showConfirm(message) {
			return new Promise((resolve) => {
				uni.showModal({
					title: '提示',
					content: message,
					success: (res) => {
						resolve(res.confirm)
					},
					fail: () => resolve(false)
				})
			})
		},

		startAutoRefresh() {
			this.timer = setInterval(() => {
				this.loadRoomInfo()
			}, 5000)
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
	background-color: #f5f5f5;
	min-height: 100vh;
}

.loading {
	text-align: center;
	padding: 200rpx 0;
	font-size: 32rpx;
	color: #999;
}

.room-container {
	background-color: white;
	border-radius: 20rpx;
	padding: 30rpx;
	box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.1);
}

.room-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20rpx;
	padding-bottom: 20rpx;
	border-bottom: 2rpx solid #f0f0f0;
}

.room-name {
	font-size: 36rpx;
	font-weight: bold;
	color: #333;
}

.room-id {
	font-size: 24rpx;
	color: #999;
}

.room-info {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 30rpx;
	padding: 20rpx;
	background-color: #f9f9f9;
	border-radius: 10rpx;
}

.room-info .status {
	color: #FF9500;
	font-weight: bold;
}

.players-list {
	margin-bottom: 30rpx;
}

.players-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 20rpx;
	padding-bottom: 15rpx;
	border-bottom: 2rpx solid #f0f0f0;
}

.player-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 25rpx 0;
	border-bottom: 2rpx solid #f5f5f5;
}

.player-left {
	display: flex;
	align-items: center;
}

.status-dot {
	font-size: 32rpx;
	margin-right: 15rpx;
}

.player-name {
	font-size: 28rpx;
	color: #333;
}

.player-right {
	display: flex;
	align-items: center;
	gap: 20rpx;
}

.coins {
	font-size: 28rpx;
	color: #FF9500;
	font-weight: bold;
}

.player-action {
	flex-shrink: 0;
}

.ready-btn {
	background-color: #ccc;
	color: white;
	border: none;
	border-radius: 50rpx;
	padding: 15rpx 40rpx;
	font-size: 26rpx;
}

.ready-btn.ready {
	background-color: #4CAF50;
}

.player-ready {
	flex-shrink: 0;
}

.ready-status {
	font-size: 24rpx;
	padding: 10rpx 20rpx;
	border-radius: 50rpx;
}

.ready-status.ready {
	background-color: #4CAF50;
	color: white;
}

.ready-status.not-ready {
	background-color: #f5f5f5;
	color: #999;
}

.action-buttons {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

.owner-actions,
.player-actions {
	display: flex;
	gap: 20rpx;
}

.start-btn {
	background-color: #007AFF;
	color: white;
	border: none;
	border-radius: 50rpx;
	padding: 25rpx 0;
	font-size: 32rpx;
	font-weight: bold;
	flex: 1;
}

.leave-btn {
	background-color: #f5f5f5;
	color: #666;
	border: 2rpx solid #e0e0e0;
	border-radius: 50rpx;
	padding: 25rpx 0;
	font-size: 32rpx;
	flex: 1;
}

.game-started {
	text-align: center;
	margin-top: 30rpx;
	padding: 30rpx;
	background-color: #E6F7FF;
	border-radius: 10rpx;
}

.game-started text {
	font-size: 28rpx;
	color: #1890FF;
}
</style>
