<template>
    <div class="checkbox"  :class="checkerClass">
      <!-- <label class="display-block"> -->
        <div class="display-block checker" :class="checkerClass">
          <span :class="{ checked: value }">
            <input
              class="styled"
              type="checkbox"
              :checked="value"
              :disabled="disabled"
              @change="onChange($event)">
          </span>
        </div>
      <!-- </label> -->
  </div>
</template>

<script>
export default {
  props: {
    value: {
      type: Boolean
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    checkerClass () {
      if (!this.disabled) {
        return null
      }

      return {
        'disabled': true
      }
    }
  },
  methods: {
    onChange (input) {
      this.$emit('setNewValue', input.target.checked)
    }
  }
}
</script>
<style scoped lang="stylus">
.checkbox .checker
  position relative
</style>
