<template>
  <div class="data-table-image-container">
    <img
      :src="value"
      :height="height"
      :width="width"
    />
  </div>
</template>

<script>
export default {
  props: {
    value: {
      type: String
    },
    height: {
      type: Number,
      default: 42
    },
    width: {
      type: Number,
      default: 42
    }
  }
}
</script>

<style scoped lang="stylus">
.data-table-img-container .form-control
  padding 3px 10px
  height 30px
</style>
