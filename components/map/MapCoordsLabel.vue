<template>
  <div id="popup" ref="coordspopup" class="panel panel-white custom-panel" v-show="isShown">
    <div class="panel-body">
      <form-row>
        <select2
          class="form-control"
          text="title"
          :data="sridList"
          v-model="selectedSrid"
        />
      </form-row>
      <form-row>
        <form-group title="Долгота (x)" :columns="6">
          <text-input
            :value="transformedGeometry.coordinates[0]"
            readonly
          />
        </form-group>
        <form-group title="Широта (y)" :columns="6">
          <text-input
            :value="transformedGeometry.coordinates[1]"
            readonly
          />
        </form-group>
      </form-row>
      <div class="coords-footer">
        <button
          class="btn btn-default btn-icon"
          type="button"
          :disabled="!selectedSrid"
          @click="downloadJson"
        >
          <i class="icon_file_download" title="Сохранить в файл"></i>
        </button>
        <button
          class="btn btn-default bth-icon"
          :disabled="!selectedSrid"
          type="button"
          @click="copyJson"
        >
          <i class="icon_copy" title="Копировать"></i>
        </button>
        <button 
          class="btn btn-default btn-icon"
          type="button"
          @click="closeModal"
        >
          <i class="icon_cross" title="Закрыть"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
const DEFAULT_SRID = 3857
/* eslint no-unused-vars: "off" */
import { mapState } from 'vuex'
import Feature from 'ol/feature'
import Overlay from 'ol/overlay'
import Point from 'ol/geom/point'
import Style from 'ol/style/style'
import Icon from 'ol/style/icon'
import VectorLayer from 'ol/layer/vector'
import VectorSource from 'ol/source/vector'
import TileLayer from 'ol/layer/tile'
import TileJSON from 'ol/source/tilejson'
import WKT from 'ol/format/wkt'

