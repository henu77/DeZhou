<template>
  <view class="container">
    <view v-if="loading" class="loading">加载中...</view>

    <view v-else-if="room" class="game-container">
      <view class="room-header">
        <text class="room-name">🏠 {{room.roomName}}</text>
        <text class="round-text">{{getRoundText(room.round)}}</text>
      </view>

      <view class="pot-display">
        <text class="pot-label">💰 底池：{{room.pot}}</text>
      </view>

      <!-- 公共牌区域 -->
      <view class="community-cards">
        <view v-if="room.communityCards && room.communityCards.length > 0" class="cards-container">
          <Card
            v-for="(card, index) in room.communityCards"
            :key="index"
            :suit="getCardSuit(card)"
            :rank="getCardRank(card)"
            :face-up="true"
          />
        </view>
        <view v-else class="empty-cards">
          <text>暂无公共牌</text>
        </view>
      </view>

      <!-- 玩家区域 - 上方对手 -->
      <view class="opponents-area">
        <PlayerInfo
          v-for="player in opponents"
          :key="player.userId"
          :player="player"
          :is-current-player="player.userId === currentActionPlayerId"
          position="top"
        />
      </view>

      <!-- 自己的手牌 -->
      <view class="my-section">
        <view class="my-cards-label">🃏 你的手牌:</view>
        <view v-if="myPlayer && myPlayer.hand && myPlayer.hand.length > 0" class="my-cards-container">
          <Card
            v-for="(card, index) in myPlayer.hand"
            :key="index"
            :suit="getCardSuit(card)"
            :rank="getCardRank(card)"
            :face-up="true"
          />
        </view>
        <view v-else class="no-cards">
          <text>暂无手牌</text>
        </view>

        <view v-if="myPlayer" class="my-info">
          <Chip :amount="myPlayer.coins || 0" color="green" />
          <text v-if="myPlayer.currentBet > 0" class="my-bet">已下注：{{myPlayer.currentBet}}</text>
        </view>

        <view v-if="isMyTurn" class="my-turn">
          <text class="highlight">👉 你的回合！</text>
        </view>
      </view>

      <!-- 行动面板 -->
      <ActionPanel
        v-if="isMyTurn && !gameEnded"
        :current-bet="room.currentBet || 0"
        :my-bet="myPlayer?.currentBet || 0"
        :coins="myPlayer?.coins || 0"
        :can-check="canCheck"
        :min-raise="room.bigBlind || 20"
        @action="handleAction"
      />

      <!-- 游戏结束提示 -->
      <view v-if="gameEnded" class="game-over">
        <text class="game-over-text">🎉 游戏结束！</text>
        <button class="result-btn" @click="goToResult">📊 查看结果</button>
      </view>
    </view>
  </view>
</template>

<script>
import Card from '@/components/Card.vue'
import Chip from '@/components/Chip.vue'
import PlayerInfo from '@/components/PlayerInfo.vue'
import ActionPanel from '@/components/ActionPanel.vue'

