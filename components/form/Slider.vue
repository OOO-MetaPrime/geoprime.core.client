<template>
  <div class="slider" ref="slider"></div>
</template>

<script>
import slider from 'nouislider'

export default {
  name: 'slider',
  props: ['min', 'max', 'start'],
  mounted () {
    slider.create(this.$el, {
      start: [this.start],
      range: {
        'min': parseInt(this.min),
        'max': parseInt(this.max)
      }
    })

    this.$el.noUiSlider.on('update', this.updateSlider)
  },
  methods: {
    updateSlider (values, handle, unencoded, isTap, positions) {
      this.$emit('update', parseInt(values[handle]))
    },
    setPosition (newValue) {
      this.$refs.slider.noUiSlider.set([newValue])
    }
  }
}
</script>

<style lang="stylus" scoped>
div.slider.noUi-target.noUi-ltr.noUi-horizontal
  height 2px
  min-width 50px

.slider.noUi-target
  background rgb(189, 189, 189)
  border none
  box-shadow none
  border-radius 0

.slider.noUi-horizontal .noUi-handle
  left: -8px
  position: absolute;
  cursor: pointer;
  pointer-events: inherit;
  top: -8px;
  left: 21%;
  z-index: 1;
  margin: 1px 0px 0px;
  width: 12px;
  height: 12px;
  background-color #3f51b5
  border none
  box-shadow none
  border-radius: 50%;
  transform: translate(-50%, -50%);

.slider .noUi-handle:before, .noUi-handle:after
  display none
</style>
