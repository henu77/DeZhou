<template>
  <view class="player-info" :class="[positionClass, { 'current-player': isCurrentPlayer, 'folded': player?.folded, 'allin': player?.allIn }]">
    <!-- 头像区域 -->
    <view class="avatar-section">
      <view class="avatar">
        <text class="avatar-text">{{ playerAvatar }}</text>
      </view>
      <view v-if="isCurrentPlayer" class="current-player-indicator">
        <text class="indicator-arrow">▶</text>
      </view>
    </view>

    <!-- 信息区域 -->
    <view class="info-section">
      <!-- 玩家昵称和状态 -->
      <view class="player-header">
        <text class="player-name">{{ player?.playerName || player?.userId || '未知玩家' }}</text>
        <view v-if="player?.ready" class="ready-badge">准备</view>
        <view v-if="player?.isDealer" class="dealer-button">D</view>
      </view>

      <!-- 金币数量 -->
      <view class="coins-section">
        <text class="coins-icon">💰</text>
        <text class="coins-amount">{{ formatCoins(player?.coins || 0) }}</text>
      </view>

      <!-- 本轮下注额 -->
      <view v-if="player?.currentBet > 0" class="bet-section">
        <text class="bet-label">下注:</text>
        <text class="bet-amount">{{ formatCoins(player?.currentBet) }}</text>
      </view>

      <!-- 行动状态 -->
      <view v-if="playerActionText" class="action-badge" :class="actionClass">
        {{ playerActionText }}
      </view>
    </view>

    <!-- 手牌区域（可选显示） -->
    <view v-if="showHand && player?.hand && player?.hand.length > 0" class="hand-section">
      <view class="cards-container">
        <text v-for="(card, index) in player.hand" :key="index" class="hand-card">
          {{ getCardDisplay(card) }}
        </text>
      </view>
      <view v-if="player?.handRank" class="hand-rank">
        {{ player.handRank }}
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'PlayerInfo',
  props: {
    // 玩家信息对象
    player: {
      type: Object,
      default: () => ({})
    },
    // 是否为当前行动玩家
    isCurrentPlayer: {
      type: Boolean,
      default: false
    },
    // 位置：'top', 'bottom', 'left', 'right', 'center'
    position: {
      type: String,
      default: 'center',
      validator: (value) => ['top', 'bottom', 'left', 'right', 'center'].includes(value)
    },
    // 是否显示手牌
    showHand: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    positionClass() {
      return `position-${this.position}`
    },
    playerAvatar() {
      const name = this.player?.playerName || this.player?.userId || '玩家'
      return name.charAt(0).toUpperCase()
    },
    playerActionText() {
      if (!this.player?.lastAction) return ''
      const actionMap = {
        'fold': '弃牌',
        'check': '过牌',
        'call': '跟注',
        'raise': '加注',
        'allin': '全下',
        'win': '获胜'
      }
      return actionMap[this.player.lastAction] || this.player.lastAction
    },
    actionClass() {
      const action = this.player?.lastAction
      if (action === 'fold') return 'action-fold'
      if (action === 'allin') return 'action-allin'
      if (action === 'raise') return 'action-raise'
      if (action === 'win') return 'action-win'
      return ''
    }
  },
  methods: {
    formatCoins(coins) {
      if (coins >= 1000000) {
        return (coins / 1000000).toFixed(2) + 'M'
      } else if (coins >= 1000) {
        return (coins / 1000).toFixed(0) + 'K'
      }
      return coins.toString()
    },
    getCardDisplay(card) {
      if (!card) return ''
      // 如果 card 是字符串格式如 "spade-A"，转换为 ♠A
      if (typeof card === 'string') {
        const [suit, rank] = card.split('-')
        const suitMap = {
          'spade': '♠',
          'heart': '♥',
          'diamond': '♦',
          'club': '♣'
        }
        return `${suitMap[suit] || ''}${rank}`
      }
      // 如果是对象格式 { suit: 'spade', rank: 'A' }
      const suitMap = {
        'spade': '♠',
        'heart': '♥',
        'diamond': '♦',
        'club': '♣'
      }
      return `${suitMap[card.suit] || ''}${card.rank}`
    }
  }
}
</script>

<style scoped>
.player-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 120px;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.player-info.current-player {
  border-color: #f39c12;
  box-shadow: 0 0 20px rgba(243, 156, 18, 0.5);
  animation: pulse 1.5s infinite;
}

.player-info.folded {
  opacity: 0.6;
  filter: grayscale(50%);
}

.player-info.allin {
  border-color: #e74c3c;
  background: linear-gradient(135deg, #fff5f5 0%, #ffebeb 100%);
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
}

.avatar-section {
  position: relative;
  margin-bottom: 8px;
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  border: 3px solid #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.avatar-text {
  color: #fff;
  font-size: 20px;
  font-weight: bold;
}

.current-player-indicator {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #f39c12;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 2px solid #fff;
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.indicator-arrow {
  color: #fff;
  font-size: 12px;
}

.info-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.player-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-bottom: 4px;
}

.player-name {
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ready-badge {
  background: #2ecc71;
  color: #fff;
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 4px;
}

.dealer-button {
  background: #f39c12;
  color: #fff;
  font-size: 10px;
  font-weight: bold;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.coins-section {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(46, 204, 113, 0.1);
  padding: 2px 8px;
  border-radius: 12px;
  margin-bottom: 4px;
}

.coins-icon {
  font-size: 12px;
}

.coins-amount {
  font-size: 13px;
  font-weight: 600;
  color: #27ae60;
}

.bet-section {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(243, 156, 18, 0.1);
  padding: 2px 8px;
  border-radius: 12px;
}

.bet-label {
  font-size: 11px;
  color: #7f8c8d;
}

.bet-amount {
  font-size: 12px;
  font-weight: 600;
  color: #d35400;
}

.action-badge {
  margin-top: 6px;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  animation: popIn 0.3s ease;
}

@keyframes popIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.action-fold {
  background: #95a5a6;
  color: #fff;
}

.action-allin {
  background: #e74c3c;
  color: #fff;
  animation: flash 0.5s infinite;
}

@keyframes flash {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.action-raise {
  background: #f39c12;
  color: #fff;
}

.action-win {
  background: linear-gradient(135deg, #f1c40f 0%, #f39c12 100%);
  color: #fff;
}

.hand-section {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #ecf0f1;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.cards-container {
  display: flex;
  gap: 4px;
  justify-content: center;
}

.hand-card {
  font-size: 18px;
  background: #fff;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid #bdc3c7;
}

.hand-rank {
  margin-top: 4px;
  font-size: 11px;
  color: #7f8c8d;
  font-weight: 600;
}

/* 位置变体 */
.position-top {
  flex-direction: column;
}

.position-bottom {
  flex-direction: column;
}

.position-left {
  flex-direction: row;
}

.position-right {
  flex-direction: row;
}

.position-left .avatar-section,
.position-right .avatar-section {
  margin-bottom: 0;
  margin-right: 8px;
}

.position-right .avatar-section {
  margin-right: 0;
  margin-left: 8px;
}

.position-left .info-section,
.position-right .info-section {
  flex: 1;
}
</style>
