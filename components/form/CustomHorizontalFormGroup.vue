<template>
<div class="form-group custom-horizontal-form-group" :class="errorClass">
  <form-label v-if="title" :title="title" :required="required" :class="labelColumnsClass" class="control-label" :htmlTitle="htmlTitle" :style="labelStyle"/>
  <label v-if="showEmptyLabel">&nbsp;</label>
  <div class="input-group" v-if="inputGroup" :class="contentColumnsClass">
    <slot/>
  </div>
  <div :class="contentColumnsClass" v-else>
    <slot />
  </div>
</div>
</template>


<script>
export default {
  props: {
    showEmptyLabel: {
      type: Boolean,
      default: false
    },
    labelColumns: {
      type: Number,
      default: 3
    },
    labelMinWidth: {
      type: String,
      default: null
    },
    contentColumns: {
      type: Number,
      default: 9
    },
    required: {
      type: Boolean,
      default: false
    },
    inputGroup: {
      type: Boolean,
      default: false
    },
    hasError: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: null
    },
    htmlTitle: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    errorClass () {
      return this.hasError ? { 'has-error': true } : null
    },
    labelStyle () {
      if (!this.labelMinWidth) {
        return null
      }

      return {
        'min-width': this.labelMinWidth
      }
    },
    labelColumnsClass () {
      const colCount = this.labelColumns != null ? this.labelColumns : 3
      const columnClassname = `col-md-${colCount}`
      return {
        [columnClassname]: true
      }
    },
    contentColumnsClass () {
      const colCount = this.contentColumns != null ? this.contentColumns : 9
      const columnClassname = `col-md-${colCount}`
      return {
        [columnClassname]: true
      }
    }
  }
}
</script>
<style lang="stylus" scoped>
.custom-form-group-label
  display inline-block
</style>
