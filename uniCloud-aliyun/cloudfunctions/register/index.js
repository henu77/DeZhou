'use strict';

const crypto = require('crypto');

/**
 * 用户注册云函数
 */
exports.main = async (event, context) => {
  const db = uniCloud.database();
  const { email, phone, nickname, password } = event;

  // 参数验证
  if (!email && !phone) {
    return {
      code: 400,
      message: '请输入邮箱或手机号'
    };
  }

  if (!nickname || nickname.trim().length < 2 || nickname.trim().length > 12) {
    return {
      code: 400,
      message: '昵称长度必须在 2-12 个字符之间'
    };
  }

  if (!password || password.length < 6 || password.length > 20) {
    return {
      code: 400,
      message: '密码长度必须在 6-20 位之间'
    };
  }

  // 邮箱格式验证
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return {
      code: 400,
      message: '请输入有效的邮箱地址'
    };
  }

  // 手机号格式验证（中国大陆）
  if (phone && !/^1[3-9]\d{9}$/.test(phone)) {
    return {
      code: 400,
      message: '请输入有效的手机号'
    };
  }

  try {
    // 检查邮箱是否已存在
    if (email) {
      const emailRes = await db.collection('users')
        .where({ email: email.trim() })
        .field({ _id: 1 })
        .get();

      if (emailRes.data && emailRes.data.length > 0) {
        return {
          code: 409,
          message: '该邮箱已被注册'
        };
      }
    }

    // 检查手机号是否已存在
    if (phone) {
      const phoneRes = await db.collection('users')
        .where({ phone: phone.trim() })
        .field({ _id: 1 })
        .get();

      if (phoneRes.data && phoneRes.data.length > 0) {
        return {
          code: 409,
          message: '该手机号已被注册'
        };
      }
    }

    // 加密密码
    const encryptedPassword = crypto.createHash('sha256').update(password).digest('hex');

    // 生成用户 ID
    const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    // 创建用户
    const now = new Date();
    const newUser = {
      _id: userId,
      email: email ? email.trim() : '',
      phone: phone ? phone.trim() : '',
      password: encryptedPassword,
      nickname: nickname.trim(),
      avatar: '',
      coins: 10000,
      totalGames: 0,
      winCount: 0,
      totalPotWon: 0,
      roomId: null,
      ready: false,
      createTime: now,
      updateTime: now
    };

    await db.collection('users').add(newUser);

    // 返回用户信息（不包含密码）
    const userInfo = {
      _id: userId,
      nickname: nickname.trim(),
      email: email ? email.trim() : '',
      phone: phone ? phone.trim() : '',
      avatar: '',
      coins: 10000,
      totalGames: 0,
      winCount: 0,
      totalPotWon: 0,
      ready: false
    };

    return {
      code: 200,
      message: '注册成功',
      data: userInfo
    };
  } catch (error) {
    console.error('注册失败:', error);
    return {
      code: 500,
      message: '注册失败，请稍后重试',
      error: error.message
    };
  }
};
