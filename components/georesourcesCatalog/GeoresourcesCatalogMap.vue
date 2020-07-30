<template>
  <map-component
    ref="map"
    class="flex-1"
  />
</template>

<script>
import { mapState } from 'vuex'
import MapComponent from '^/components/map'
import { getLayersExtent } from '^/components/map/map'

export default {
  components: {
    MapComponent
  },
  data () {
    return {
      addedLayers: []
    }
  },
  watch: {
    selectedPdCardLayers: 'addSelectedPdCardLayers'
  },
  computed:
    mapState({
      selectedPdCardLayers: state => state.georesourcesCatalog.selectedPdCardLayers
    }),
  methods: {
    updateSize () {
      this.$refs.map.updateSize()
    },
    removeAddedLayers () {
      this.addedLayers.forEach(x => this.$refs.map.removeLayer(x.layer))
      this.addedLayers = []
    },
    async fitLayers () {
      const resultExtent = await getLayersExtent(this.addedLayers)
      if (!resultExtent) {
        this.$notice('Для выбранной карточки ПД невозможно определить область отображения на карте')
        return
      }
      this.$refs.map.zoomToGeometryOrExtent(resultExtent)
    },
    async addSelectedPdCardLayers () {
      this.blockUI(this.$el, true)
      this.removeAddedLayers()
      try {
        for (const layerId of this.selectedPdCardLayers) {
          const layer = await this.coreApi.layers.getLayer(layerId)
          if (layer) {
            const addedLayer = await this.$refs.map.addLayer(layer, true)
            this.addedLayers.push(addedLayer)
          }
        }
        await this.fitLayers()
      } catch (error) {
        this.$error('Не удалось отобразить слои')
      } finally {
        this.blockUI(this.$el, false)
      }
    }
  }
}
</script>

<style scoped>
</style>


