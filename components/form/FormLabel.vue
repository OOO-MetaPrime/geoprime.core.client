<template>
  <label v-if="htmlTitle" v-html="htmlLabelContent">
  </label>
  <label v-else>
    {{ title }}
    <span
      class="text-danger custom-form-group-label"
      v-if="required"
    >
      *
    </span>
  </label>
</template>

<script>

export default {
  props: {
    title: {
      type: String,
      default: ''
    },
    htmlTitle: {
      type: Boolean,
      default: false
    },
    required: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    htmlLabelContent () {
      if (!this.required) {
        return this.title
      }

      return `${this.title}
      <span class="text-danger custom-form-group-label">*</span>`
    }
  }
}
</script>

<style lang="stylus" scoped>
.custom-form-group-label
  display inline-block
</style>
