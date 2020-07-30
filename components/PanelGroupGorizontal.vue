<template>
  <div class="gorizontal flex-column flex-1">
    <slot />
  </div>
</template>


<script>
export default {
  name: 'PanelGroupGorizontal'
}
</script>

<style lang="stylus" scoped>
.gorizontal
  border-top 1px solid #ddd
.gorizontal >>> .panel
  margin-bottom 0
  margin-left 0
  margin-right 0
.gorizontal >>> .panel:first-child
  margin-top 0
  border-top none
.custom-panel-group
  max-height 91vh
.custom-panel-group >>> .tablet-grid
  min-width 100px
@media (max-width 1024px)
  .custom-panel-group
    flex 0 0 89vh
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