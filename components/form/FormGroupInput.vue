<template>
<div class="form-group" :class="errorClass">
  <label v-if="title">{{ title }}
    <span
      class="text-danger"
      v-if="required"
    > 
      *
    </span>
  </label>
  <label v-if="showEmptyLabel">&nbsp;</label>
  <input
    class="form-control"
    v-bind="$attrs"
    :value="value"
    @input="$emit('input', $event.target.value)"
    :disabled="isDisabled"
  />
  <slot/>
</div>
</template>


<script>
export default {
  inheritAttrs: false,
  props: {
    value: {
      type: [String, Number],
      default: null
    },
    showEmptyLabel: Boolean,
    required: Boolean,
    title: {
      type: String,
      default: null
    },
    isDisabled: Boolean,
    hasError: {
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
