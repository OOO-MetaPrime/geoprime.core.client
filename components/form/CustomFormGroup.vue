<template>
<div class="form-group custom-form-group" :class="errorClass">
  <form-label v-if="title" :title="title" :required="required" :htmlTitle="htmlTitle"/>
  <label v-if="showEmptyLabel">&nbsp;</label>
  <div class="input-group" v-if="inputGroup">
    <slot/>
  </div>
  <slot v-else/>
</div>
</template>


<script>
export default {
  props: {
    showEmptyLabel: {
      type: Boolean,
      default: false
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
    }
  }
}
</script>
<style lang="stylus" scoped>
.custom-form-group-label
  display inline-block
</style>
