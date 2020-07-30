<template>
  <div class="flex-column flex-1 panel-container tabs-container">
    <slot />
  </div>
</template>


<script>
export default {
}
</script>

<style lang="stylus" scoped>
.tabs-container
  background-color white
  margin 5px
  min-width 0
  border 1px solid #ddd
.tabs
  margin 8px
  margin-bottom 0
>>> .tab-content
  flex 1
  overflow-x hidden
  overflow-y auto
  .tab-pane
    height 100%

</style>
