<template>
	<view class="container">
		<view class="register-section">
			<view class="title">
				<text class="title-icon">🃏</text>
				<text class="title-text">注册账号</text>
			</view>

			<view class="subtitle">创建你的游戏账号</view>

			<!-- 邮箱 -->
			<view class="form-group">
				<text class="label">📧 邮箱</text>
				<view class="input-wrapper">
					<input
						v-model="email"
						class="inner-input"
						placeholder="请输入邮箱"
						type="text"
						confirm-type="done"
					/>
				</view>
			</view>

			<!-- 手机号 -->
			<view class="form-group">
				<text class="label">📱 手机号（可选）</text>
				<view class="input-wrapper">
					<input
						v-model="phone"
						class="inner-input"
						placeholder="请输入手机号"
						type="digit"
						maxlength="11"
					/>
				</view>
			</view>

			<!-- 昵称 -->
			<view class="form-group">
				<text class="label">👤 昵称</text>
				<view class="input-wrapper">
					<input
						v-model="nickname"
						class="inner-input"
						placeholder="请输入昵称"
						maxlength="12"
					/>
				</view>
			</view>

			<!-- 密码 (修复点：password="true") -->
			<view class="form-group">
				<text class="label">🔑 密码</text>
				<view class="input-wrapper">
					<input
						v-model="password"
						class="inner-input"
						type="text"
						password="true"
						placeholder="6-20 位密码"
						maxlength="20"
					/>
				</view>
			</view>

			<!-- 确认密码 (修复点：password="true") -->
			<view class="form-group">
				<text class="label">🔒 确认密码</text>
				<view class="input-wrapper">
					<input
						v-model="confirmPassword"
						class="inner-input"
						type="text"
						password="true"
						placeholder="请再次输入密码"
						maxlength="20"
					/>
				</view>
			</view>

			<view class="error-msg" v-if="errorMessage">
				{{ errorMessage }}
			</view>

			<view class="form-group">
				<button class="register-btn" @click="handleRegister" :loading="loading" :disabled="loading">
					注册
				</button>
			</view>

			<view class="form-group">
				<text class="hint-text">已有账号？</text>
				<text class="link-text" @click="goLogin">返回登录</text>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				email: '',
				phone: '',
				nickname: '',
				password: '',
				confirmPassword: '',
				errorMessage: '',
				loading: false
			}
		},

		methods: {
			async handleRegister() {
				this.errorMessage = ''

				// 验证输入
				if (!this.email.trim() && !this.phone.trim()) {
					this.errorMessage = '请输入邮箱或手机号'
					return
				}

				if (!this.nickname.trim()) {
					this.errorMessage = '请输入昵称'
					return
				}

				if (this.nickname.trim().length < 2 || this.nickname.trim().length > 12) {
					this.errorMessage = '昵称长度 2-12 个字符'
					return
				}

				if (!this.password || this.password.length < 6 || this.password.length > 20) {
					this.errorMessage = '密码长度 6-20 位'
					return
				}

				if (this.password !== this.confirmPassword) {
					this.errorMessage = '两次输入的密码不一致'
					return
				}

				this.loading = true

				try {
					const res = await uniCloud.callFunction({
						name: 'register',
						data: {
							email: this.email.trim(),
							phone: this.phone.trim(),
							nickname: this.nickname.trim(),
							password: this.password
						}
					})

					if (res.result.code === 200) {
						const user = res.result.data
						uni.setStorageSync('currentUser', user)

						uni.showToast({
							title: '注册成功',
							icon: 'success'
						})

						setTimeout(() => {
							uni.reLaunch({
								url: '/pages/index/index'
							})
						}, 1500)
					} else {
						this.errorMessage = res.result.message || '注册失败'
						uni.showToast({
							title: this.errorMessage,
							icon: 'none',
							duration: 3000
						})
					}
				} catch (error) {
					console.error('注册失败:', error)
					this.errorMessage = error.message || '注册失败，请稍后重试'
					uni.showToast({
						title: this.errorMessage,
						icon: 'none',
						duration: 3000
					})
				} finally {
					this.loading = false
				}
			},

			goLogin() {
				uni.navigateTo({
					url: '/pages/login/login'
				})
			}
		}
	}
</script>

<style scoped>
	.container {
		min-height: 100vh;
		background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 40rpx;
	}

	.register-section {
		width: 100%;
		max-width: 600rpx;
		background-color: rgba(255, 255, 255, 0.95);
		border-radius: 24rpx;
		padding: 60rpx 40rpx;
		box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.3);
	}

	.title {
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 20rpx;
	}

	.title-icon {
		font-size: 60rpx;
		margin-right: 16rpx;
	}

	.title-text {
		font-size: 48rpx;
		font-weight: bold;
		color: #1a1a2e;
	}

	.subtitle {
		text-align: center;
		font-size: 28rpx;
		color: #666;
		margin-bottom: 40rpx;
	}

	.form-group {
		margin-bottom: 30rpx;
	}

	.label {
		display: block;
		font-size: 28rpx;
		color: #333;
		margin-bottom: 16rpx;
		font-weight: 500;
	}

	/* 修复点：输入框外层容器，负责样式 */
	.input-wrapper {
		background-color: #f5f5f5;
		border: 2rpx solid #e0e0e0;
		border-radius: 12rpx;
		padding: 24rpx;
		width: 100%;
		box-sizing: border-box;
		display: flex;
		align-items: center;
	}

	/* 修复点：实际输入组件，去除样式干扰 */
	.inner-input {
		width: 100%;
		font-size: 28rpx;
		background-color: transparent;
		padding: 0;
		line-height: 1.5;
	}

	.inner-input::placeholder {
		color: #999;
	}

	.register-btn {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border: none;
		border-radius: 50rpx;
		padding: 28rpx 0;
		font-size: 32rpx;
		font-weight: bold;
		width: 100%;
		margin-top: 20rpx;
	}

	.register-btn:disabled {
		opacity: 0.6;
	}

	.hint-text {
		font-size: 28rpx;
		color: #666;
		margin-right: 10rpx;
	}

	.link-text {
		font-size: 28rpx;
		color: #667eea;
		font-weight: 500;
	}

	.error-msg {
		background-color: #fff2f2;
		border: 2rpx solid #ffcdd2;
		border-radius: 8rpx;
		padding: 16rpx;
		font-size: 26rpx;
		color: #c62828;
		margin-bottom: 20rpx;
		text-align: center;
	}
</style>