<template>
	<view class="container">
		<view class="form-section">
			<view class="form-group">
				<text class="label">🏠 房间名称</text>
				<input
					v-model="roomName"
					class="input"
					placeholder="请输入房间名称"
					@input="validateRoomName"
				/>
			</view>

			<view class="form-group">
				<text class="label">👥 最大玩家数</text>
				<view class="player-count-options">
					<view
						v-for="count in 9"
						:key="count"
						class="player-option"
						:class="{ active: maxPlayers === (count + 1) }"
						@click="setMaxPlayers(count + 1)"
					>
						{{ count + 1 }}
					</view>
				</view>
			</view>

			<view class="form-group">
				<text class="label">💰 小盲注</text>
				<input
					v-model="smallBlind"
					class="input"
					type="number"
					placeholder="请输入小盲注"
					@input="validateBlinds"
				/>
			</view>

			<view class="form-group">
				<text class="label">💰 大盲注</text>
				<input
					v-model="bigBlind"
					class="input"
					type="number"
					placeholder="请输入大盲注"
					@input="validateBlinds"
				/>
			</view>

			<view class="tip">
				<text>💡 大盲注必须大于小盲注，且至少需要 {{minCoinsNeeded}} 金币</text>
			</view>

			<view class="form-group">
				<button class="create-btn" @click="createRoom" :disabled="!canCreate">
					{{ canCreate ? '创建房间' : '请完善信息' }}
				</button>
			</view>

			<view class="form-group">
				<button class="back-btn" @click="goBack">← 返回</button>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			roomName: '',
			maxPlayers: 6,
			smallBlind: 10,
			bigBlind: 20,
			errorMessage: ''
		}
	},

	computed: {
		canCreate() {
			return (
				this.roomName.trim() !== '' &&
				this.maxPlayers >= 2 &&
				this.maxPlayers <= 10 &&
				this.smallBlind > 0 &&
				this.bigBlind > 0 &&
				this.bigBlind > this.smallBlind
			)
		},

		minCoinsNeeded() {
			return this.bigBlind * 2
		}
	},

	methods: {
		setMaxPlayers(count) {
			this.maxPlayers = count
		},

		validateRoomName() {
			this.roomName = this.roomName.trim()
		},

		validateBlinds() {
			// 确保是数字且大于0
			this.smallBlind = Math.max(1, parseInt(this.smallBlind) || 1)
			this.bigBlind = Math.max(1, parseInt(this.bigBlind) || 1)

			// 确保大盲大于小盲
			if (this.bigBlind <= this.smallBlind) {
				this.bigBlind = this.smallBlind + 1
			}
		},

		async createRoom() {
			if (!this.canCreate) {
				uni.showToast({
					title: '请完善房间信息',
					icon: 'none'
				})
				return
			}

			try {
				uni.showLoading({ title: '创建中...' })

				// 调用云函数创建房间
				const res = await uniCloud.callFunction({
					name: 'create-room',
					data: {
						roomName: this.roomName.trim(),
						maxPlayers: this.maxPlayers,
						smallBlind: parseInt(this.smallBlind),
						bigBlind: parseInt(this.bigBlind)
					}
				})

				uni.hideLoading()

				if (res.result.code === 200) {
					uni.showToast({
						title: '创建成功',
						icon: 'success'
					})

					// 跳转到房间大厅
					uni.navigateTo({
						url: `/pages/room-detail/room-detail?roomId=${res.result.data.roomId}`,
						success: () => {
							// 关闭当前页面
							uni.navigateBack()
						}
					})
				} else {
					uni.showToast({
						title: res.result.message || '创建失败',
						icon: 'none',
						duration: 3000
					})
				}
			} catch (error) {
				console.error('创建房间失败:', error)
				uni.hideLoading()
				uni.showToast({
					title: error.message || '创建失败，请重试',
					icon: 'none',
					duration: 3000
				})
			}
		},

		goBack() {
			uni.navigateBack()
		}
	}
}
</script>

<style scoped>
.container {
	padding: 40rpx;
	background-color: #f5f5f5;
	min-height: 100vh;
}

.form-section {
	background-color: white;
	border-radius: 20rpx;
	padding: 40rpx;
	box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.1);
}

.form-group {
	margin-bottom: 40rpx;
}

.label {
	display: block;
	font-size: 30rpx;
	color: #333;
	margin-bottom: 20rpx;
	font-weight: bold;
}

.input {
	background-color: #f9f9f9;
	border: 2rpx solid #e0e0e0;
	border-radius: 10rpx;
	padding: 20rpx;
	font-size: 28rpx;
	width: 100%;
	box-sizing: border-box;
}

.player-count-options {
	display: flex;
	flex-wrap: wrap;
	gap: 20rpx;
}

.player-option {
	width: 80rpx;
	height: 80rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border: 2rpx solid #e0e0e0;
	border-radius: 50%;
	font-size: 32rpx;
	color: #666;
	background-color: white;
}

.player-option.active {
	border-color: #007AFF;
	color: #007AFF;
	background-color: #E6F2FF;
	font-weight: bold;
}

.create-btn {
	background-color: #007AFF;
	color: white;
	border: none;
	border-radius: 50rpx;
	padding: 25rpx 0;
	font-size: 32rpx;
	font-weight: bold;
	width: 100%;
}

.create-btn:disabled {
	background-color: #ccc;
}

.back-btn {
	background-color: white;
	color: #666;
	border: 2rpx solid #e0e0e0;
	border-radius: 50rpx;
	padding: 25rpx 0;
	font-size: 32rpx;
	width: 100%;
	margin-top: 20rpx;
}

.tip {
	background-color: #FFF9E6;
	border: 2rpx solid #FFD700;
	border-radius: 10rpx;
	padding: 20rpx;
	font-size: 26rpx;
	color: #666;
	margin-bottom: 20rpx;
}
</style>