export default {
  components: {
  },
  props: {
    map: Object,
    visibleCoordsPanel: {
      type: Boolean,
      default: false
    }
  },
  watch: {
    map: {
      handler: async function (newValue) {
        if (!newValue) {
          return
        }
        this.lMap = newValue
        this.sridList = await this.coreApi.pdCards.getCoordinateSystems()
        // один раз утанавливаем срид карты и больше не трогаем
        this.originalCoordinates.mapSrid = this.getMapSrid()
        // Находим срид из профиля
        const currentSrid = this.sridList.find(el => el.wkid === this.settingsProfile.coordinateSystem)
        // устанавливаем текущий из профиля или карты (если из карты есть в списке)
        this.selectedSrid = currentSrid ? currentSrid['id'] : this.getDefaultSridFromList(this.originalCoordinates.mapSrid)
      },
      immediate: true
    },
    selectedSrid (newValue) {
      this.getTransformedCoords()
    }
  },
  computed: {
    ...mapState({
      settingsProfile: state => state.settingsProfile
    }),
    wkt () {
      return new WKT()
    }
  },
  data () {
    return {
      lMap: null,
      originalCoordinates: {
        coordinates: null,
        mapSrid: null
      },
      transformedGeometry: {
        type: '',
        coordinates: [],
        crsId: null
      },
      sridList: [],
      selectedSrid: null,
      popup: null,
      iconFeature: null,
      iconStyle: null,
      vectorSource: null,
      vectorLayer: null,
      rasterLayer: null,
      isShown: false
    }
  },
  methods: {
    getCoords (event) {
      this.coordinates = this.lMap.getCoordinateFromPixel(event.pixel)
      this.iconFeature = new Feature({
        geometry: new Point([this.coordinates[0] || 0, this.coordinates[1] || 0]),
        name: 'middle-of-russians-nowhere'
      })
      this.iconFeature.setStyle(this.iconStyle)

      this.popup.setPosition(this.coordinates)
      this.isShown = true
      this.lMap.addOverlay(this.popup)

      this.vectorSource.clear()
      this.vectorSource.addFeature(this.iconFeature)
      this.getTransformedCoords()
    },
    toggle (mode) {
      mode ? this.createLayer() : this.clearLayer()
    },
    createLayer () {
      this.lMap.on(['click'], this.getCoords)
      this.vectorLayer.setMap(this.lMap)
    },
    clearLayer () {
      this.lMap.un('click', this.getCoords)
      this.vectorLayer.setMap(null)
      this.vectorSource.clear()
      this.lMap.removeOverlay(this.popup)
    },
    closeModal () {
      this.isShown = false
    },
    async getTransformedCoords () {
      if (!this.iconFeature || !this.selectedSrid) {
        return null
      }
      this.blockUI(this.$el, true)
      const geometry = this.iconFeature.getGeometry()
      const encodedGeometry = this.wkt.writeGeometry(geometry)
      if (!encodedGeometry || !this.selectedSrid) {
        this.$error('Пересчет координат невозможен')
        return
      }
      // Каждый раз при клике - устанавливаем орикинальные координаты в СК карты
      // Оригинальный срид устанавливаем в вотче
      this.originalCoordinates.coordinates = geometry.getCoordinates()
      const wkid = this.sridList.find(el => el.id === this.selectedSrid) || null
      if (!wkid || !wkid.wkid) {
        this.$error('Пересчет координат невозможен')
        return
      }
      try {
        const r = await this.coreApi.pdCards.getTransformGeometry(encodedGeometry, this.originalCoordinates.mapSrid, wkid.wkid)
        this.transformedGeometry = JSON.parse(r)
        this.addCrsToShape(this.selectedSrid)
      } catch (err) {
        this.$error('Пересчет координат невозможен')
        // Возвращаем сохраненный СК либо СК по умолчанию
        this.getSridFromTransformedGeometry()
        console.error(err)
        return
      } finally {
        this.blockUI(this.$el, false)
      }
    },

    downloadJson () {
      if (!this.transformedGeometry) {
        return
      }
      const msg = `${this.transformedGeometry.coordinates[0]} ${this.transformedGeometry.coordinates[1]}`
      const url = window.URL.createObjectURL(new Blob([msg]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'coordinates.txt')
      document.body.appendChild(link)
      link.click()
    },
    copyJson () {
      if (!this.transformedGeometry.coordinates.length) {
        return
      }
      const msg = `${this.transformedGeometry.coordinates[0]} ${this.transformedGeometry.coordinates[1]}`
      navigator.clipboard.writeText(msg)
      .then(() => this.$success('Скопированно в буфер'))
      .catch(err => {
        this.$error('Ошибка копирования в буфер')
        console.error(err)
      })
    },

    addCrsToShape (srid) {
      // Сохраняем айди СК, выбранную из списка
      this.transformedGeometry.crsId = srid
    },
    // Устанавливает сохраненное значение или значение СК и координат по умолчанию
    getSridFromTransformedGeometry () {
      if (!this.transformedGeometry.crsId || !this.transformedGeometry.coordinates) {
        // Берет первую попавшуюся запись с дефолтным значением СК
        this.transformedGeometry.crsId = this.getDefaultSridFromList(this.originalCoordinates.mapSrid)
        this.transformedGeometry.coordinates = this.originalCoordinates.coordinates
        this.selectedSrid = this.transformedGeometry.crsId
        return
      }
      // записываем новый срид
      this.selectedSrid = this.transformedGeometry.crsId
    },
    getDefaultSrid () {
      return this.originalCoordinates.mapSrid || this.getMapSrid()
    },
    getMapSrid () {
      if (!this.lMap) {
        return DEFAULT_SRID
      }
      const mapSrid = this.lMap.getView().getProjection()
      if (mapSrid && mapSrid.code) {
        const srid = mapSrid.code.match(/\d*$/)
        return srid[0]
      }
      return DEFAULT_SRID
    },
    getDefaultSridFromList (srid) {
      const currentSrid = this.sridList.find(el => el.wkid === srid)
      this.selectedSrid = currentSrid ? currentSrid['id'] : null
    }
  },
  async mounted () {
    this.iconStyle = new Style({
      image: new Icon({
        anchor: [0.5, 30],
        anchorXUnits: 'fraction',
        anchorYUnits: 'pixels',
        src: `${this.$url('/static/map-picker.png')}`
      })
    })

    this.popup = new Overlay({
      element: this.$refs.coordspopup,
      positioning: 'bottom-center',
      stopEvent: true,
      offset: [0, -50]
    })

    this.vectorSource = new VectorSource()
    this.vectorLayer = new VectorLayer({
      source: this.vectorSource
    })
  }
}
</script>

<style lang="stylus">
.coords-footer
  padding-top 5px
  float right
.custom-panel
  display flex
  flex-direction column
  max-width 300px
.custom-btn
  flex 0
  align-self end
  margin-right 5px
  margin-top 5px
  padding 3px 3px
</style>