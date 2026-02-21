<script>
	export default {
		onLaunch: function() {
			console.log('App Launch')
			// 检查登录状态
			this.checkLoginStatus()
		},
		onShow: function() {
			console.log('App Show')
			// 每次显示时检查登录状态
			this.checkLoginStatus()
		},
		onHide: function() {
			console.log('App Hide')
		},
		globalData: {
			isLoggedIn: false,
			currentUser: null
		},
		methods: {
			checkLoginStatus() {
				const currentUser = uni.getStorageSync('currentUser')
				if (currentUser && currentUser._id) {
					this.globalData.isLoggedIn = true
					this.globalData.currentUser = currentUser
				} else {
					this.globalData.isLoggedIn = false
					this.globalData.currentUser = null
				}
			}
		}
	}
</script>

<style>
	/*每个页面公共css */
</style>
