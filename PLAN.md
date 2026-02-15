# 德州扑克前端页面实现计划

## 📋 项目背景

根据 `FRONTEND_DESIGN.md` 设计文档，需要完成德州扑克游戏的前端页面开发。项目是一个 uni-app 应用，已有云函数和游戏逻辑实现，需要开发完整的前端界面。

## 🎯 实现目标

实现以下5个页面和5个组件：

### 页面：
1. **pages/index/index.vue** - 首页（房间列表）
2. **pages/create-room/create-room.vue** - 创建房间页面
3. **pages/room-detail/room-detail.vue** - 游戏大厅页面
4. **pages/game-table/game-table.vue** - 游戏进行中页面
5. **pages/game-result/game-result.vue** - 游戏结果页面

### 组件：
1. **components/Card.vue** - 扑克牌组件
2. **components/Chip.vue** - 筹码组件
3. **components/PlayerInfo.vue** - 玩家信息组件
4. **components/ActionPanel.vue** - 行动面板组件
5. **components/RoomCard.vue** - 房间卡片组件

## 📦 已有资源

- **云函数**：`create-room`, `join-room`, `ready-game`, `start-game`, `player-action`, `leave-room`
- **工具函数**：`utils/game-logic.js`, `utils/hand-evaluator.js`, `utils/poker.js`
- **数据库**：`game_rooms`, `users` 集合已定义
- **主应用**：`App.vue`, `main.js`, `pages.json`

## 🚀 实施步骤

### 第一阶段：基础架构（2-3小时）

1. **更新 pages.json** (`pages.json`)
   - 添加所有新页面的路由配置
   - 设置页面标题

2. **创建项目目录结构**
   ```
   components/
     ├── Card.vue
     ├── Chip.vue
     ├── PlayerInfo.vue
     ├── ActionPanel.vue
     └── RoomCard.vue
   pages/
     ├── create-room/
     │   └── create-room.vue
     ├── room-detail/
     │   └── room-detail.vue
     ├── game-table/
     │   └── game-table.vue
     └── game-result/
         └── game-result.vue
   ```

### 第二阶段：页面开发

#### 2.1 首页 - 房间列表 (`pages/index/index.vue`)

**功能需求**：
- 显示房间列表（名称、人数、盲注、状态）
- 搜索房间功能
- 创建房间按钮
- 自动刷新房间列表（定时器）

**关键实现**：
```javascript
data() {
  return {
    rooms: [],
    loading: false,
    searchKeyword: ''
  }
}

methods: {
  async loadRooms() {
    this.loading = true;
    const res = await uniCloud.callFunction({
      name: 'list-rooms',
      data: { keyword: this.searchKeyword }
    });
    this.rooms = res.result.data;
    this.loading = false;
  },

  // 定时器自动刷新
  startAutoRefresh() {
    this.timer = setInterval(() => {
      this.loadRooms();
    }, 5000);
  }
}
```

#### 2.2 创建房间页面 (`pages/create-room/create-room.vue`)

**功能需求**：
- 表单：房间名、最大玩家数、小盲注、大盲注
- 创建房间按钮
- 返回按钮

**关键实现**：
```javascript
data() {
  return {
    roomName: '',
    maxPlayers: 6,
    smallBlind: 10,
    bigBlind: 20
  }
}

methods: {
  async createRoom() {
    const res = await uniCloud.callFunction({
      name: 'create-room',
      data: {
        roomName: this.roomName,
        maxPlayers: this.maxPlayers,
        smallBlind: this.smallBlind,
        bigBlind: this.bigBlind
      }
    });

    // 跳转到房间大厅
    uni.navigateTo({
      url: `/pages/room-detail/room-detail?roomId=${res.result.data.roomId}`
    });
  }
}
```

#### 2.3 游戏大厅页面 (`pages/room-detail/room-detail.vue`)

**功能需求**：
- 显示房间信息
- 显示玩家列表（准备状态）
- 准备/取消准备按钮
- 房主可开始游戏
- 离开房间

