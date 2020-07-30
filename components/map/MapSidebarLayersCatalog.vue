<template>
  <layers-catalog 
    v-model="selected"
    ref="layersCatalog"
  />
</template>

<script>
import LayersCatalog from './LayersCatalog'
import difference from 'lodash/difference'
import { getMapLayer } from './map'

export default {
  components: {
    LayersCatalog
  },
  props: {
    map: Object,
    layers: Array
  },
  data () {
    return {
      selected: []
    }
  },
  watch: {
    layers (layers) {
      this.selected = layers
        .filter(x => !x.layer.isBasemap)
        .map(x => x.layer.id)
    },
    selected (selected) {
      const currentLayers = this.layers
        .filter(x => !x.layer.isBasemap)
        .map(x => x.layer.id)
      const addedLayers = difference(selected, currentLayers)
      const removedLayers = difference(currentLayers, selected)
      this.addLayers(addedLayers)
      this.removeLayers(removedLayers)
    }
  },
  methods: {
    async addLayers (layers) {
      for (const layerId of layers) {
        const layer = this.$refs.layersCatalog.getLayer(layerId)
        const mapLayer = await getMapLayer(layer, this.map)
        this.map.addLayer(mapLayer)
        this.layers.push({
          layer: layer,
          mapLayer: mapLayer
        })
      }
    },
    removeLayers (layers) {
      for (const layerId of layers) {
        const layer = this.layers.find(x => x.layer.id === layerId)
        const index = this.layers.indexOf(layer)
        this.map.removeLayer(layer.mapLayer)
        this.layers.splice(index, 1)
      }
    }
  }
}
</script>

<style lang="stylus" scoped>


</style>
