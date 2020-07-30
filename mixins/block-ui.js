import $ from 'jquery'

export default {
  methods: {
    async waitAsync (action) {
      try {
        this.blockUI(this.$el, true)
        await action()
      } finally {
        this.blockUI(this.$el, false)
      }
    },
    wait (action) {
      try {
        this.blockUI(this.$el, true)
        action()
      } finally {
        this.blockUI(this.$el, false)
      }
    },
    blockUI (element, isBusy) {
      if (isBusy) {
        $(element).block({
          message: '<i class="icon_spinner spinner" style="font-size:25px;top:50%"></i>',
          overlayCSS: {
            backgroundColor: '#fff',
            opacity: 1.0,
            cursor: 'wait',
            'box-shadow': '0 0 0 1px #ddd'
          },
          css: {
            border: 0,
            padding: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'none'
          }
        })
      } else {
        $(element).unblock()
      }
    }
  }
}