export default {
  components: {
    Card,
    Chip,
    PlayerInfo,
    ActionPanel
  },
  data() {
    return {
      roomId: '',
      room: null,
      loading: false,
      currentUserId: '',
      gameEnded: false
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
      return (this.room.currentBet || 0) - (this.myPlayer.currentBet || 0)
    },

    canCheck() {
      if (!this.room || !this.myPlayer) return false
      return (this.room.currentBet || 0) === (this.myPlayer.currentBet || 0)
    },

    isMyTurn() {
      if (!this.room || !this.myPlayer) return false
      const myIndex = this.room.players.findIndex(p => p.userId === this.currentUserId)
      return this.room.currentPlayerIndex === myIndex
    },

    currentActionPlayerId() {
      if (!this.room || this.room.currentPlayerIndex === -1) return ''
      const player = this.room.players[this.room.currentPlayerIndex]
      return player ? player.userId : ''
    }
  },

  onLoad(options) {
    this.roomId = options.roomId
    this.loadGameInfo()

    // 获取当前用户信息
    const currentUser = uni.getStorageSync('currentUser')
    if (currentUser && currentUser._id) {
      this.currentUserId = currentUser._id
    }
  },

  onShow() {
    this.loadGameInfo()
  },

  onUnload() {
    // 无需清理
  },

  methods: {
    async handleAction({ type, amount }) {
      await this.doAction(type, amount)
    },

    async loadGameInfo() {
      this.loading = true
      try {
        const db = uniCloud.database()
        const res = await db.collection('game_rooms')
          .doc(this.roomId)
          .get()

        if (res.data) {
          this.room = res.data

          // 检查游戏是否结束
          if (this.room.gameState === 'ended' || this.room.gameState === 'finished') {
            if (!this.gameEnded) {
              this.gameEnded = true
              setTimeout(() => {
                this.goToResult()
              }, 2000)
            }
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

        const res = await uniCloud.callFunction({
          name: 'player-action',
          data: {
            roomId: this.roomId,
            userId: this.currentUserId,
            action: {
              type: actionType,
              amount: amount || 0
            }
          }
        })

        uni.hideLoading()

        if (res.result.code === 200) {
          uni.showToast({
            title: '行动成功',
            icon: 'success'
          })
          this.loadGameInfo()
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

    getCardSuit(card) {
      if (!card) return 'spade'
      // card 格式可能是 "spade-A" 或 { suit: 'spade', rank: 'A' }
      if (typeof card === 'string') {
        const parts = card.split('-')
        return parts[0] || 'spade'
      }
      return card.suit || 'spade'
    },

    getCardRank(card) {
      if (!card) return 'A'
      if (typeof card === 'string') {
        const parts = card.split('-')
        return parts[1] || 'A'
      }
      return card.rank || 'A'
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
    }
  }
}
</script>

<style scoped>
.container {
  padding: 20rpx;
  background: linear-gradient(180deg, #1a472a 0%, #0d2818 100%);
  min-height: 100vh;
}

.loading {
  text-align: center;
  padding: 200rpx 0;
  font-size: 32rpx;
  color: #fff;
}

.game-container {
  background: transparent;
  border-radius: 20rpx;
  padding: 20rpx;
}

.room-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
  padding: 20rpx;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10rpx;
}

.room-name {
  font-size: 36rpx;
  font-weight: bold;
  color: #fff;
}

.round-text {
  font-size: 28rpx;
  color: #FFD700;
}

.pot-display {
  text-align: center;
  margin-bottom: 30rpx;
  padding: 20rpx;
  background: rgba(255, 215, 0, 0.1);
  border-radius: 10rpx;
  border: 2rpx solid #FFD700;
}

.pot-label {
  font-size: 32rpx;
  color: #FFD700;
  font-weight: bold;
}

.community-cards {
  margin-bottom: 40rpx;
  padding: 20rpx;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 10rpx;
}

.cards-container {
  display: flex;
  justify-content: center;
  gap: 10rpx;
}

.empty-cards {
  text-align: center;
  padding: 40rpx 0;
  color: rgba(255, 255, 255, 0.5);
}

.opponents-area {
  margin-bottom: 40rpx;
  display: flex;
  justify-content: center;
  gap: 20rpx;
  flex-wrap: wrap;
}

.my-section {
  margin-bottom: 40rpx;
  padding: 30rpx;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10rpx;
  text-align: center;
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

.no-cards {
  text-align: center;
  padding: 40rpx 0;
  color: rgba(255, 255, 255, 0.5);
}

.my-info {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20rpx;
}

.my-bet {
  font-size: 26rpx;
  color: #FFD700;
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

.game-over {
  text-align: center;
  margin-top: 30rpx;
  padding: 40rpx;
  background: rgba(76, 175, 80, 0.9);
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
