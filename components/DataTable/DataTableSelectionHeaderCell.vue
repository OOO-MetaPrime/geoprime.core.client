<template>
  <div class="checkbox-header">
    <checkbox
      title=" "
      v-model="value"
      @input="onInput"
    />
  </div>
</template>

<script>

export default {
  props: {
    filter: Object
  },
  components: {
  },
  data () {
    return {
      value: false
    }
  },
  methods: {
    clear () {
      this.value = false
    },
    onInput (value) {
      this.$emit('selectfilter', value)
    }
  }
}
</script>
<style lang="stylus" scoped>
.checkbox-header
  margin-bottom 0

</style>
