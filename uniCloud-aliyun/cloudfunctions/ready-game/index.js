'use strict';

/**
 * 玩家准备/取消准备
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

  const { roomId, ready = true } = event;

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

  // 验证房间状态（只能在等待状态下准备）
  if (room.gameState !== 'waiting') {
    return {
      code: 400,
      message: '游戏已开始，无法更改准备状态'
    };
  }

  // 查找玩家在房间中的索引
  const playerIndex = room.players.findIndex(p => p.userId === event.userInfo.uid);
  if (playerIndex === -1) {
    return {
      code: 400,
      message: '您不在该房间中'
    };
  }

  try {
    const now = new Date();

    // 更新房间中的玩家准备状态
    const newPlayers = [...room.players];
    newPlayers[playerIndex] = {
      ...newPlayers[playerIndex],
      ready
    };

    await db.collection('game_rooms')
      .doc(roomId)
      .update({
        players: newPlayers,
        updateTime: now
      });

    // 更新用户状态
    await db.collection('users')
      .doc(event.userInfo.uid)
      .update({
        ready,
        updateTime: now
      });

    return {
      code: 200,
      message: ready ? '准备成功' : '取消准备',
      data: {
        roomId,
        ready
      }
    };
  } catch (error) {
    console.error('更改准备状态失败:', error);
    return {
      code: 500,
      message: '更改准备状态失败',
      error: error.message
    };
  }
};
