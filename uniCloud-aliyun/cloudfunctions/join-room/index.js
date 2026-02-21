'use strict';

/**
 * 玩家加入房间
 */

const gameLogic = require('../../../utils/game-logic.js');

exports.main = async (event, context) => {
  const db = uniCloud.database();

  // 从 event 中获取 userId（前端传递）
  const userId = event.userId;

  // 验证登录
  if (!userId) {
    return {
      code: 401,
      message: '请先登录'
    };
  }

  const { roomId } = event;

  // 验证房间号
  if (!roomId) {
    return {
      code: 400,
      message: '房间号不能为空'
    };
  }

  // 获取房间信息
  const roomRes = await db.collection('game_rooms')
    .where({ _id: roomId })
    .get();

  if (!roomRes.data || roomRes.data.length === 0) {
    return {
      code: 404,
      message: '房间不存在'
    };
  }

  const room = roomRes.data[0];

  // 验证房间状态（只能在等待状态下加入）
  if (room.gameState !== 'waiting') {
    return {
      code: 400,
      message: '游戏已开始，无法加入'
    };
  }

  // 验证房间是否已满
  if (room.players.length >= room.maxPlayers) {
    return {
      code: 400,
      message: '房间已满'
    };
  }

  // 检查用户是否已在房间中
  const existingPlayerIndex = room.players.findIndex(p => p.userId === userId);
  if (existingPlayerIndex !== -1) {
    return {
      code: 400,
      message: '您已在房间中'
    };
  }

  // 获取用户信息
  const userRes = await db.collection('users')
    .doc(userId)
    .get();

  if (!userRes.data) {
    return {
      code: 404,
      message: '用户不存在'
    };
  }

  const user = userRes.data;

  // 验证用户金币是否足够（固定需要 100 金币）
  if (user.coins < 100) {
    return {
      code: 400,
      message: '金币不足，至少需要 100 金币才能加入房间'
    };
  }

  // 创建玩家信息
  const now = new Date();
  const playerInfo = {
    userId: userId,
    seat: room.players.length,  // 座位号为当前玩家数量
    nickname: user.nickname,
    avatar: user.avatar || '',
    ready: false,               // 默认未准备
    coins: user.coins,
    cards: [],                  // 初始无手牌
    folded: false,
    allIn: false,
    betAmount: 0,               // 初始下注为0
    lastAction: null
  };

  try {
    // 更新房间，添加玩家
    await db.collection('game_rooms')
      .doc(roomId)
      .update({
        players: room.players.concat([playerInfo]),
        updateTime: now
      });

    // 更新用户状态
    await db.collection('users')
      .doc(userId)
      .update({
        roomId,
        ready: false,
        updateTime: now
      });

    return {
      code: 200,
      message: '加入成功',
      data: {
        roomId,
        seat: playerInfo.seat,
        maxPlayers: room.maxPlayers,
        smallBlind: room.smallBlind,
        bigBlind: room.bigBlind
      }
    };
  } catch (error) {
    console.error('加入房间失败:', error);
    return {
      code: 500,
      message: '加入房间失败',
      error: error.message
    };
  }
};
