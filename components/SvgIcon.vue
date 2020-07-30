<template>
  <img v-if="url" class="vector-icon" :src="$url(url)" />
  <div v-else class="wrap">
    <slot />
  </div>
</template>
<script>
export default {
  props: {
    url: {
      type: String
    }
  }
}
</script>
<style lang="stylus" scoped>
.vector-icon
  width 18px
  height 18px
.wrap .icon-svg 
  width 18px
  height 18px
  fill #333
.btn-primary .icon-svg,.vector-icon
  fill #fff
</style>
