<template>
  <span class="input-group-btn">
    <button
      class="btn btn-default text-primary"
      @click="onClick($event)"
      :title="tooltip || title"
      :disabled="disabled"
    >
      {{ title }}
    </button>
  </span>
</template>


<script>
export default {
  props: {
    title: {
      type: String,
      default: null
    },
    tooltip: {
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
    }
  },
  methods: {
    onClick (event) {
      this.$emit('click', event)
    }
  }
}
</script>
