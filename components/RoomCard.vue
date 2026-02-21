<template>
  <view class="room-card" @click="handleJoin">
    <!-- 房间头部 -->
    <view class="room-header">
      <view class="room-name-section">
        <text class="room-icon">🃏</text>
        <text class="room-name">{{ room.roomName || '未命名房间' }}</text>
      </view>
      <view class="room-status" :class="statusClass">
        {{ statusText }}
      </view>
    </view>

    <!-- 房间信息 -->
    <view class="room-info">
      <!-- 玩家人数 -->
      <view class="info-item">
        <text class="info-icon">👥</text>
        <text class="info-text">{{ room.players?.length || 0 }}/{{ room.maxPlayers || 6 }}</text>
      </view>

      <!-- 盲注信息 -->
      <view class="info-item">
        <text class="info-icon">💵</text>
        <text class="info-text">
          {{ room.smallBlind || 0 }}/{{ room.bigBlind || 0 }}
        </text>
      </view>

      <!-- 底池金额（如果有） -->
      <view v-if="room.pot" class="info-item">
        <text class="info-icon">🏆</text>
        <text class="info-text">{{ room.pot }}</text>
      </view>
    </view>

    <!-- 玩家列表预览 -->
    <view v-if="room.players && room.players.length > 0" class="players-preview">
      <view class="preview-label">玩家列表:</view>
      <view class="player-tags">
        <view
          v-for="(player, index) in room.players.slice(0, 5)"
          :key="index"
          class="player-tag"
        >
          <text class="player-avatar">{{ getPlayerAvatar(player) }}</text>
          <text class="player-name">{{ getPlayerName(player) }}</text>
          <view v-if="player.ready" class="ready-dot"></view>
        </view>
        <view v-if="room.players.length > 5" class="more-tag">
          +{{ room.players.length - 5 }}
        </view>
      </view>
    </view>

    <!-- 房主信息 -->
    <view class="owner-info">
      <text class="owner-icon">👑</text>
      <text class="owner-text">房主：{{ getOwnerName }}</text>
    </view>

    <!-- 加入按钮 -->
    <button class="join-btn" :disabled="!canJoin" @click.stop="handleJoin">
      <text v-if="canJoin">加入房间</text>
      <text v-else-if="room.gameState === 'playing'">游戏中</text>
      <text v-else>已满员</text>
    </button>
  </view>
</template>

<script>
export default {
  name: 'RoomCard',
  props: {
    // 房间信息对象
    room: {
      type: Object,
      required: true,
      default: () => ({})
    }
  },
  computed: {
    statusClass() {
      const state = this.room.gameState
      if (state === 'waiting') return 'status-waiting'
      if (state === 'playing') return 'status-playing'
      if (state === 'ended') return 'status-ended'
      return ''
    },
    statusText() {
      const state = this.room.gameState
      if (state === 'waiting') return '等待中'
      if (state === 'playing') return '游戏中'
      if (state === 'ended') return '已结束'
      return '未知'
    },
    canJoin() {
      return (
        this.room.gameState === 'waiting' &&
        (this.room.players?.length || 0) < (this.room.maxPlayers || 6)
      )
    },
    getOwnerName() {
      return this.room.ownerId || '未知'
    }
  },
  methods: {
    getPlayerAvatar(player) {
      const name = player.playerName || player.userId || '玩家'
      return name.charAt(0).toUpperCase()
    },
    getPlayerName(player) {
      return player.playerName || player.userId || '未知玩家'
    },
    handleJoin() {
      if (!this.canJoin) return

      this.$emit('join', {
        roomId: this.room._id || this.room.roomId,
        room: this.room
      })
    }
  }
}
</script>

<style scoped>
.room-card {
  background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e9ecef;
  transition: all 0.2s ease;
}

.room-card:active {
  transform: scale(0.98);
}

.room-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.room-name-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.room-icon {
  font-size: 20px;
}

.room-name {
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
}

.room-status {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.status-waiting {
  background: #d5f5e3;
  color: #27ae60;
}

.status-playing {
  background: #fdebd0;
  color: #d68910;
}

.status-ended {
  background: #eaecee;
  color: #7f8c8d;
}

.room-info {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(52, 152, 219, 0.1);
  padding: 4px 10px;
  border-radius: 8px;
}

.info-icon {
  font-size: 14px;
}

.info-text {
  font-size: 14px;
  color: #2980b9;
  font-weight: 500;
}

.players-preview {
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #ecf0f1;
}

.preview-label {
  font-size: 12px;
  color: #7f8c8d;
  margin-bottom: 6px;
}

.player-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.player-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  background: #f8f9fa;
  padding: 4px 8px;
  border-radius: 12px;
  border: 1px solid #e9ecef;
}

.player-avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: #fff;
  font-size: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
}

.player-name {
  font-size: 12px;
  color: #2c3e50;
}

.ready-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #2ecc71;
}

.more-tag {
  font-size: 12px;
  color: #7f8c8d;
  padding: 4px 8px;
}

.owner-info {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
  font-size: 12px;
  color: #7f8c8d;
}

.owner-icon {
  font-size: 14px;
}

.owner-text {
  color: #7f8c8d;
}

.join-btn {
  width: 100%;
  height: 40px;
  border-radius: 20px;
  border: none;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: #fff;
  transition: all 0.2s ease;
}

.join-btn:disabled {
  background: linear-gradient(135deg, #bdc3c7 0%, #95a5a6 100%);
  cursor: not-allowed;
}
</style>
