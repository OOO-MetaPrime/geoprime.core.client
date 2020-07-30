<template>
  <div class="lower-toolbar-container">
    <slot/>
  </div>
</template>

<script>
export default {
  data () {
    return {
    }
  }
}
</script>

<style lang="stylus" scoped>
.lower-toolbar-container
  position absolute
  display flex
  flex-flow column-reverse wrap
  background-color #ffff
  max-width 60%
  height auto
  bottom 0
  right 0
  align-items flex-end
</style>