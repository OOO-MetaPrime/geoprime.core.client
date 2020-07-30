<template>
  <div class="form-group">
    <div class="checkbox" :class="checkerClass">
      <label class="display-block" v-if="title">
        <div class="checker" :class="checkerClass">
          <span :class="{ checked: value }">
            <input
              class="styled"
              type="checkbox"
              :checked="value"
              :disabled="disabled"
              @change="onChange($event)">
          </span>
        </div>
        {{ title }}
        <span class="text-danger" v-if="required"> * </span>
      </label>
  </div>
  </div>
</template>


<script>
export default {
  props: {
    value: Boolean,
    disabled: Boolean,
    required: Boolean,
    title: {
      type: String,
      default: null
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
    onChange (event) {
      if (this.disabled) {
        event.stopPropagation()
        return
      }
      this.$emit('setSaveActive', true)
      this.$emit('input', event.target.checked)
      event.stopPropagation()
    }
  }
}
</script>

<style scoped lang="stylus">
label.display-block
  padding-right 10px
</style>
