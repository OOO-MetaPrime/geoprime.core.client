<template>
  <button
    class="btn text-button"
    :class="btnClasses"
    @click="onClick($event)"
    :title="tooltip"
    :disabled="disabled"
  >
    {{ title }}
  </button>
</template>


<script>
export default {
  props: {
    title: {
      type: String,
      default: null
    },
    tooltip: {
      type: String
    },
    disabled: {
      type: Boolean,
      default: false
    },
    primary: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    btnClasses () {
      return {
        'btn-primary': !!this.primary,
        'btn-default': !this.primary,
        'text-primary': !this.primary
      }
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
.custom-form-group .text-button
  margin-left 5px
.row.has-error
  border 1px solid #D84315
  border-radius 3px
</style>
