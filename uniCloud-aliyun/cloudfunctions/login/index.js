'use strict';

const crypto = require('crypto');

/**
 * 用户登录云函数
 */
exports.main = async (event, context) => {
  const db = uniCloud.database();
  const { account, password } = event;

  // 参数验证
  if (!account || !password) {
    return {
      code: 400,
      message: '请输入账号和密码'
    };
  }

  if (password.length < 6 || password.length > 20) {
    return {
      code: 400,
      message: '密码长度必须在 6-20 位之间'
    };
  }

  // 加密密码
  const encryptedPassword = crypto.createHash('sha256').update(password).digest('hex');

  try {
    // 查询用户（支持邮箱或手机号登录）
    const query = account.includes('@')
      ? { email: account.trim(), password: encryptedPassword }
      : { phone: account.trim(), password: encryptedPassword };

    const userRes = await db.collection('users')
      .field({
        _id: 1,
        nickname: 1,
        email: 1,
        phone: 1,
        avatar: 1,
        coins: 1,
        totalGames: 1,
        winCount: 1,
        totalPotWon: 1,
        roomId: 1,
        ready: 1
      })
      .where(query)
      .get();

    if (!userRes.data || userRes.data.length === 0) {
      return {
        code: 401,
        message: '账号或密码错误'
      };
    }

    const user = userRes.data[0];

    // 检查用户是否在游戏中
    if (user.roomId) {
      // 检查房间是否还存在
      const roomRes = await db.collection('game_rooms')
        .doc(user.roomId)
        .get();

      if (roomRes.data && roomRes.data.length > 0) {
        const room = roomRes.data[0];
        if (room.gameState === 'playing') {
          return {
            code: 403,
            message: '您有未完成的游戏，请先完成当前对局'
          };
        }
      }

      // 清理用户旧的房间状态
      await db.collection('users')
        .doc(user._id)
        .update({
          roomId: null,
          ready: false
        });
    }

    return {
      code: 200,
      message: '登录成功',
      data: user
    };
  } catch (error) {
    console.error('登录失败:', error);
    return {
      code: 500,
      message: '登录失败，请稍后重试',
      error: error.message
    };
  }
};
