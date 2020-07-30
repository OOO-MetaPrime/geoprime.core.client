<template>
  <button
    class="btn btn-icon custom-icon-button"
    :class="btnClasses"
    @click="onClick($event)"
    :title="title"
    :disabled="disabled"
  >
    <span :class="iconClass"></span>
    {{ text }}
  </button>
</template>


<script>
export default {
  props: {
    title: {
      type: String,
      default: null
    },
    icon: {
      type: String,
      default: null
    },
    primaryIcon: {
      type: String,
      default: null
    },
    disabled: {
      type: Boolean,
      default: false
    },
    primary: {
      type: Boolean,
      default: false
    },
    text: {
      type: String,
      default: null
    },
    link: {
      type: Boolean,
      default: false
    },
    success: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    btnClasses () {
      if (this.link) {
        return {
          'text-primary': !!this.primary,
          'text-success': !!this.success,
          'btn-link': true
        }
      }
      return {
        'btn-default': !this.primary && !this.success,
        'btn-primary': !!this.primary,
        'btn-success': !!this.success
      }
    },
    iconClass () {
      const icon = this.primary ? (this.primaryIcon || this.icon) : this.icon
      return icon
        ? {
          [icon]: true,
          'position-left': !!this.text
        }
        : null
    }
  },
  methods: {
    onClick (event) {
      this.$emit('click', event)
    }
  }
}
</script>
<style lang="stylus" scoped>
.custom-icon-button.btn-link:focus
  color #333333
</style>
