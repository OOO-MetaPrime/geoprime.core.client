<template>
  <div class="scale-control">
    <span class="scale-label">Масштаб 1:</span>
    <number-input class="scale-input" v-model="currentScale" @keyup.enter="onSetScale" @onValidate="onScaleValidation"/>
  </div>
</template>

<script>
import {
  getScale,
  setScale
} from './map'

export default {
  props: ['map'],
  components: {
  },
  data () {
    return {
      currentScale: null,
      isScaleValid: true
    }
  },
  methods: {
    getScale () {
      return getScale(this.map)
    },
    setScaleControlValue () {
      this.currentScale = this.getScale()
      this.$emit('changeCurrentScale', this.currentScale)
    },
    onSetScale () {
      const parsedScale = parseInt(this.currentScale)
      if (!this.isValidScale || isNaN(parsedScale) || parsedScale == null || parsedScale <= 0) {
        this.setScaleControlValue()
        return
      }
      setScale(this.map, this.currentScale)
    },
    onScaleValidation (event) {
      this.isValidScale = event.isValid
    },
    setup () {
      this.map.on('moveend', this.setScaleControlValue)
    }
  }
}
</script>

<style lang="stylus" scoped>
.scale-control
  display flex
  background rgba(255,255,255,0.7)
  align-items center
  border 1px solid #ddd
  border-radius 3px
  width 160px
.scale-control .scale-input
  background rgba(255,255,255,0)
  border-top none
  border-bottom none
  border-right none
  padding-right 5px
  padding-left 5px
  padding-top 1px
  padding-bottom 1px
  font-weight bold
  height 24px
  max-width 80px
.scale-control .scale-label
  margin-left 5px
  margin-right 5px
  margin-top 1px
  white-space nowrap
</style>