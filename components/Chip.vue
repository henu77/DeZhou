<template>
  <view class="chip" :class="chipClass">
    <view class="chip-inner">
      <text class="chip-amount">{{ displayAmount }}</text>
    </view>
  </view>
</template>

<script>
export default {
  name: 'Chip',
  props: {
    // 筹码数量
    amount: {
      type: Number,
      required: true,
      default: 0
    },
    // 颜色：'white', 'red', 'blue', 'green', 'black'
    color: {
      type: String,
      default: 'white',
      validator: (value) => ['white', 'red', 'blue', 'green', 'black', 'purple', 'orange'].includes(value)
    }
  },
  computed: {
    chipClass() {
      return `chip-${this.color}`
    },
    displayAmount() {
      // 格式化金额，超过 1000 显示为 1K 等
      if (this.amount >= 1000000) {
        return (this.amount / 1000000).toFixed(1) + 'M'
      } else if (this.amount >= 1000) {
        return (this.amount / 1000).toFixed(1) + 'K'
      }
      return this.amount.toString()
    }
  }
}
</script>

<style scoped>
.chip {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  min-width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 4px dashed rgba(255, 255, 255, 0.8);
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.3);
  position: relative;
}

.chip-inner {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: radial-gradient(ellipse at center, rgba(255,255,255,0.3) 0%, transparent 70%);
}

.chip-amount {
  font-size: 14px;
  font-weight: bold;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  white-space: nowrap;
}

/* 不同颜色的筹码 */
.chip-white {
  background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
  border-color: #bdc3c7;
}
.chip-white .chip-amount {
  color: #2c3e50;
  text-shadow: none;
}

.chip-red {
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
  border-color: #a93226;
}

.chip-blue {
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  border-color: #2471a3;
}

.chip-green {
  background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
  border-color: #229954;
}

.chip-black {
  background: linear-gradient(135deg, #2c3e50 0%, #1a252f 100%);
  border-color: #0d1216;
}

.chip-purple {
  background: linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%);
  border-color: #7d3c98;
}

.chip-orange {
  background: linear-gradient(135deg, #f39c12 0%, #d68910 100%);
  border-color: #b9770e;
}
</style>
