<template lang="pug">
div
  switches(v-model="internalValue" theme="bootstrap" color="primary" :disabled="readonly")
</template>

<script>
import Switches from 'vue-switches'

export default {
  name: 'vue-switch',
  props: ['value', 'readonly'],
  components: {
    Switches
  },
  data () {
    return {
      internalValue: !!this.value,
      element: null
    }
  },
  watch: {
    value (newValue) {
      this.internalValue = !!newValue
    },
    internalValue (newValue) {
      this.$emit('input', newValue)
      this.$emit('switched', newValue)
    }
  }
}
</script>

<style lang="stylus" scoped>
</style>
