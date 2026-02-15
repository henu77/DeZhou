<template>
	<view class="container">
		<view class="search-bar">
			<view class="search-input">
				<text class="search-icon">🔍</text>
				<input
					v-model="searchKeyword"
					@confirm="handleSearch"
					placeholder="搜索房间名称"
					confirm-type="search"
				/>
			</view>
			<button class="create-btn" @click="goCreateRoom">＋</button>
		</view>

		<view class="room-list">
			<view v-if="loading" class="loading">加载中...</view>

			<view v-else-if="filteredRooms.length === 0" class="empty">
				<text>🏠</text>
				<text>暂无房间，快创建一个吧！</text>
			</view>

			<view v-else class="rooms">
				<view
					v-for="room in filteredRooms"
					:key="room._id"
					class="room-card"
					@click="joinRoom(room)"
				>
					<view class="room-header">
						<text class="room-name">房间: {{room.roomName}}</text>
						<text class="room-id">ID: {{room._id}}</text>
					</view>

					<view class="room-info">
						<text>👥 {{room.players.length}}/{{room.maxPlayers}}人</text>
						<text>💰 小{{room.smallBlind}}/大{{room.bigBlind}}</text>
					</view>

					<view class="room-footer">
						<text class="status">{{getStatusText(room.gameState)}}</text>
						<text class="time">🕒 {{getTimeAgo(room.createTime)}}</text>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			rooms: [],
			loading: false,
			searchKeyword: '',
			timer: null
		}
	},

	computed: {
		filteredRooms() {
			if (!this.searchKeyword) {
				return this.rooms
			}
			const keyword = this.searchKeyword.toLowerCase()
			return this.rooms.filter(room =>
				room.roomName.toLowerCase().includes(keyword) ||
				room._id.includes(keyword)
			)
		}
	},

	onLoad() {
		this.loadRooms()
		this.startAutoRefresh()
	},

	onUnload() {
		this.stopAutoRefresh()
	},

	onPullDownRefresh() {
		this.loadRooms().then(() => {
			uni.stopPullDownRefresh()
		})
	},

	methods: {
		async loadRooms() {
			this.loading = true
			try {
				const db = uniCloud.database()
				const res = await db.collection('game_rooms')
					.where({ gameState: 'waiting' })
					.orderBy('createTime', 'desc')
					.get()

				this.rooms = res.data || []
			} catch (error) {
				console.error('加载房间列表失败:', error)
				uni.showToast({
					title: '加载失败',
					icon: 'none'
				})
			} finally {
				this.loading = false
			}
		},

		handleSearch() {
			// 搜索已在 computed 中处理
			uni.hideKeyboard()
		},

		joinRoom(room) {
			uni.navigateTo({
				url: `/pages/room-detail/room-detail?roomId=${room._id}`
			})
		},

		goCreateRoom() {
			uni.navigateTo({
				url: '/pages/create-room/create-room'
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

		getTimeAgo(createTime) {
			if (!createTime) return ''
			const now = Date.now()
			const created = new Date(createTime).getTime()
			const diff = now - created
			const minutes = Math.floor(diff / 60000)

			if (minutes < 1) return '刚刚'
			if (minutes < 60) return `${minutes}分钟前`
			const hours = Math.floor(minutes / 60)
			if (hours < 24) return `${hours}小时前`
			const days = Math.floor(hours / 24)
			return `${days}天前`
		},

		startAutoRefresh() {
			this.timer = setInterval(() => {
				this.loadRooms()
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

.search-bar {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20rpx;
}

.search-input {
	flex: 1;
	display: flex;
	align-items: center;
	background-color: white;
	border-radius: 50rpx;
	padding: 15rpx 30rpx;
	margin-right: 20rpx;
}

.search-input input {
	flex: 1;
	font-size: 28rpx;
	margin-left: 10rpx;
}

.create-btn {
	width: 80rpx;
	height: 80rpx;
	background-color: #007AFF;
	color: white;
	border-radius: 50%;
	font-size: 50rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.room-list {
	min-height: 500rpx;
}

.loading {
	text-align: center;
	padding: 100rpx 0;
	color: #999;
	font-size: 28rpx;
}

.empty {
	text-align: center;
	padding: 100rpx 0;
	color: #666;
	font-size: 28rpx;
}

.empty text:first-child {
	font-size: 80rpx;
	margin-bottom: 20rpx;
	display: block;
}

.rooms {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

.room-card {
	background-color: white;
	border-radius: 20rpx;
	padding: 30rpx;
	box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.1);
}

.room-header {
	display: flex;
	justify-content: space-between;
	margin-bottom: 20rpx;
	align-items: center;
}

.room-name {
	font-size: 32rpx;
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
	margin-bottom: 15rpx;
	font-size: 28rpx;
	color: #666;
}

.room-footer {
	display: flex;
	justify-content: space-between;
	font-size: 24rpx;
	color: #999;
}

.status {
	color: #FF9500;
}

.time {
	color: #999;
}
</style>