**关键实现**：
```javascript
data() {
  return {
    roomId: '',
    room: null,
    currentUserId: '',
    isOwner: false,
    isReady: false,
    timer: null
  }
}

methods: {
  async readyGame() {
    await uniCloud.callFunction({
      name: 'ready-game',
      data: { roomId: this.roomId, ready: !this.isReady }
    });
    this.isReady = !this.isReady;
  },

  async startGame() {
    await uniCloud.callFunction({
      name: 'start-game',
      data: { roomId: this.roomId }
    });
    // 跳转到游戏页面
    uni.navigateTo({
      url: '/pages/game-table/game-table'
    });
  }
}
```

#### 2.4 游戏进行中页面 (`pages/game-table/game-table.vue`)

**功能需求**：
- 显示公共牌和手牌
- 显示玩家状态（头像、金币、下注）
- 显示当前行动玩家
- 显示底池金额和轮次
- 行动面板（check/call/raise/fold/allin）

**关键实现**：
```javascript
data() {
  return {
    room: null,
    canAct: false,
    currentBet: 0,
    timer: null
  }
}

methods: {
  async playerAction(actionType, amount) {
    await uniCloud.callFunction({
      name: 'player-action',
      data: {
        roomId: this.room._id,
        action: actionType,
        amount: amount
      }
    });
  }
}
```

#### 2.5 游戏结果页面 (`pages/game-result/game-result.vue`)

**功能需求**：
- 显示获胜者
- 显示所有玩家手牌和牌型
- 显示底池分配
- 返回房间/首页按钮

### 第三阶段：组件开发

#### 3.1 扑克牌组件 (`components/Card.vue`)

**Props**：`suit`（花色）, `rank`（点数）, `faceUp`（正面朝上）

#### 3.2 筹码组件 (`components/Chip.vue`)

**Props**：`amount`（筹码数量）, `color`（颜色）

#### 3.3 玩家信息组件 (`components/PlayerInfo.vue`)

**Props**：`player`（玩家信息）, `isCurrentPlayer`（是否当前玩家）, `position`（位置）

#### 3.4 行动面板组件 (`components/ActionPanel.vue`)

**Props**：`currentBet`, `myBet`, `coins`, `canCheck`
**Events**：`action`

#### 3.5 房间卡片组件 (`components/RoomCard.vue`)

**Props**：`room`（房间信息）
**Events**：`join`

### 第四阶段：样式和交互优化

1. 添加页面过渡动画
2. 优化加载状态显示
3. 添加错误提示
4. 统一视觉风格

## 🔧 关键文件路径

### 需要修改的文件：
- `pages.json` - 添加路由配置
- `pages/index/index.vue` - 重构为房间列表

### 需要新建的文件：
- `components/Card.vue`
- `components/Chip.vue`
- `components/PlayerInfo.vue`
- `components/ActionPanel.vue`
- `components/RoomCard.vue`
- `pages/create-room/create-room.vue`
- `pages/room-detail/room-detail.vue`
- `pages/game-table/game-table.vue`
- `pages/game-result/game-result.vue`

## ✅ 验证计划

### 1. 单元测试
- [ ] 首页能正确显示房间列表
- [ ] 创建房间表单验证有效
- [ ] 准备/取消准备状态切换正常
- [ ] 游戏行动面板按钮状态正确

### 2. 集成测试
- [ ] 创建房间 → 进入大厅 → 准备 → 开始游戏 流程畅通
- [ ] 多玩家加入房间功能正常
- [ ] 云函数调用返回正确数据
- [ ] 游戏轮次切换正常

### 3. 用户体验测试
- [ ] 页面加载速度合理
- [ ] 错误提示友好
- [ ] 加载状态显示清晰
- [ ] 返回导航正常

## ⚠️ 注意事项

1. **云函数依赖**：部分云函数（如 `list-rooms`）可能需要先实现
2. **实时更新**：房间状态变化需要定时刷新或使用云数据库监听
3. **错误处理**：所有云函数调用都需要添加 try-catch 错误处理
4. **状态管理**：房间信息需要在页面间传递（使用 URL 参数或全局状态）
5. **性能优化**：定时器记得在页面销毁时清理

## 📝 后续优化（可选）

1. 聊天功能
2. 实时通知（WebSocket）
3. 统计数据展示
4. 扑克牌翻转动画
5. 音效和震动反馈
