<template>
  <view class="card" :class="[suitClass, faceUp ? 'face-up' : 'face-down']">
    <view v-if="faceUp" class="card-content">
      <view class="card-corner top-left">
        <text class="rank">{{ rank }}</text>
        <text class="suit">{{ suitSymbol }}</text>
      </view>
      <view class="card-center">
        <text class="big-suit">{{ suitSymbol }}</text>
      </view>
      <view class="card-corner bottom-right">
        <text class="rank">{{ rank }}</text>
        <text class="suit">{{ suitSymbol }}</text>
      </view>
    </view>
    <view v-else class="card-back">
      <view class="back-pattern"></view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'Card',
  props: {
    // 花色：'spade'(黑桃), 'heart'(红桃), 'diamond'(方块), 'club'(梅花)
    suit: {
      type: String,
      required: true,
      validator: (value) => ['spade', 'heart', 'diamond', 'club'].includes(value)
    },
    // 点数：'A', 'K', 'Q', 'J', '10', '9', ..., '2'
    rank: {
      type: String,
      required: true
    },
    // 是否正面朝上
    faceUp: {
      type: Boolean,
      default: true
    }
  },
  computed: {
    // 花色对应的符号
    suitSymbol() {
      const symbols = {
        spade: '♠',
        heart: '♥',
        diamond: '♦',
        club: '♣'
      }
      return symbols[this.suit] || ''
    },
    // 花色对应的 CSS 类
    suitClass() {
      return `card-${this.suit}`
    },
    // 花色颜色（红桃和方块为红色）
    suitColor() {
      return this.suit === 'heart' || this.suit === 'diamond' ? '#e74c3c' : '#2c3e50'
    }
  }
}
</script>

<style scoped>
.card {
  width: 60px;
  height: 84px;
  border-radius: 6px;
  border: 1px solid #ddd;
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  position: relative;
  transition: transform 0.3s ease;
}

.card.face-up {
  background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%);
}

.card.face-down {
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
}

.card-content {
  width: 100%;
  height: 100%;
  position: relative;
}

.card-corner {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1;
}

.card-corner.top-left {
  top: 4px;
  left: 4px;
}

.card-corner.bottom-right {
  bottom: 4px;
  right: 4px;
  transform: rotate(180deg);
}

.rank {
  font-size: 18px;
  font-weight: bold;
}

.suit {
  font-size: 14px;
}

.card-spade .rank,
.card-spade .suit,
.card-club .rank,
.card-club .suit {
  color: #2c3e50;
}

.card-heart .rank,
.card-heart .suit,
.card-diamond .rank,
.card-diamond .suit {
  color: #e74c3c;
}

.card-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  justify-content: center;
  align-items: center;
}

.big-suit {
  font-size: 32px;
}

.card-back {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.back-pattern {
  width: 80%;
  height: 80%;
  background: repeating-linear-gradient(
    45deg,
    rgba(255, 255, 255, 0.1) 0px,
    rgba(255, 255, 255, 0.1) 10px,
    transparent 10px,
    transparent 20px
  );
  border-radius: 4px;
}
</style>
