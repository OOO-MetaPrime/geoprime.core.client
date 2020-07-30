<template>
  <ul class="media-list">
    <li 
      class="list-item" 
      v-for="(layer, layerIndex) in layersWithLegends" 
      :key="layerIndex"
    >
      <label class="text-size-large" >{{ layer.name }}</label>
      <div
        class="legend-item"
        v-for="(legend, index) in layer.legends"
        :key="index"
      >
        <img
          class="img-responsive"
          :src="legend.legendUrl" 
        >
        <label
          class="text-size-large"
          v-if="legend.label"
        > 
          {{ legend.label }} 
        </label>
      </div>
      <div v-if="layer.style">
        <div class="custom-image-container">
          <div class="point icon" />
          <p>point</p>
        </div>
        <div class="custom-image-container">
          <div class="line icon" />
          <p>line</p>
        </div>
        <div class="custom-image-container">
          <div class="poligon icon" />
          <p>poligon</p>
        </div>
      </div>
    </li>
  </ul>
</template>

<script>
import * as mapFunctions from './map.js'

export default {
  props: {
    layers: Array
  },
  data () {
    return {
      layersWithLegends: []
    }
  },
  watch: {
    async layers (layers) {
      this.layersWithLegends = await mapFunctions.getLayersWithLegends(layers)
    }
  }
}
</script>

<style lang="stylus" scoped>
.list-item
  border-bottom-style solid 
  border-color  #ddd
  border-width 1px
  margin-bottom  5px
  padding-bottom 5px
.media-list
  width 100%
.legend-item
  display block
.img-responsive
  display inline
.custom-image-container
  display flex
  align-items baseline
  .icon
    margin 0 15px
  .point 
    width 10px
    height 10px 
    border-radius 50%
    background red
  .line
    width 15px 
    height 5px
    background #00f704
  .poligon
    width 15px
    height 15px
    border 1px solid #00f704
    background: #7b9470
</style>
