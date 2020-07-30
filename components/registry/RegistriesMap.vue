<template>
  <map-component
    ref="map"
    @onCreateGeometry="onCreateGeometry"
    @onDeleteGeometry="onDeleteGeometry"
    @objectBinded="onObjectBinded"
    @mapCreated="mapCreated"
  />
</template>

<script>
import { mapState } from 'vuex'
import MapComponent from '^/components/map'

export default {
  components: {
    MapComponent
  },
  computed: {
    ...mapState({
      selectedRegistry: state => state.registries.selectedRegistry
    })
  },
  mounted () {
    this.updateSize()
  },
  methods: {
    zoomOnPoint (item, registry) {
      this.$refs.map.zoomOnPoint(item, registry)
    },
    pickObjectsOnMap (items, registry) {
      this.$refs.map.pickObjectsOnMap(items, registry)
    },
    onGetCoordinates (event) {
      this.$refs.map.onGetCoordinates(event)
      this.$emit('onSetCoordinates', event.coordinate)
    },
    setGetCoordinatesMode () {
      this.$refs.map.setGetCoordinatesMode()
    },
    clearGetCoordinatesMode () {
      this.$refs.map.clearGetCoordinatesMode()
    },
    async onCreateGeometry (payload) {
      this.$emit('onCreateGeometry', payload)
    },
    async onDeleteGeometry (payload) {
      this.$emit('onDeleteGeometry', payload)
    },
    getMapField (feature) {
      return this.$refs.map.getMapField()
    },
    updateSize () {
      this.$refs.map.updateSize()
    },
    setDefaultExtent () {
      this.$refs.map.setDefaultExtent()
    },
    onObjectBinded (bindedObjectOptions) {
      this.$emit('onObjectBinded', {
        recordId: this.selectedRegistry.id,
        gisId: bindedObjectOptions.entityValue
      })
    },
    mapCreated () {
      this.$emit('mapCreated')
    }
  }
}
</script>
