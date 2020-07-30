<template>
  <div class="data-table-image-container">
    <img
      :src="displayImage"
      :height="height"
      :width="width"
    />
  </div>
</template>

<script>
export default {
  props: {
    value: {
      type: Object
    },
    height: {
      type: Number,
      default: 64
    },
    width: {
      type: Number,
      default: 64
    }
  },
  computed: {
    displayImage () {
      const prefix = 'data:image/png;base64,'
      const base64Image = new Buffer(this.value, 'binary').toString('base64')
      return `${prefix}${base64Image}`
    }
  }
}
</script>

<style scoped lang="stylus">
.data-table-img-container .form-control
  padding 3px 10px
  height 30px
img
  width auto
  max-width 100%
  height 64px
</style>
