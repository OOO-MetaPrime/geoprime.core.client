<template>
  <div class="data-table-icon-container">
    <span :class="icon" class="data-table-icon"></span>
  </div>
</template>

<script>
export default {
  props: {
    icon: {
      type: String
    },
    height: {
      type: Number,
      default: 16
    },
    width: {
      type: Number,
      default: 16
    }
  }
}
</script>

<style scoped lang="stylus">
.data-table-icon-container
  padding 3px 10px
  text-align center
.data-table-icon
  height 16px
  width 16px
</style>
