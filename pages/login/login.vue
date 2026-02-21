<template>
	<view class="container">
		<view class="login-section">
			<view class="title">
				<text class="title-icon">🃏</text>
				<text class="title-text">德州扑克</text>
			</view>

			<view class="subtitle">欢迎回来</view>

			<!-- 账号输入 -->
			<view class="form-group">
				<text class="label">📧 邮箱/手机号</text>
				<view class="input-wrapper">
					<input
						v-model="account"
						class="inner-input"
						placeholder="请输入邮箱或手机号"
						type="text"
						confirm-type="done"
					/>
				</view>
			</view>

			<!-- 密码输入 (修复点：password="true") -->
			<view class="form-group">
				<text class="label">🔑 密码</text>
				<view class="input-wrapper">
					<input
						v-model="password"
						class="inner-input"
						type="text"
						password="true"
						placeholder="请输入密码"
						maxlength="20"
						confirm-type="done"
					/>
				</view>
			</view>

			<view class="error-msg" v-if="errorMessage">
				{{ errorMessage }}
			</view>

			<view class="form-group">
				<button class="login-btn" @click="handleLogin" :loading="loading" :disabled="loading">
					登录
				</button>
			</view>

			<view class="form-group">
				<text class="hint-text">还没有账号？</text>
				<text class="link-text" @click="goRegister">立即注册</text>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				account: '',
				password: '',
				errorMessage: '',
				loading: false
			}
		},

		onLoad() {
			// 检查是否已登录
			const currentUser = uni.getStorageSync('currentUser')
			if (currentUser) {
				uni.reLaunch({
					url: '/pages/index/index'
				})
			}
		},

		methods: {
			async handleLogin() {
				this.errorMessage = ''

				if (!this.account.trim() || !this.password.trim()) {
					this.errorMessage = '请输入账号和密码'
					return
				}

				this.loading = true

				try {
					const res = await uniCloud.callFunction({
						name: 'login',
						data: {
							account: this.account.trim(),
							password: this.password.trim()
						}
					})

					if (res.result.code === 200) {
						const user = res.result.data
						uni.setStorageSync('currentUser', user)

						uni.showToast({
							title: '登录成功',
							icon: 'success'
						})

						setTimeout(() => {
							uni.reLaunch({
								url: '/pages/index/index'
							})
						}, 1500)
					} else {
						this.errorMessage = res.result.message || '登录失败'
						uni.showToast({
							title: this.errorMessage,
							icon: 'none',
							duration: 3000
						})
					}
				} catch (error) {
					console.error('登录失败:', error)
					this.errorMessage = error.message || '登录失败，请稍后重试'
					uni.showToast({
						title: this.errorMessage,
						icon: 'none',
						duration: 3000
					})
				} finally {
					this.loading = false
				}
			},

			goRegister() {
				uni.navigateTo({
					url: '/pages/register/register'
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

	.login-section {
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
		margin-bottom: 60rpx;
	}

	.form-group {
		margin-bottom: 40rpx;
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
		position: relative;
		z-index: 10;
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

	.login-btn {
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

	.login-btn:disabled {
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