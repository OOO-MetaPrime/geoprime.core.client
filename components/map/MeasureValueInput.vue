<template>
  <div class="scale-control">
    <text-input id="measure-value-input" class="measure-value-input" :value="measureValue" disabled />
  </div>
</template>

<script>
export default {
  props: {
    measureValue: {
      type: String,
      default: ''
    }
  },
  data () {
    return {
      //
    }
  }
}
</script>>

<style lang="stylus" scoped>
.measure-value-input
  width 200px
  margin 0 auto
  position absolute
  z-index 9999
  top 30px
  left calc(50% - 100px)
  border 1px solid lightblue
</style>