<template>
  <view class="container">
    <!-- 用户信息栏 -->
    <view class="user-bar" v-if="currentUser">
      <view class="user-info">
        <text class="user-avatar">👤</text>
        <view class="user-detail">
          <text class="user-nickname">{{ currentUser.nickname }}</text>
          <text class="user-coins">💰 {{ currentUser.coins }}</text>
        </view>
      </view>
      <button class="logout-btn" @click="handleLogout">退出</button>
    </view>

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
      <button class="create-btn" @click="goCreateRoom">+</button>
    </view>

    <view class="room-list">
      <view v-if="loading" class="loading">加载中...</view>

      <view v-else-if="filteredRooms.length === 0" class="empty">
        <text>🏠</text>
        <text>暂无房间，快创建一个吧！</text>
      </view>

      <view v-else class="rooms">
        <RoomCard
          v-for="room in filteredRooms"
          :key="room._id"
          :room="room"
          @join="handleJoinRoom"
        />
      </view>
    </view>
  </view>
</template>

<script>
import RoomCard from '@/components/RoomCard.vue'

export default {
  components: {
    RoomCard
  },
  data() {
    return {
      rooms: [],
      loading: false,
      searchKeyword: '',
      timer: null,
      currentUser: null
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
    this.checkLogin()
    this.loadRooms()
    this.startAutoRefresh()
  },

  onShow() {
    this.checkLogin()
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
    checkLogin() {
      const currentUser = uni.getStorageSync('currentUser')
      if (!currentUser || !currentUser._id) {
        // 未登录，跳转到登录页
        uni.reLaunch({
          url: '/pages/login/login'
        })
        return
      }
      this.currentUser = currentUser
    },

    handleLogout() {
      uni.showModal({
        title: '提示',
        content: '确定要退出登录吗？',
        success: (res) => {
          if (res.confirm) {
            uni.removeStorageSync('currentUser')
            uni.removeStorageSync('token')
            this.currentUser = null
            uni.reLaunch({
              url: '/pages/login/login'
            })
          }
        }
      })
    },

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
      uni.hideKeyboard()
    },

    handleJoinRoom({ roomId, room }) {
      uni.navigateTo({
        url: `/pages/room-detail/room-detail?roomId=${roomId}`
      })
    },

    goCreateRoom() {
      uni.navigateTo({
        url: '/pages/create-room/create-room'
      })
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

.user-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: white;
  border-radius: 12rpx;
  padding: 20rpx 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.user-avatar {
  font-size: 40rpx;
}

.user-detail {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.user-nickname {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
}

.user-coins {
  font-size: 24rpx;
  color: #f59e0b;
}

.logout-btn {
  font-size: 24rpx;
  color: #666;
  background-color: #f5f5f5;
  border-radius: 50rpx;
  padding: 10rpx 24rpx;
  border: 2rpx solid #e0e0e0;
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
</style>
