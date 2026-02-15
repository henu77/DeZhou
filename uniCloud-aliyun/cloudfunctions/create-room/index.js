'use strict';

/**
 * 创建游戏房间
 */

exports.main = async (event, context) => {
  const db = uniCloud.database();

  // 验证登录
  if (!event.userInfo || !event.userInfo.uid) {
    return {
      code: 401,
      message: '请先登录'
    };
  }

  const {
    roomName,
    maxPlayers = 6,
    smallBlind = 10,
    bigBlind = 20
  } = event;

  // 参数验证
  if (!roomName || roomName.trim() === '') {
    return {
      code: 400,
      message: '房间名称不能为空'
    };
  }

  if (maxPlayers < 2 || maxPlayers > 10) {
    return {
      code: 400,
      message: '房间人数必须在2-10之间'
    };
  }

  if (smallBlind <= 0 || bigBlind <= 0) {
    return {
      code: 400,
      message: '盲注必须大于0'
    };
  }

  if (bigBlind <= smallBlind) {
    return {
      code: 400,
      message: '大盲注必须大于小盲注'
    };
  }

  // 获取创建者信息
  const userRes = await db.collection('users')
    .field({ nickname: 1, avatar: 1, coins: 1 })
    .doc(event.userInfo.uid)
    .get();

  if (!userRes.data || userRes.data.length === 0) {
    return {
      code: 404,
      message: '用户不存在'
    };
  }

  const user = userRes.data[0];

  // 检查用户金币是否足够
  if (user.coins < bigBlind * 2) {
    return {
      code: 400,
      message: `金币不足，至少需要 ${bigBlind * 2} 金币才能创建房间`
    };
  }

  // 生成房间号（6位数字）
  const generateRoomId = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  let roomId = generateRoomId();
  let roomExists = true;

  // 检查房间号是否已存在，最多重试10次
  for (let i = 0; i < 10; i++) {
    const existsRes = await db.collection('game_rooms')
      .where({ _id: roomId })
      .get();

    if (!existsRes.data || existsRes.data.length === 0) {
      roomExists = false;
      break;
    }
    roomId = generateRoomId();
  }

  if (roomExists) {
    return {
      code: 500,
      message: '房间号生成失败，请重试'
    };
  }

  // 创建房间
  const now = new Date();
  const playerInfo = {
    userId: event.userInfo.uid,
    seat: 0,
    nickname: user.nickname,
    avatar: user.avatar || '',
    ready: false,
    coins: user.coins,
    cards: [],
    folded: false,
    allIn: false
  };

  try {
    await db.collection('game_rooms').add({
      _id: roomId,
      roomName: roomName.trim(),
      maxPlayers,
      smallBlind,
      bigBlind,
      creatorId: event.userInfo.uid,
      gameState: 'waiting',
      players: [playerInfo],
      currentPlayerIndex: null,
      dealerIndex: 0,
      communityCards: [],
      pot: 0,
      sidePots: [],
      currentBet: 0,
      round: 'preflop',
      createTime: now,
      updateTime: now
    });

    // 更新用户状态
    await db.collection('users')
      .doc(event.userInfo.uid)
      .update({
        roomId,
        ready: false,
        updateTime: now
      });

    return {
      code: 200,
      message: '创建成功',
      data: {
        roomId,
        roomName: roomName.trim(),
        maxPlayers,
        smallBlind,
        bigBlind
      }
    };
  } catch (error) {
    console.error('创建房间失败:', error);
    return {
      code: 500,
      message: '创建房间失败',
      error: error.message
    };
  }
};