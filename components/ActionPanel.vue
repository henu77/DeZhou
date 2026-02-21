<template>
  <view class="action-panel" :class="{ disabled: disabled }">
    <!-- 快捷操作区 -->
    <view class="quick-actions">
      <!-- 过牌按钮 -->
      <button
        v-if="canCheck"
        class="action-btn btn-check"
        :disabled="disabled"
        @click="handleAction('check')"
      >
        过牌
      </button>

      <!-- 跟注按钮 -->
      <button
        v-if="!canCheck"
        class="action-btn btn-call"
        :disabled="disabled"
        @click="handleAction('call')"
      >
        <text v-if="callAmount > 0">跟注 {{ callAmount }}</text>
        <text v-else>过牌</text>
      </button>
    </view>

    <!-- 加注操作区 -->
    <view class="raise-section">
      <view class="raise-label">加注</view>
      <view class="raise-controls">
        <button class="raise-btn btn-minus" @click="decreaseRaise" :disabled="disabled || raiseAmount <= minRaise">-</button>
        <view class="raise-amount-display">
          <text class="raise-amount">{{ raiseAmount }}</text>
        </view>
        <button class="raise-btn btn-plus" @click="increaseRaise" :disabled="disabled || raiseAmount >= maxRaise">+</button>
      </view>
      <button
        class="action-btn btn-raise"
        :disabled="disabled || raiseAmount < minRaise"
        @click="handleAction('raise', raiseAmount)"
      >
        加注 {{ raiseAmount }}
      </button>
    </view>

    <!-- 特殊操作区 -->
    <view class="special-actions">
      <!-- 全下按钮 -->
      <button
        class="action-btn btn-allin"
        :disabled="disabled || myCoins <= 0"
        @click="handleAction('allin')"
      >
        全下 {{ myCoins }}
      </button>

      <!-- 弃牌按钮 -->
      <button
        class="action-btn btn-fold"
        :disabled="disabled"
        @click="handleAction('fold')"
      >
        弃牌
      </button>
    </view>

    <!-- 操作说明 -->
    <view class="action-info">
      <text class="info-text">需跟注：{{ callAmount }} | 剩余金币：{{ myCoins }}</text>
    </view>
  </view>
</template>

<script>
export default {
  name: 'ActionPanel',
  props: {
    // 当前需要跟注的金额
    currentBet: {
      type: Number,
      default: 0
    },
    // 自己已下注金额
    myBet: {
      type: Number,
      default: 0
    },
    // 剩余金币
    coins: {
      type: Number,
      default: 0
    },
    // 是否可以过牌
    canCheck: {
      type: Boolean,
      default: false
    },
    // 是否禁用整个面板
    disabled: {
      type: Boolean,
      default: false
    },
    // 最小加注额
    minRaise: {
      type: Number,
      default: 20
    }
  },
  data() {
    return {
      raiseAmount: 0
    }
  },
  computed: {
    // 需要跟注的差额
    callAmount() {
      return Math.max(0, this.currentBet - this.myBet)
    },
    // 我的可用金币
    myCoins() {
      return this.coins
    },
    // 最大加注额
    maxRaise() {
      return this.myCoins
    },
    // 最小跟注到
    minCall() {
      return this.currentBet
    }
  },
  watch: {
    currentBet() {
      this.resetRaiseAmount()
    },
    myCoins() {
      this.resetRaiseAmount()
    }
  },
  created() {
    this.resetRaiseAmount()
  },
  methods: {
    resetRaiseAmount() {
      // 默认加注额为当前跟注额 + 大盲注
      const defaultRaise = this.currentBet + 20
      this.raiseAmount = Math.min(Math.max(defaultRaise, this.minRaise), this.myCoins)
    },
    increaseRaise() {
      const increment = Math.max(20, this.minRaise)
      this.raiseAmount = Math.min(this.raiseAmount + increment, this.maxRaise)
    },
    decreaseRaise() {
      const decrement = Math.max(20, this.minRaise)
      this.raiseAmount = Math.max(this.raiseAmount - decrement, this.minRaise)
    },
    handleAction(action, amount) {
      if (this.disabled) return

      this.$emit('action', {
        type: action,
        amount: amount || 0
      })
    }
  }
}
</script>

<style scoped>
.action-panel {
  background: linear-gradient(135deg, #2c3e50 0%, #1a252f 100%);
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  color: #fff;
}

.action-panel.disabled {
  opacity: 0.6;
  filter: grayscale(50%);
}

.quick-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.action-btn {
  flex: 1;
  height: 48px;
  border-radius: 24px;
  border: none;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.2s ease;
  display: flex;
  justify-content: center;
  align-items: center;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-check {
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: #fff;
}

.btn-call {
  background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
  color: #fff;
}

.raise-section {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 16px;
}

.raise-label {
  text-align: center;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 8px;
}

.raise-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.raise-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  font-size: 20px;
  font-weight: bold;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.2s ease;
}

.btn-minus {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.btn-plus {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.raise-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.raise-amount-display {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  padding: 8px 16px;
  min-width: 80px;
  text-align: center;
}

.raise-amount {
  font-size: 18px;
  font-weight: bold;
  color: #f39c12;
}

.btn-raise {
  width: 100%;
  background: linear-gradient(135deg, #f39c12 0%, #d68910 100%);
  color: #fff;
}

.special-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.btn-allin {
  flex: 1;
  height: 44px;
  border-radius: 22px;
  border: none;
  font-size: 14px;
  font-weight: 600;
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
  color: #fff;
}

.btn-fold {
  flex: 1;
  height: 44px;
  border-radius: 22px;
  border: none;
  font-size: 14px;
  font-weight: 600;
  background: linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%);
  color: #fff;
}

.action-info {
  text-align: center;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.info-text {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}
</style>
