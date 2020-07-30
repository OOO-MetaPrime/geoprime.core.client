<template>
  <div class="flex-row flex-1 custom-panel-group">
    <slot />
  </div>
</template>


<script>
export default {
  name: 'PanelGroup'
}
</script>

<style lang="stylus" scoped>
.custom-panel-group
  padding 5px
  height 100%
.custom-panel-group >>> .custom-panel-group
  padding 0px
.custom-panel-group >>> .panel-container
  margin 0
  height 100%
.custom-panel-group >>> .panel-container + .panel
  margin-left 5px
.custom-panel-group >>> .panel + .panel-container
  margin-left 5px
.custom-panel-group >>> .panel-container + .panel-container
  margin-left 5px
.custom-panel-group >>> .panel-container > .panel
  margin 0
  height 100%
.custom-panel-group >>> .tablet-grid
  min-width 100px
@media (max-width 1024px)
  .custom-panel-group
    overflow auto
  .custom-panel-group >>> .tablet-grid
    flex 1 1 100%
    height 86.7vh
    position relative
  .custom-panel-group >>> .correcter-table
    width 98%
    height 87vh
@media (max-width 768px)
  .tablet-grid
    flex-wrap wrap
  .tablet-grid > div
    min-width 50%
@media (max-width 425px)
  .custom-panel-group
    flex 0 0 85vh
  .custom-panel-group >>> .correcter-table
    height 83vh
    min-width 98%
  .custom-panel-group >>> .tablet-grid
    height 82vh
    min-width 97%
</style>
