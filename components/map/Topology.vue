<template>
  <div class="topology-container">
    <div class="header">
    <h1 style=" color: #0766A6; margin-bottom: 15px; margin-left: 5px;">Проверка коллизий </h1>
      <div class="wrapper">
        <span style="margin-right: 10px;">Тип проверки</span> 
        <select2
          class="form-control"
          :data="controls"
          v-model="controlID"
          style="width: 180px;"
          @input="onChange()"
          :disabled="isDisabled"
        />
      </div>
      <div class="wrapper">
        <span>Выбрать объект точкой</span> 
        <button
          type="button"
          @click="getCollision('point')"
          class="btn btn-icon hidden-xs"
          title="Точка"
          :class="toggleButtonClass(!collisionOnPoint)"
          :style="[collisionOnPoint ? {'margin-left': '10px'}: {'margin-left': '10px'}]"
          :disabled="isDisabled"
        >
          <i class="icon_circle_small"></i>
        </button>
      </div>
    </div>
      <memory-data-table
        class="grid-table"
        :items="collisions"
        :columns="columns"
        :selectable="isSelectable"
        v-model="selectedItem"
        @itemSelected="showItem"
      />
  </div>
</template>

<script>
import VectorSource from 'ol/source/vector'
import VectorLayer from 'ol/layer/vector'
import Style from 'ol/style/style'
import Circle from 'ol/style/circle'
import Fill from 'ol/style/fill'
import Stroke from 'ol/style/stroke'
import Feature from 'ol/feature'
import Draw from 'ol/interaction/draw'
import GeoJSON from 'ol/format/geojson'
import { getSearchExtent } from './identify'
import axios from 'axios'

export default {
  props: {
    map: Object,
    isActive: Boolean
  },
  data () {
    return {
      modify: null,
      selection: null,
      editingFeature: null,
      currentDrawType: null,
      draw: null,
      vector: null,
      source: null,
      text: null,
      collisions: [],
      collisionOnPoint: false,
      controls: [],
      controlID: null,
      selectedItem: null,
      isDisabled: false,
      isSimple: false
    }
  },
  computed: {
    columns () {
      return [
        {
          title: 'Слой 1',
          field: 'layer1'
        },
        {
          title: 'Слой 2',
          field: 'layer2'
        },
        {
          title: 'Тип проверки',
          field: 'type'
        },
        {
          title: 'Ид. № объекта',
          field: ''
        }
      ]
    },
    isSelectable () {
      if (this.isSimple) {
        return false
      }
      return true
    }
  },
  watch: {
    isActive () {
      if (!this.isActive) {
        this.deactivate()
        this.collisionOnPoint = false
        this.clearHighlightedObjectsOnMap()
      } else {
        this.getCollision('polygon')
      }
    },
    map () {
      (this.isActive && this.map) && this.getCollision('polygon')
    }
  },
  mounted () {
    this.getControls()
    this.controlID = 'fb63eacf-6e01-4dbf-bd79-b209f6635c53'
  },
  methods: {
    disableLowerTools (disabledObj) {
      this.isDisabled = disabledObj.disabled
      this.isSimple = disabledObj.simple
      if (disabledObj.disabled) {
        this.deactivate()
      }
    },
    async onSelectedItem (item) {
      this.selectedItem = item
    },
    async getControls () {
      const { data: controls } = await axios.get('/api/map/topology-control-settings')
      this.controls = controls
    },
    toggleButtonClass (isActive) {
      return isActive ? ['btn-primary', 'active'] : ['btn-default']
    },
    getCollision (type) {
      this.map.removeInteraction(this.draw)
      this.currentDrawType = type
      this.collisionOnPoint = !this.collisionOnPoint
      if (this.collisionOnPoint && type === 'point') {
        this.currentDrawType = 'polygon'
      }
      this.draw = new Draw({
        type: this.getDrawType(this.currentDrawType)
      })
      this.draw.on('drawend', this.onDrawEnd)
      this.map.addInteraction(this.draw)
    },
    async onDrawEnd (drawEvent) {
      let xmin, ymin, xmax, ymax
      if (this.currentDrawType === 'point') {
        let coordinates = drawEvent.feature.getGeometry().getCoordinates();
        ({ point1: [xmin, ymin], point2: [xmax, ymax] } = getSearchExtent(this.map, coordinates))
      }
      if (this.currentDrawType === 'polygon') {
        [xmin, ymin, xmax, ymax] = drawEvent.feature.getGeometry().getExtent()
      }
      const srsCode = this.map.getView().getProjection().getCode()
      const wkid = parseInt(srsCode.split(':')[1])
      const { data: collisions } = await axios.post('/api/map/topology-collisions', {
        settingId: this.controlID,
        xmin,
        ymin,
        xmax,
        ymax,
        srid: wkid
      })
      this.collisions = collisions
      // this.$emit('saveGeometry', feature)
    },
    getDrawType (type) {
      switch (type) {
        case 'point':
          return 'Point'
        case 'polygon':
          return 'Polygon'
        default: return 'Polygon'
      }
    },
    deactivate () {
      this.map.removeInteraction(this.draw)

      this.currentDrawType = null
    },
    onChange (params) {
      this.collisions = []
    },
    showItem (item) {
      this.clearHighlightedObjectsOnMap()
      // this.itemActive = !this.itemActive
      let geometry = new GeoJSON().readGeometry(item.shape)
      let extent = geometry.getExtent()
      this.highlightGeometriesOnMap(geometry, this.map, true)
      this.zoomMapToGeometryOrExtent(this.map, extent)
    },
    zoomMapToGeometryOrExtent (map, geometryOrExtent, scale = null) {
      const padding = [0, 0, 0, 0]
      map.getView().fit(geometryOrExtent, { maxZoom: 17, padding: padding })
    },

    highlightGeometriesOnMap (geometry, map, isFillHighlight) {
      if (!this.featureOverlay) {
        this.featureOverlay = new VectorLayer({
          source: new VectorSource(),
          map: map,
          style: new Style({
            stroke: new Stroke({
              color: '#ff1493',
              width: 2
            }),
            fill: isFillHighlight
              ? new Fill({
                color: 'rgba(255,20,147,0.5)'
              })
              : undefined,
            image: new Circle({
              radius: 8,
              fill: new Fill({
                color: 'rgba(255,20,147,.5)'
              })
            })
          })
        })
      } else {
        this.featureOverlay.setMap(map)
      }
      let feature = new Feature({
        geometry: geometry
      })
      this.featureOverlay.getSource().addFeature(feature)
      this.featureOverlay.getSource().refresh()
    },
    clearHighlightedObjectsOnMap () {
      if (!this.featureOverlay) {
        return
      }
      this.featureOverlay.getSource().clear()
    }
  }
}
</script>

<style lang="stylus" scoped>
.topology-container
  padding 5px
  z-index 2
  background-color #ffff
  margin 5px
  bottom 0
  right 0
  width 100%
  height 35vh
  display flex
  flex-direction column
.topology-container .header
  display flex
  justify-content space-between
  align-items center
  width: 100%
  margin: 0 auto;
  height 8%
  margin-bottom 10px
  margin-top 10px
.grid-table
  flex 1
  min-height 150px
.text-input
  display inline-block
  width 180px
  margin-left 10px
span 
  color #0766A6
h1
  font-size 15px
  padding-bottom 5px
.btn-default
  margin-left 10px
.wrapper
  display flex
  align-items center
</style>