import Vue from 'vue'

Vue.mixin({
  methods: {
    $closeAllNotifications () {
      this.$notify.dismissAll()
    },
    $notice (text, options) {
      const notificationOptions = options || {}
      this.$notify({
        content: text,
        type: 'warning',
        html: true,
        duration: notificationOptions.hide ? 0 : 2000,
        dismissible: true,
        icon: '',
        ...notificationOptions
      })
    },
    $success (text, options) {
      const notificationOptions = options || {}
      this.$notify({
        content: text,
        type: 'success',
        html: true,
        duration: notificationOptions.hide ? 0 : 2000,
        dismissible: true,
        icon: '',
        ...notificationOptions
      })
    },
    $error (text, options) {
      const notificationOptions = options || {}
      this.$notify({
        content: text,
        type: 'danger',
        html: true,
        duration: notificationOptions.hide ? 0 : 4000,
        dismissible: true,
        icon: '',
        ...notificationOptions
      })
    },
    async _prompt ({ title = 'Ввод текста', okText = 'ОК', cancelText = 'Отмена', placeholder = '', text = '' }) {
      try {
        const newValue = await this.$prompt({
          title,
          content: text,
          okText: okText,
          cancelText: cancelText
        })
        return newValue
      } catch (e) {
        return ''
      }
    },
    async _confirm (content, caption = '', okText = 'Да', cancelText = 'Нет', okType = 'primary', cancelType = 'default') {
      try {
        await this.$confirm({
          title: caption,
          content,
          okText,
          okType,
          cancelType,
          cancelText,
          html: true,
          customClass: { 'confirmation-dialog': true }
        })
        return true
      } catch (e) {
        return false
      }
    }
  }
})
