'use strict';

/**
 * 玩家离开房间
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

  // 验证玩家是否在房间中
  const playerIndex = room.players.findIndex(p => p.userId === event.userInfo.uid);
  if (playerIndex === -1) {
    return {
      code: 400,
      message: '您不在该房间中'
    };
  }

  try {
    const now = new Date();
    const currentPlayer = room.players[playerIndex];

    // 如果游戏已开始，需要特殊处理
    if (room.gameState === 'playing') {
      // 标记玩家为弃牌状态
      const newPlayers = [...room.players];
      newPlayers[playerIndex] = {
        ...newPlayers[playerIndex],
        folded: true,
        ready: false
      };

      await db.collection('game_rooms')
        .doc(roomId)
        .update({
          players: newPlayers,
          updateTime: now
        });

      // 检查是否只剩一个玩家
      const activePlayers = newPlayers.filter(p => !p.folded);
      if (activePlayers.length === 1) {
        // 只剩一个玩家，直接结束游戏
        // 胜利者获得所有底池
        const winner = activePlayers[0];

        await db.collection('users')
          .doc(winner.userId)
          .update({
            coins: winner.coins + room.pot,
            roomId: '',
            ready: false,
            updateTime: now
          });

        // 更新房间状态
        await db.collection('game_rooms')
          .doc(roomId)
          .update({
            gameState: 'ended',
            winners: [winner.userId],
            potDistribution: [{ userId: winner.userId, amount: room.pot }],
            endedTime: now
          });
      }
    } else {
      // 游戏未开始，直接移除玩家
      const newPlayers = room.players.filter((_, index) => index !== playerIndex);

      if (newPlayers.length === 0) {
        // 如果房间为空，且离开的是房主，删除房间
        if (room.creatorId === event.userInfo.uid) {
          await db.collection('game_rooms')
            .doc(roomId)
            .remove();
        } else {
          // 非房主离开，房间保留但玩家列表为空
          await db.collection('game_rooms')
            .doc(roomId)
            .update({
              players: [],
              updateTime: now
            });
        }
      } else {
        // 更新房间玩家列表
        await db.collection('game_rooms')
          .doc(roomId)
          .update({
            players: newPlayers,
            updateTime: now
          });
      }
    }

    // 更新用户状态
    await db.collection('users')
      .doc(event.userInfo.uid)
      .update({
        roomId: '',
        ready: false,
        updateTime: now
      });

    return {
      code: 200,
      message: '离开房间成功',
      data: {
        roomId
      }
    };
  } catch (error) {
    console.error('离开房间失败:', error);
    return {
      code: 500,
      message: '离开房间失败',
      error: error.message
    };
  }
};
