<template>
  <div
    class="flex-row flex-1 registries-map-container panel-container"
    :class="{'fullscreen-map': fullscreen}"
  >
    <panel title="Карта" :toolbarMenu="true">
      <!--
        mounted компонента toolbar вызывается до установки свойства map.
        Используем v-if="map" чтобы объект map был доступен в mounted.
      -->
      <toolbar
        v-if="map"
        slot="heading-elements"
        :map="map"
        :layers="layers"
        :visibleDrawPanel="visibleDrawPanel"
        :visibleTopologyPanel="visibleTopologyPanel"
        :visibleDrawNotesPanel="visibleDrawNotesPanel"
        :visibleDrawToolsPanel="visibleDrawToolsPanel"
        :visibleCoordsPanel="visibleCoordsPanel"
        :isDrawModeActive="isDrawModeActive"
        :isBasemapLoaded="isBasemapLoaded"
        :canDraw="actualDrawOptions.canDraw && !isMultipleLayer"
        :canBind="actualCanBind"
        :isWrap="true"
        :mode="currentButtonsMode"
        :isDrawingsBtnVisible="getDrawingsBtnVisible"
        :currentScale="currentScale"
        :isDrawingsAllowed="isDrawingsAllowed"
        :disableDTools="disableDefTools"
        :isToolbarActive="isToolbarActive"
        @bindToObject="bindToObject"
        @exchangeBasemaps="exchangeBasemaps"
        @toggleDrawPanel="toggleDrawPanel"
        @toggleCheckTopologyPanel="toggleCheckTopologyPanel"
        @toggleDrawNotesPanel="toggleDrawNotesPanel"
        @toggleDrawToolsPanel="toggleDrawToolsPanel"
        @toggleCoordsTool="toggleCoordsTool"
        @toggleBinding="toggleBinding"
        @changeMode="onChangeMode"
        @toggleFullScreen="onToggleFullScreen"
        @deactivateSelectFromMapButton="deactivateSelectFromMapButton"
        @measureStart="measureStart"
        @measureEnd="measureEnd"
        @changeMeasureValue="changeMeasureValue"
        @changeMeasureValueArea="changeMeasureValueArea"
        @turnOffDrawTools="turnOffDrawTools"
        @removeDrawNotes="removeDrawNotes"
        @disableDraw="disableDraw"
        @disableCheckTopology="disableCheckTopology"
        @disableDrawNotes="disableDrawNotes"
        @disableDrawTools="disableDrawTools"
        ref="toolbar"
      />
      <div ref="mapContainer" class="flex-1 map">
        <lower-toolbar
          class="flex-1 map"
        >
          <template>
            <draw-shapes
              class="draw-tools"
              v-show="visibleDrawPanel"
              :map="map"
              :layer="shapesLayer"
              :registry="actualRegistry"
              :actualRecordFeatures="actualRecordFeatures"
              :canDrawCreate="actualDrawOptions.canDrawCreate"
              :allowedDrawModes="actualDrawOptions.allowedDrawModes"
              :canEdit="actualDrawOptions.canEdit"
              :canEditImportedGeometry="actualDrawOptions.canEditImportedGeometry"
              :showSaveButton="actualDrawOptions.showSaveButton"
              :manualLayerUpdate="actualDrawOptions.manualLayerUpdate"
              :allowedGeometryType="actualDrawOptions.geometryType"
              :editGeometry="editingGeometry"
              @geometryChanged="clearHighlightObjects(); $emit('geometryChanged', $event)"
              @createGeometry="onCreateGeometry"
              @editGeometry="onEditGeometry"
              @deleteGeometry="onDeleteGeometry"
              @geometryModified="$emit('geometryModified', $event)"
              @drawEnd="$emit('drawEnd', $event)"
              @disableEditGeometry="$emit('disableEditGeometry')"
              @removeHighlight="clearHighlightObjects()"
              @highlightGeometry="highlightGeometry"
              ref="drawPanel"
            />
            <draw-notes
              v-show="visibleDrawNotesPanel"
              :map="map"
              :isActive="visibleDrawNotesPanel"
              @deactivateDrawTools="resetDrawTools"
              @deactivateToolbar="resetToolbar"
              ref="drawNotesPanel"
            />
            <draw-tools
              v-show="visibleDrawToolsPanel"
              :map="map"
              :isDrawToolsTurnedOff="isDrawToolsTurnedOff"
              :isActive="visibleDrawToolsPanel"
              :isDrawingsAllowed="isDrawingsAllowed"
              :isMoveUpAllowed="isMoveUpAllowed"
              :isMoveDownAllowed="isMoveDownAllowed"
              :isMoveToTopAllowed="isMoveToTopAllowed"
              :isMoveToBottomAllowed="isMoveToBottomAllowed"
              :lastSelectedFeature="lastSelectedFeature"
              :isCreateBufferButtonInactive="isCreateBufferButtonInactive"
              @saveGeometry="saveGeometry"
              @editGeometry="editGeometry"
              @removeGeometry="removeGeometry"
              @numberingOksZones="numberingOksZones"
              @drawSize="drawSize"
              @polygonsUnion="polygonsUnion"
              @polygonsSubtract="polygonsSubtract"
              @markObject="markObject"
              @moveObjectUp="moveObjectUp"
              @moveObjectDown="moveObjectDown"
              @moveObjectToTop="moveObjectToTop"
              @moveObjectToBottom="moveObjectToBottom"
              @setArrowsDisabled="setArrowsDisabled"
              @bufferByObject="bufferByObject"
              @bufferByDraw="bufferByDraw"
              @currentDrawType="getCurrentDrawType"
              @setLastSelectedFeatureToNull="setLastSelectedFeatureToNull"
              @deactivateDrawNotes="resetDrawNotes"
              ref="drawToolsPanel"
            />
            <topology
              v-show="visibleTopologyPanel"
              :map="map"
              :isActive="visibleTopologyPanel"
              ref="topologyPanel"
            />
          </template>
        </lower-toolbar>
        <scale-input 
          :map="map" class="map-scale-control"
          ref="scaleControl"
          @changeCurrentScale="changeCurrentScale"
        />
        <measure-value-input
          :measureValue="measureValue"
          v-if="isMeasureValueInputVisible"
        />
        <map-coords-label :map="map" ref="coordsPanel" />
      </div>
    </panel>

    <map-sidebar
      :title="sideBarTitle"
      :map="map"
      :layers="layers"
      @bindToObject="bindToObject"
      @showdescription="showDescription"
      @changeMode="onChangeMode"
      @changeLayerFilter="changeLayerFilter"
    />

    <set-number-oks-zones-dialog ref="setNumberOksZonesDialog" @numberSet="onNumberSet" />
    <set-size-dialog ref="setSizeDialog" @sizeSet="onSizeSet" @sizeCancel="onSizeCancel" />
    <buffer-settings-dialog
      ref="setBufferDialog"
      @setBuffer="onSetBuffer"
      @cancelBuffer="onCancelBuffer"
    />
  </div>
</template>

<script>
import { mapState, mapActions, mapGetters } from 'vuex'
import camelCase from 'lodash/camelCase'
import snakeCase from 'lodash/snakeCase'
import Map from 'ol/map'
import Point from 'ol/geom/point'
import View from 'ol/view'
import interaction from 'ol/interaction'
import MapCoordsLabel from './MapCoordsLabel'
import {
  getLayersExtent,
  clearHighlightedDevDocumentObjectsOnMap,
  getMapLayer,
  bindObjectToFeature,
  refreshLayer,
  zoomMapToGeometryOrExtent,
  getScale,
  getLayersWithLegends,
  getGeometriesExtent,
  resetFilters,
  updateFilters,
  searchByManyCoords
} from './map'
import { identifyByCoordinates } from './identify'
import { getFeatures } from './wfs'
import Toolbar from './Toolbar'
import Topology from './Topology.vue'
import LowerToolbar from './LowerToolbar'
import DrawShapes from './DrawShapes.vue'
import DrawNotes from './DrawNotes.vue'
import DrawTools from './DrawTools.vue'
import MapSidebar from './MapSidebar'
import geocoderSearch from './geocoderSearch'
import objectSearch from './objectSearch'
import ScaleInput from './ScaleInput'
import MeasureValueInput from './MeasureValueInput'
import ScaleLine from 'ol/control/scaleline'
import Select from 'ol/interaction/select'
import Feature from 'ol/feature'
import WKT from 'ol/format/wkt'
import VectorLayer from 'ol/layer/vector'
import VectorSource from 'ol/source/vector'
import Collection from 'ol/collection'
import _orderBy from 'lodash/orderBy'
import Polygon from 'ol/geom/polygon'
import DragBox from 'ol/interaction/dragbox'
import basicGeometryFunctions from './mixins/basicGeometryFunctions.js'
import toolsFunctions from './mixins/toolsFunctions.js'
import styleFunctions from './mixins/styleFunctions.js'
import registryMapMixin from './mixins/map.js'
import axios from 'axios'
import mapEvents from '^/mixins/mapEvents'
import mapEventActions from '^/components/map/mapActions'
import mapEventHandlers from '^/components/map/mixins/mapEventHandlers'

const SPATIAL_SETTINGS_NOT_FOUND = 'Для сведений не определены пространственные данные'

export default {
  props: {
    layer: {},
    module: {},
    entityType: {},
    editingGeometry: null,
    drawOptions: {
      type: Object,
      default () {
        return {
          canEdit: false,
          canDraw: false,
          canEditImportedGeometry: false
        }
      }
    },
    canBind: {
      type: Boolean,
      default: false
    },
    isFullscreen: {
      type: Boolean,
      default: false
    },
    showConturOnly: {
      type: Boolean,
      default: false
    }
  },
  components: {
    MapCoordsLabel,
    Toolbar,
    LowerToolbar,
    DrawShapes,
    MapSidebar,
    DrawNotes,
    DrawTools,
    ScaleInput,
    MeasureValueInput,
    Topology
  },
  mixins: [mapEvents, mapEventHandlers, basicGeometryFunctions, toolsFunctions, styleFunctions, registryMapMixin],
  data () {
    return {
      currentScale: 0,
      measureValue: '',
      isMeasureValueInputVisible: false,
      map: null,
      layers: [],
      fullscreen: false,
      vectorLayer: null,
      visibleTopologyPanel: false,
      visibleDrawPanel: false,
      visibleDrawNotesPanel: false,
      visibleDrawToolsPanel: false,
      visibleCoordsPanel: false,
      visibleBasemap: false,
      entitySpatialSetting: null,
      isBasemapLoaded: false,
      selectedEntity: null,
      currentSideBarMode: null,
      isMultipleLayer: false,
      isMapExtentInitialized: false,
      itemsExtent: null,
      isMoveUpAllowed: false,
      isMoveDownAllowed: false,
      isMoveToTopAllowed: false,
      isMoveToBottomAllowed: false,
      isActive: false,
      selection: null,
      unionSelection: null,
      subtractSelection: null,
      modifyNonPoint: null,
      selectPoint: null,
      modifyPoint: null,
      coordinate: null,
      sizeFeature: null,
      sizeDraw: null,
      polygonUnionFeatures: [],
      polygonSubtractFeatures: [],
      bufferPolygonGeo: null,
      lastSelectedFeature: null,
      selectedFeatures: null,
      selectedPointFeature: null,
      selFeature: null,
      selectedIndex: null,
      polygonDraw: null,
      polygonFeature: null,
      currentDrawType: null,
      intersectedFeatures: [],
      pointIndex: 0,
      indexLast: 0,
      isBufferExists: false,
      isCreateBufferButtonInactive: false,
      isDrawToolsTurnedOff: false,
      disableDefTools: false,
      isToolbarActive: false,
      lastSelectedLayer: {}
    }
  },
  computed: {
    getDrawingsBtnVisible () {
      if (this.currentDocument && this.currentDocument.isDrawingSectionExists) {
        if (this.isDrawToolsPanelVisible) {
          this.setDrawToolsPanelVisibleStatus(true)
          this.visibleDrawToolsPanel = true
        } else {
          this.setDrawToolsPanelVisibleStatus(false)
          this.visibleDrawToolsPanel = false
        }
        return true
      } else {
        this.visibleDrawToolsPanel = false
        return false
      }
    },
    isDrawModeActive () {
      if (!this.$refs.drawPanel) {
        return
      }
      return this.visibleDrawPanel && this.$refs.drawPanel.currentMode
    },
    ...mapState({
      user: state => state.user,
      profile: state => state.settingsProfile,
      currentModule: state => state.currentModule,
      settingsProfile: state => state.settingsProfile,
      selectedPdCardLayers: state => state.georesourcesCatalog.selectedPdCardLayers,
      currentDocument: state => state.developedDocuments.currentDocument,
      isSelectAreaButtonActive: state => state.developedDocuments.isSelectAreaButtonActive,
      breadcrumb: state => state.breadcrumb,
      isDrawToolsPanelVisible: state => state.developedDocuments.isDrawToolsPanelVisible,
      isDrawingsAllowed: state => state.developedDocuments.isDrawingsAllowed,
      selectedRecord: state => state.registries.selectedRecord,
      EntityTypes: state => state.enums.public.EntityTypes,
      ThematicSearchTypes: state => state.enums.public.ThematicSearchTypes
    }),
    ...mapGetters([
      'defaultExtent'
    ]),
    sideBarTitle () {
      switch (this.currentSideBarMode) {
        case 'search': return 'Управление картой - Поиск'
        case 'layers': return 'Управление картой - Слои'
        case 'legend': return 'Управление картой - Легенда'
        case 'catalog': return 'Управление картой - Каталог ПД'
        default: return 'Управление картой'
      }
    },
    currentButtonsMode () {
      return this.currentSideBarMode
    },
    shapesLayer () {
      if (this.actualLayer) {
        return this.actualLayer
      }

      if (this.entitySpatialSetting) {
        const entityLayer = this.layers.find(x => x.layer.id === this.entitySpatialSetting.layer.id)
        return {
          ...entityLayer.layer,
          view: entityLayer.mapLayer
        }
      }

      return null
    }
  },
  watch: {
    '$store.state.isMapSidebarVisible' () {
      this.updateSize()
    },
    selectedPdCardLayers: 'addPdCardLayers',
    isDrawToolsPanelVisible () {
      this.setUpDrawToolsPanel()
    },
    'isSelectAreaButtonActive': function (newState) {
      if (newState === true) {
        this.activate()
      } else {
        this.deactivate()
      }
    },
    'breadcrumb': function () {
      this.deactivate()
    },
    'currentDocument': function (newValue) {
      this.setUpDrawToolsPanel()
    },
    'showConturOnly': function (newValue) {
      this.setUpDrawToolsPanel()
    }
  },
  async mounted () {
    this.map = new Map({
      target: this.$refs.mapContainer,
      // Отключаем функцию поворота карты,
      // так как отключен элемент управления сброса поворота.
      interactions: interaction.defaults({
        altShiftDragRotate: false,
        pinchRotate: false
      }),
      controls: [new ScaleLine()],
      view: new View({
        center: [0, 0],
        zoom: 2
      })
    })
    this.map.on('moveend', this.onMoveEnd)
    this.updateSize()

    this.$store.commit('MAP_INITIALIZE')

    // Загрузить топоосновы из профиля пользователя.
    await this.addBaseLayers()

    // Загрузить слои для отраслевого интерфейса из профиля
    await this.addUserModuleLayers()

    // Загрузить слой для сущности.
    await this.addDefaultEntityLayer()

    this.$emit('mapCreated')

    this.setupScaleControl()

    if (this.entityType) {
      const layer = this.getEntitySpatialSetting(this.entityType)
      if (layer) {
        this.isMultipleLayer = await this.isMultipleLayerSpatialSettings(layer.id)
      } else {
        this.isMultipleLayer = true
      }
    }

    this.onEventFromComponent(mapEventActions.ADD_REGISTRY_LAYER, this.addRegistryLayer)
    this.onEventFromComponent(mapEventActions.SHOW_REGISTRY_OBJECT, this.showRegistrtyObject)
    this.onEventFromComponent(mapEventActions.ADD_REGISTRY_LAYER_AND_SHOW_OBJECT, this.addRegistryLayerAndShowObject)
    this.onEventFromComponent(mapEventActions.GET_COORDINATES, this.setGetCoordinatesMode)
    this.onEventFromComponent(mapEventActions.ZOOM_TO_GEOMETRIES, this.zoomToGeometries)
    // this.onEventFromComponent(mapEventActions.SHOW_REQUEST_OBJECT, this.showRequestObject)
  },
  beforeDestroy () {
    this.unEventFromComponent(mapEventActions.SHOW_REGISTRY_OBJECT, this.showRegistrtyObject)
    this.unEventFromComponent(mapEventActions.ADD_REGISTRY_LAYER, this.addRegistryLayer)
    this.unEventFromComponent(mapEventActions.ADD_REGISTRY_LAYER_AND_SHOW_OBJECT, this.addRegistryLayerAndShowObject)
    this.unEventFromComponent(mapEventActions.GET_COORDINATES, this.setGetCoordinatesMode)
    this.unEventFromComponent(mapEventActions.ZOOM_TO_GEOMETRIES, this.zoomToGeometries)
    // this.unEventFromComponent(mapEventActions.SHOW_REQUEST_OBJECT, this.showRequestObject)
  },
  methods: {
    disableDraw (disabled) {
      this.$refs.drawPanel.disableLowerTools(disabled)
    },
    disableCheckTopology (disabledObj) {
      this.$refs.topologyPanel.disableLowerTools(disabledObj)
    },
    disableDrawNotes (disabledObj) {
      this.$refs.drawNotesPanel.disableLowerTools(disabledObj)
    },
    disableDrawTools (disabled) {
      this.$refs.drawToolsPanel.disableLowerTools(disabled)
    },
    disableDefaultTools (val) {
      this.disableDefTools = val
    },
    turnOffDrawTools (val) {
      this.isDrawToolsTurnedOff = val
    },
    setLastSelectedFeatureToNull () {
      if (this.lastSelectedFeature) {
        const graphicsExists = this.lastSelectedFeature.getKeys().includes('graphics')
        if (graphicsExists) {
          const style = this.lastSelectedFeature.get('originalStyle')
          this.lastSelectedFeature.setStyle(style)
        } else {
          this.lastSelectedFeature.setStyle(this.contourStyle(this.lastSelectedFeature))
        }
        this.lastSelectedFeature = null
        this.setArrowsDisabled()
      }
      this.intersectedFeatures = []
    },
    ...mapActions({
      setImageBlob: 'developedDocuments/setImageBlob',
      setSelectAreaButtonActive: 'developedDocuments/setSelectAreaButtonActive',
      setDrawToolsPanelVisibleStatus: 'developedDocuments/setDrawToolsPanelVisibleStatus'
    }),
    changeMeasureValueArea () {
      const element = document.getElementById('measure-value-input')
      if (!element) {
        return
      }

      const originalMeasureValue = parseFloat(element.getAttribute('originalMeasureValue'))

      if (!originalMeasureValue) {
        return
      }

      if (this.currentScale <= 10000) {
        this.measureValue = originalMeasureValue.toFixed(2) + ' ' + 'кв.м'
      }

      if (this.currentScale > 10000 && this.currentScale <= 250000) {
        this.measureValue = (originalMeasureValue / 1000).toFixed(2) + ' ' + 'кв.км'
      }

      if (this.currentScale > 250000) {
        this.measureValue = (originalMeasureValue / 1000000).toFixed(2) + ' ' + 'тыс.кв.км'
      }
    },
    changeMeasureValue () {
      const element = document.getElementById('measure-value-input')
      if (!element) {
        return
      }

      const originalMeasureValue = parseFloat(element.getAttribute('originalMeasureValue'))

      if (!originalMeasureValue) {
        return
      }

      if (this.currentScale <= 25000) {
        this.measureValue = originalMeasureValue.toFixed(2) + ' ' + 'м'
      }

      if (this.currentScale > 25000 && this.currentScale <= 1000000) {
        this.measureValue = (originalMeasureValue / 1000).toFixed(2) + ' ' + 'км'
      }

      if (this.currentScale > 1000000) {
        this.measureValue = (originalMeasureValue / 1000000).toFixed(2) + ' ' + 'тыс.км'
      }
    },
    measureStart (geom) {
      this.currentScale = this.getScale()

      const element = document.getElementById('measure-value-input')
      if (element) {
        element.setAttribute('originalMeasureValue', 0)
      }

      if (geom === 'length') {
        if (this.currentScale <= 25000) {
          this.measureValue = '0.00 м'
        }

        if (this.currentScale > 25000 && this.currentScale <= 1000000) {
          this.measureValue = '0.00 км'
        }

        if (this.currentScale > 1000000) {
          this.measureValue = '0.00 тыс.км'
        }
      }

      if (geom === 'area') {
        if (this.currentScale <= 10000) {
          this.measureValue = '0.00 кв.м'
        }

        if (this.currentScale > 10000 && this.currentScale <= 250000) {
          this.measureValue = '0.00 кв.км'
        }

        if (this.currentScale > 250000) {
          this.measureValue = '0.00 тыс.кв.км'
        }
      }

      this.isMeasureValueInputVisible = true
    },
    measureEnd () {
      this.isMeasureValueInputVisible = false
      this.measureValue = ''
    },
    changeCurrentScale (value) {
      this.currentScale = value
    },
    async onCreateGeometry (geometry, wkid) {
      if (!this.isFromRegistry) {
        this.$emit('createGeometry', geometry)
        return
      }
      const recordId = this.actualRecord.id
      const geometryString = new WKT().writeGeometry(geometry)
      const result = await this.coreApi.registry.createGeometry(this.actualRegistry.id, recordId, geometryString, wkid)
      this.refreshShapesLayer()
      // в выбранную запись должно попасть значение идентификаторв связанной геометрии, когда мы
      // можем находитя в карточке этой записи и создаем геометрию

      this.emitBroadcastEventFromMap(mapEventActions.CHANGE_GEOMETRY, {
        registry: this.actualRegistry,
        record: this.actualRecord,
        layer: this.actualLayer,
        entityOptions: {
          field: result.entityField,
          value: result.gisId,
          mode: 'create'
        }
      })

      // Только для реестров ПД
      if (this.selectedRecord) {
        this.$store.dispatch('registries/setSelectedRecordGisId', {
          field: result.entityField,
          value: result.gisId
        })
      }
    },
    async onDeleteGeometry (feature) {
      if (!this.isFromRegistry) {
        this.$emit('deleteGeometry', feature)
        return
      }
      const mapField = this.getMapField(feature)
      if (!mapField) {
        return
      }
      const recordId = this.actualRecord.id
      await this.coreApi.registry.deleteGeometry(this.actualRegistry.id, mapField.value, recordId)

      this.emitBroadcastEventFromMap(mapEventActions.CHANGE_GEOMETRY, {
        registry: this.actualRegistry,
        record: this.actualRecord,
        layer: this.actualLayer,
        entityOptions: {
          field: this.actualRegistry.mapIdField,
          value: null,
          layerFieldValue: mapField.value,
          mode: 'delete'
        }
      })

      this.refreshShapesLayer()
    },
    async onEditGeometry (feature) {
      if (!this.isFromRegistry) {
        this.$emit('editGeometry', feature)
        return
      }

      const mapField = this.getMapField(feature)
      if (!mapField) {
        return
      }
      const recordId = this.actualRecord.id
      await this.coreApi.registry.editGeometry(this.actualRegistry.id, mapField.value, new WKT().writeGeometry(feature.geometry), recordId)

      this.refreshShapesLayer()

      this.emitBroadcastEventFromMap(mapEventActions.CHANGE_GEOMETRY, {
        registry: this.actualRegistry,
        record: this.actualRecord,
        layer: this.actualLayer,
        entityOptions: {
          mode: 'edit'
        }
      })
    },
    onModifyNonPoint (event) {
      if (event.feature) {
        this.map.removeInteraction(this.select)
      }
      this.customApi.developedDocuments.saveDrawingGraphics(this.currentDocument.id, this.updateGraphicsObjList())
    },
    onSelectPoint (event) {
      this.selectedPointFeature = event.element
      this.selectedPointFeature.on('change', this.onChangePoint)
    },
    onChangePoint (event) {
      this.customApi.developedDocuments.saveDrawingGraphics(this.currentDocument.id, this.updateGraphicsObjList())
    },
    isPoint (feature) {
      if (!feature) {
        return false
      }
      const featureGeometry = feature.getGeometry()
      const featureGeometryType = featureGeometry.getType()
      if (featureGeometryType === 'Point') {
        return true
      }
      return false
    },
    getFeatureIndex (feature) {
      const features = this.vectorLayer.getSource().getFeaturesCollection()
      let selFeatureIndex = -1
      features.forEach((element, index) => {
        if (feature === element) {
          selFeatureIndex = index
        }
      })
      return selFeatureIndex
    },
    async addPdCardLayers () {
      /*
      * удаление слоёв - убрано для задачи 1017
      this.layers.forEach(el => this.removeLayer(el))
      this.layers = []
      */

      this.blockUI(this.$el, true)
      try {
        for (const layerId of this.selectedPdCardLayers) {
          const layer = await this.coreApi.layers.getLayer(layerId)
          if (layer) {
            await this.addLayer(layer, true)
          }
        }
      } catch (err) {
        console.error(err)
        this.$error('Не удалось отобразить слои')
      } finally {
        this.blockUI(this.$el, false)
      }
      const filteredLayers = this.layers.filter(x => this.selectedPdCardLayers.includes(x.layer.id))
      const resultExtent = await getLayersExtent(filteredLayers)
      if (!resultExtent) {
        this.$error('Ошибка получения пространственных данных из каталога георесурсов')
        return
      }
      this.zoomToGeometryOrExtent(resultExtent)
    },
    highlightGeometry (modifyingFeatureItem) {
      if (!modifyingFeatureItem) {
        return
      }

      let arr = []
      arr.push(modifyingFeatureItem)
      this.pickObject(arr)
    },
    onMoveEnd (event) {
      if (!this.isMapExtentInitialized) {
        this.isMapExtentInitialized = true
        // Установить экстент по умолчанию из профиля.
        // Слои не отображаются, пока у карты не задано свойство view.
        this.setDefaultExtent()
      }
    },
    setUpDrawToolsPanel () {
      if (!this.currentDocument) {
        if (this.vectorLayer) {
          this.vectorLayer.getSource().clear()
        }
      }

      if (this.isDrawToolsPanelVisible) {
        this.getMapGraphics()
        this.resetDrawTools()
      } else {
        if (this.vectorLayer) {
          this.vectorLayer.getSource().clear()
        }
        this.deactivateDrawTurningPoints()
      }
    },
    createVectorLayer () {
      if (this.vectorLayer) {
        this.vectorLayer.getSource().clear()
        return
      }
      const features = new Collection()

      const vectorSource = new VectorSource({ features })

      this.vectorLayer = new VectorLayer({
        map: this.map,
        source: vectorSource
      })
    },
    async getMapGraphics () {
      if (!this.currentDocument || !this.currentDocument.id) {
        return
      }

      try {
        this.$notice('Получение чертежа...', { duration: 0 })
        this.createVectorLayer()
        const graphics = await this.customApi.developedDocuments.getDrawingGraphics(this.currentDocument.id)
        if (!this.showConturOnly) {
          this.getGeometry(graphics.graphics, graphics.turningPoints)
        } else {
          this.getGeometry([], graphics.turningPoints)
        }
        this.fitOnGraphics()
      } catch (err) {
        console.error(err)
        this.$error(`Ошибка получения чертежа`)
      } finally {
        this.$notify.dismissAll()
      }
    },
    fitOnGraphics () {
      const features = this.vectorLayer.getSource().getFeatures()
      const graphics = features.map(x => x.getGeometry())
      const extent = getGeometriesExtent(graphics)
      zoomMapToGeometryOrExtent(this.map, extent)
    },
    getTurningPointsFeature (turningPoints, featureId) {
      if (!turningPoints.length) {
        return
      }

      const polyCoords = []

      const orderedTurningPoints = _orderBy(turningPoints, 'ordinalNumber', 'asc')
      let startPoint = null
      for (const item of orderedTurningPoints) {
        const point = new WKT().readGeometry(item.geometry, {
          dataProjection: 'EPSG:3857'
        })
        const coord = point.getCoordinates()
        if (!polyCoords.find(x => x[0] === coord[0] && x[1] === coord[1])) {
          polyCoords.push(coord)
        } else {
          startPoint = coord
        }
      }
      if (startPoint != null) {
        polyCoords.push(startPoint)
      } else {
        polyCoords.push(polyCoords[0])
      }
      const polygon = new Polygon()
      polygon.setCoordinates([polyCoords])
      const polygonFeature = new Feature({
        name: 'My Polygon',
        geometry: polygon
      })

      polygonFeature.setId(featureId || this.getNewFeatureId())
      polygonFeature.set('isContour', true)
      polygonFeature.setStyle(this.contourStyle(polygonFeature))

      return polygonFeature
    },
    deactivateDrawTurningPoints () {
      //
    },
    async getMapLegends () {
      return await getLayersWithLegends(this.layers)
    },
    async refresh () {
      this.vectorLayer.getSource().clear()
      const graphics = await this.customApi.developedDocuments.getDrawingGraphics(this.currentDocument.id)
      this.getGeometry(graphics.graphics, graphics.turningPoints)

      const features = this.vectorLayer.getSource().getFeaturesCollection()
      if (this.lastSelectedFeature) {
        const feat = features.getArray().find(element => {
          return element.getId() === this.lastSelectedFeature.getId()
        })
        this.lastSelectedFeature = feat

        if (this.lastSelectedFeature) {
          // Highlight currently selected feature
          if (this.lastSelectedFeature.get('isContour') === true) {
            this.lastSelectedFeature.setStyle(this.contourMarkStyle(this.lastSelectedFeature))
          } else {
            this.lastSelectedFeature.setStyle(this.markStyle)
          }
        }
      }
      this.setArrowsActivity()
    },
    activate () {
      // The Select interaction to handle click
      this.select = new Select()
      this.map.addInteraction(this.select)

      // The DragBox interaction used to select features by drawing box
      this.dragBox = new DragBox()
      this.map.addInteraction(this.dragBox)

      this.dragBox.on('boxend', () => {
        // Convert geometry to pixels (extent doesn't gives correct bounds when view is rotated)
        var left = Infinity
        var top = Infinity
        var bottom = -Infinity
        var right = -Infinity

        this.dragBox.getGeometry().getCoordinates()[0].forEach(coord => {
          var pixel = this.map.getPixelFromCoordinate(coord)
          left = Math.min(left, pixel[0])
          right = Math.max(right, pixel[0])
          top = Math.min(top, pixel[1])
          bottom = Math.max(bottom, pixel[1])
        })

        this.map.once('postcompose', event => {
          var image = event.context.canvas
          var canvas = document.createElement('canvas')
          canvas.width = right - left
          canvas.height = bottom - top
          var ctx = canvas.getContext('2d')
          ctx.drawImage(image, left, top, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height)

          if (navigator.msSaveBlob) {
            navigator.msSaveBlob(canvas.msToBlob(), 'map.png')
          } else {
            canvas.toBlob(blob => {
              this.setImageBlob(blob)
            })
          }
        })
        this.map.renderSync()
      })

      this.setSelectAreaButtonActive(true)
      this.isActive = true
    },
    deactivate () {
      this.map.removeInteraction(this.select)
      this.map.removeInteraction(this.dragBox)

      const interactions = this.map.getInteractions().array_
      for (let interaction of interactions) {
        if (interaction.constructor.name === '_ol_interaction_Select_' || interaction.constructor.name === '_ol_interaction_DragBox_') {
          const index = interactions.indexOf(interaction)
          if (index > -1) {
            interactions.splice(index, 1)
          }
        }
      }

      this.setSelectAreaButtonActive(false)
      this.isActive = false
    },
    getScale () {
      return getScale(this.map)
    },
    setupScaleControl () {
      this.$refs.scaleControl.setup()
    },
    deactivateSelectFromMapButton () {
      this.$emit('deactivateSelectFromMapButton')
    },
    zoomToGeometryOrExtent (extent) {
      zoomMapToGeometryOrExtent(this.map, extent)
    },
    transformFrom4326 (x, y) {
      const point = new Point([x, y])
      point.transform('EPSG:4326', 'EPSG:3857')
      return point.getCoordinates()
    },
    setDefaultExtent () {
      if (!this.map) {
        return
      }
      // WORKAROUND: карта не умеет показывать правильный экстент, если он задан до первого отображения карты
      if (this.itemsExtent) {
        // Окончательный размер контейнера
        // карты устанавливается в $nextTick
        this.$nextTick(() => {
          const minimumMapAutoScale = this.settingsProfile.minimumMapAutoScale
          zoomMapToGeometryOrExtent(this.map, this.itemsExtent, minimumMapAutoScale)
        })
        return
      }
      const [centerX, centerY] = this.map.getView().getCenter()
      if (centerX !== 0 || centerY !== 0) {
        return
      }
      if (this.defaultExtent) {
        const startPoint = this.transformFrom4326(this.defaultExtent[0], this.defaultExtent[1])
        const finishPoint = this.transformFrom4326(this.defaultExtent[2], this.defaultExtent[3])
        const transformedExtent = [...startPoint, ...finishPoint]
        // Окончательный размер контейнера
        // карты устанавливается в $nextTick
        this.$nextTick(() => {
          this.map.getView()
            .fit(transformedExtent)
        })
      } else {
        this.map.setView(new View({
          center: [0, 0],
          zoom: 2
        }))
      }
    },
    async bindFeatureToObject ({ coordinate, feature }) {
      const spatialSetting = this.getEntitySpatialSetting(this.entityType)

      if (!spatialSetting) {
        this.$error('В профиле ОКТМО не заданы настройки системного объекта.')
        return
      }

      const { layer, layerField, entityField } = spatialSetting
      let searchedFeature
      if (coordinate) {
        const mapLayer = this.getSearchLayer(layer)

        const foundFeatures = await identifyByCoordinates(this.map, mapLayer, coordinate)
        if (!foundFeatures) {
          this.$error('По данным координатам нет объекта для связывания.')
          return
        }
        if (foundFeatures.length > 1) {
          // Приводим к результатам поиска.
          for (const feature of foundFeatures) {
            await objectSearch.processFeature(feature)
            feature.isBindable = true
          }

          this.$store.dispatch('setSearchResults', foundFeatures)
          return
        } else if (foundFeatures.length === 1) {
          searchedFeature = foundFeatures[0]
        } else {
          this.$error('По данным координатам нет объекта для связывания.')
          return
        }
      } else {
        searchedFeature = feature
      }

      if (!searchedFeature) {
        this.$error('По данным координатам нет объекта для связывания.')
        return
      }

      const attributesToSearchIn = searchedFeature.originalAttributes || searchedFeature.attributes
      const attribute = attributesToSearchIn.find(a => a.name === layerField || a.originalName === layerField)
      if (!attribute) {
        this.$error('По данным координатам нет объекта для связывания.')
        return
      }
      const gisId = attribute.value
      const objectField = await bindObjectToFeature({ customApi: this.customApi, EntityTypes: this.EntityTypes, entityType: this.entityType, entityObject: this.selectedEntity, entityBindField: entityField, featureBindValue: gisId })
      this.bindPostActions({ entity: this.selectedEntity, entityField: objectField, entityValue: gisId })
    },
    async bindFeatureToRegistryRecord ({ coordinate, feature }) {
      const layerField = this.actualRegistry.spatialDataField
      const registryField = this.actualRegistry.mapIdField
      const primaryKeyColumn = this.actualRegistry.columns.find(a => a.isPrimaryKey)

      let searchedFeature

      if (coordinate) {
        const foundFeatures = await identifyByCoordinates(this.map, this.actualLayer, coordinate)

        if (!foundFeatures) {
          this.$error('По данным координатам нет объекта для связывания.')
          return
        }
        if (foundFeatures.length > 1) {
          // Приводим к результатам поиска.
          for (const feature of foundFeatures) {
            await objectSearch.processFeature(feature)
            feature.isBindable = true
          }

          this.$store.dispatch('setSearchResults', foundFeatures)
          return
        } else if (foundFeatures.length === 1) {
          searchedFeature = foundFeatures[0]
        } else {
          this.$error('По данным координатам нет объекта для связывания.')
          return
        }
      } else {
        searchedFeature = feature
      }

      if (!searchedFeature) {
        this.$error('По данным координатам нет объекта для связывания.')
        return
      }

      const attributesToSearchIn = searchedFeature.originalAttributes || searchedFeature.attributes
      const attribute = attributesToSearchIn.find(a => a.name === layerField || a.originalName === layerField)
      if (!attribute) {
        this.$error('Атрибут для связи объекта реестра с картой настроен неверно.')
        return
      }
      const gisId = attribute.value
      await this.coreApi.registry.changeGisId(this.actualRegistry.id, this.actualRecord[primaryKeyColumn.key], gisId)

      this.bindPostActions({ field: registryField, value: gisId })
    },
    bindPostActions (entityOptions) {
      this.$emit('objectBinded', entityOptions)
      this.deactivateToolbar()
      this.$success('Объект успешно связан с картой.')
      if (this.isFromRegistry) {
        this.emitBroadcastEventFromMap(mapEventActions.CHANGE_GEOMETRY, {
          registry: this.actualRegistry,
          record: this.actualRecord,
          layer: this.actualLayer,
          entityOptions: {
            ...entityOptions,
            mode: 'bind'
          }
        })
      }
    },
    async bindToObject (e) {
      if (this.actualRegistry && this.actualRecord) {
        await this.bindFeatureToRegistryRecord({ coordinate: e.coordinate, feature: e.feature })
        return
      } else if (this.entityType && this.selectedEntity) {
        await this.bindFeatureToObject({ coordinate: e.coordinate, feature: e.feature })
        return
      }
    },
    showDescription (value) {
      this.$emit('showdescription', value)
    },
    async getLayerFeatures (item, registry, layer) {
      try {
        const url = layer.url.replace('/ows', '/wfs') // WORKAROUND: если в url указан ows получение не будет работать корректно
        if (!item[registry.mapIdField]) {
          this.$error(SPATIAL_SETTINGS_NOT_FOUND)
          return
        }
        const featuresResult = await getFeatures(url, layer, registry.spatialDataField, item[registry.mapIdField])
        if (featuresResult.error) {
          console.warn(`Ошибка получения объектов слоя ${layer.url} по слою ${layer.layers}`)
          this.$error(`Ошибка получения объектов слоя ${layer.name}: ${featuresResult.error}`)
          return
        }
        const features = featuresResult.features
        if (features.length === 0) {
          this.$error(SPATIAL_SETTINGS_NOT_FOUND)
          return
        }

        return features
      } catch (err) {
        console.warn(`Не удалось получить данные с сервера ${layer.url} по слою ${layer.layers}`)
        console.error(err)
      }
    },
    getEntityBindValue (entity, entityField) {
      const bindField = this.getEntityBindField(entity, entityField)
      return entity[bindField]
    },
    getEntityBindField (entity, entityField) {
      // В настройках поле указано в Pascal Case ("FieldName").
      // Сейчас в моделях используется 2 формата: camelCase и snakeCase.
      const fieldCamelCase = camelCase(entityField)
      const fieldSnakeCase = snakeCase(entityField)
      if (entity[fieldCamelCase]) {
        return fieldCamelCase
      }
      return fieldSnakeCase
    },
    async getEntityFeatures (entity, entitySpatialSetting) {
      const { layer, layerField, entityField } = entitySpatialSetting
      const value = this.getEntityBindValue(entity, entityField)
      if (!value) {
        return []
      }

      const featuresResult = await getFeatures(layer.url, layer, layerField, value)
      if (featuresResult.error) {
        this.$error(`Ошибка получения объектов слоя: ${featuresResult.error}`)
        return []
      }
      return featuresResult.features
    },
    setSelectedEntity (entity) {
      this.selectedEntity = entity
    },
    async showSpatialEntity (entity, entitySpatialSetting) {
      if (!entitySpatialSetting) {
        return
      }

      if (!entity) {
        return
      }
      this.selectedEntity = entity
      const features = await this.getEntityFeatures(entity, entitySpatialSetting)

      if (features.length === 0) {
        this.$error(SPATIAL_SETTINGS_NOT_FOUND)
      }

      this.pickObject(features)
    },
    async showAddressObject (addressObject) {
      if (!addressObject) {
        return
      }

      const entitySpatialSetting = this.getEntitySpatialSetting(this.EntityTypes.address)
      if (!entitySpatialSetting) {
        this.$error(SPATIAL_SETTINGS_NOT_FOUND)
        return
      }

      this.selectedEntity = addressObject

      // поиск по адресному реестру
      let features = await this.getEntityFeatures(addressObject, entitySpatialSetting)

      if (features.length === 0) {
        // поиск по OSM
        const formalizedAddress = await this.customApi.addressRegistry.getFormalizedAddress(addressObject.id)
        if (formalizedAddress.searchaddress) {
          features = await geocoderSearch.getFeatures(null, formalizedAddress.searchaddress)
        }

        if (features.length === 0) {
          features = await this.getProfileOktmoLayerFeatures(addressObject.oktmo)
        }
      }

      if (features.length === 0) {
        this.$error(SPATIAL_SETTINGS_NOT_FOUND)
      }

      this.pickObject(features)
    },
    async getProfileOktmoLayerFeatures (oktmo) {
      return objectSearch.getFeatures(
        [this.profile.oktmoLayer],
        oktmo,
        { fields: [this.profile.oktmoField],
          matchCase: true,
          isPartiallyMatch: false,
          thematicSearch: { searchType: this.ThematicSearchTypes.objectSearch }
        })
    },
    async showEntity (entity, entityType) {
      if (!entity || !entityType) {
        return
      }

      if (!this.actualLayer) {
        return
      }

      const entitySpatialSetting = this.getEntitySpatialSetting(entityType)
      if (!entitySpatialSetting) {
        this.$error(SPATIAL_SETTINGS_NOT_FOUND)
        return
      }

      await this.addEntityLayer(entityType)
      await this.showSpatialEntity(entity, entitySpatialSetting)
    },
    async showDefaultEntity (entity) {
      if (!entity || !this.entityType) {
        return
      }
      await this.showSpatialEntity(entity, this.entitySpatialSetting)
    },
    async exchangeBasemaps (basemapLayers) {
      // Удалить предыдущие слои предыдущей топоосновы
      this.layers
        .filter(x => x.layer.isBasemap)
        .forEach(x => this.map.removeLayer(x.mapLayer))

      this.layers = this.layers
        .filter(x => !x.layer.isBasemap)

      // Добавить слои новой топоосновы
      const mapLayers = this.map.getLayers()

      for (const basemapLayer of basemapLayers) {
        const mapLayer = await getMapLayer(basemapLayer, this.map)
        mapLayers.insertAt(0, mapLayer)

        basemapLayer.isBasemap = true

        const layer = {
          layer: basemapLayer,
          mapLayer
        }
        this.layers.unshift(layer)
      }
    },
    downloadScreenshot () {
      const exportUrl = this.$url('/api/map/export')
      this.map.once('postcompose', function (event) {
        const data = event.context.canvas.toDataURL('image/png')
        this.coreApi.download.downloadFile(exportUrl, 'file', data)
      })

      this.map.renderSync()
    },
    toggleDrawPanel () {
      this.visibleDrawPanel = !this.visibleDrawPanel
    },
    toggleDrawNotesPanel () {
      this.visibleDrawNotesPanel = !this.visibleDrawNotesPanel
      // console.log('this.visibleDrawNotesPanel map =', this.visibleDrawNotesPanel)
    },
    toggleDrawToolsPanel () {
      this.visibleDrawToolsPanel = !this.visibleDrawToolsPanel
      this.setDrawToolsPanelVisibleStatus(this.visibleDrawToolsPanel)
    },
    toggleCoordsTool () {
      this.visibleCoordsPanel = !this.visibleCoordsPanel
      this.$refs.coordsPanel.toggle(this.visibleCoordsPanel)
    },
    toggleBinding (bindingEnabled) {
      if (bindingEnabled) {
        this.clearHighlightObjects()
      }
    },
    toggleCheckTopologyPanel () {
      this.visibleTopologyPanel = !this.visibleTopologyPanel
    },
    toggleBasemaps () {
      this.visibleBasemap = !this.visibleBasemap
    },
    removeLayer (layer) {
      if (!layer) {
        return
      }
      const layerInfo = this.layers.find(a => a.layer.id === layer.id)
      if (!layerInfo) {
        return
      }
      const index = this.layers.indexOf(layerInfo)
      this.map.removeLayer(layerInfo.mapLayer)
      this.layers.splice(index, 1)
    },
    async addLayer (layer, addLayerToBeggining = false) {
      // слой уже есть на карте, не добавляем
      if (this.layers.some(x => x.layer.id === layer.id)) {
        return
      }
      const mapLayer = await getMapLayer(layer, this.map)
      const layerInfo = {
        layer,
        mapLayer
      }
      if (addLayerToBeggining) {
        this.layers.unshift(layerInfo)
      } else {
        this.layers.push(layerInfo)
      }
      this.map.addLayer(mapLayer)
      return layerInfo
    },
    async addLayers (layers) {
      for (let layer of layers) {
        const mapLayer = await getMapLayer(layer, this.map)
        this.layers.push({
          layer: layer,
          mapLayer: mapLayer
        })
        this.map.addLayer(mapLayer)
      }
    },
    async addBaseLayers () {
      const defaultMapId = this.profile.defaultMapId
      if (defaultMapId) {
        const basemapLayers = await this.coreApi.registry.getCardLayers(defaultMapId)
        if (basemapLayers) {
          basemapLayers.forEach(a => {
            a.isBasemap = true
            a.spatialCardId = defaultMapId
          })
        }
        await this.addLayers(basemapLayers)
      }
      this.isBasemapLoaded = true
    },
    async addUserModuleLayers () {
      if (!this.currentModule) {
        return
      }
      const layers = await this.coreApi.settingsProfiles.getModuleLayers(this.profile.id, this.currentModule.id)
      await this.addLayers(layers)
    },
    async isMultipleLayerSpatialSettings (layerId) {
      const { result } = await this.coreApi.registries.checkMultipleLayerSpatialSettings(layerId)

      return result
    },
    getEntitySpatialSetting (entityType) {
      return this.profile
        .entitySpatialSettings
        .find(x => x.entityTypeCode === entityType)
    },
    async addEntityLayer (entityType) {
      if (!entityType) {
        return
      }

      const entitySpatialSetting = this.getEntitySpatialSetting(entityType)
      if (entitySpatialSetting) {
        // Флаг запрещающий удаление слоя в менеджере слоев
        entitySpatialSetting.layer.disableRemove = true
        await this.addLayer(entitySpatialSetting.layer, true)
      }
    },
    async removeEntityLayer (entityType) {
      if (!entityType) {
        return
      }

      const entitySpatialSetting = this.getEntitySpatialSetting(entityType)
      if (entitySpatialSetting) {
        await this.removeLayer(entitySpatialSetting.layer)
      }
    },
    async addDefaultEntityLayer () {
      if (!this.entityType) {
        return
      }

      this.entitySpatialSetting = this.getEntitySpatialSetting(this.entityType)
      if (!this.entitySpatialSetting) {
        this.$error('Администратором не заданы настройки слоя в профиле')
        return
      }
      // Флаг запрещающий удаление слоя в менеджере слоев
      this.entitySpatialSetting.layer.disableRemove = true

      if (this.entitySpatialSetting) {
        await this.addLayer(this.entitySpatialSetting.layer, true)
      }
    },
    getLayer (layer) {
      const layerInfo = this.layers.find(a => a.layer.id === layer.id)
      if (!layerInfo) {
        return null
      }
      const result = layerInfo.layer
      result.view = layerInfo.mapLayer
      return result
    },
    getSearchLayer (layer) {
      const layerInfo = this.layers.find(a => a.layer.id === layer.id)
      if (!layerInfo) {
        return null
      }
      return {
        ...layerInfo.layer,
        view: layerInfo.mapLayer
      }
    },
    disableDrawEditMode () {
      if (this.$refs.drawPanel) {
        this.$refs.drawPanel.disableEditMode()
      }
    },
    refreshShapesLayer () {
      this.clearHighlightObjects()
      if (this.shapesLayer && this.shapesLayer.view) {
        refreshLayer(this.map, this.shapesLayer.view)
      }
    },
    activateDefaultTool () {
      this.$refs.toolbar.activateDefaultTool()
    },
    deactivateToolbar () {
      if (this.$refs.toolbar) {
        this.$refs.toolbar.deactivate()
        this.$refs.toolbar.activateDefaultTool()
      }
    },
    resetToolbar () {
      this.$refs.toolbar.resetToolbar()
    },
    resetDrawTools () {
      this.$refs.drawToolsPanel.resetDrawTools()
    },
    resetDrawNotes () {
      this.$refs.drawNotesPanel.resetDrawNotes()
    },
    // deactivateToolbar (val) {
    //   this.isToolbarActive = val
    // },
    removeDrawNotes () {
      this.$refs.drawNotesPanel.removeDrawNotes()
    },
    /**
     * Выделить features на карте
     * @param {array} items features
     * @param {boolean} [isFillHighlight=true] - заливка подствеченной области, по умолчанию - true
     */
    updateSize () {
      this.$nextTick(() => this.map.updateSize())
    },
    onChangeMode (mode) {
      this.currentSideBarMode = mode
    },
    onToggleFullScreen () {
      this.fullscreen = !this.fullscreen
      this.updateSize()
    },
    getCurrentDrawType (currentDrawType) {
      this.currentDrawType = currentDrawType
    },
    async pickDevDocumentAllObjectsOnMap (registryWithCoords) {
      const itemsCoordinateInfo = []
      const minimumMapAutoScale = this.settingsProfile.minimumMapAutoScale
      for (const el of registryWithCoords) {
        const { registry, objects: items } = el
        for (const item of items) {
          const coordinateProjection = registry.coordinateProjectionWkid
          const latitudeColumn = registry.columns.find(x => x.isLatitude)
          const longitudeColumn = registry.columns.find(x => x.isLongitude)
          const sh = latitudeColumn ? item[latitudeColumn.key] : null
          const dl = longitudeColumn ? item[longitudeColumn.key] : null
          if (coordinateProjection && dl && sh) {
            itemsCoordinateInfo.push({
              coordinateProjection,
              sh: parseFloat(sh),
              dl: parseFloat(dl)
            })
          }
        }
      }

      await searchByManyCoords(itemsCoordinateInfo, this.map, minimumMapAutoScale, true)
    },
    clearDevDocumentObjects () {
      const tragetLayers = this.layers.filter(x => x.layer.isFromDevDocuments)
      tragetLayers.forEach(x => this.removeLayer(x.layer))
      clearHighlightedDevDocumentObjectsOnMap()
    },
    async showDocumentItemsOnMap (payload) {
      const tragetLayers = this.layers.filter(x => x.layer.isFromDevDocuments)
      tragetLayers.forEach(x => this.removeLayer(x.layer))
      this.addLayers(payload.registryWithLayers)
      this.pickDevDocumentAllObjectsOnMap(payload.registryWithCoords)
      let allGeometriesList = []
      for (const item of payload.registryWithLayers) {
        const features = await objectSearch.getFeaturesByValues(item)
        if (features.length) {
          const geometries = features.map(x => x.geometry)
          allGeometriesList = allGeometriesList.concat(geometries)
        }
      }

      for (const el of payload.registryWithCoords) {
        const { registry, objects: items } = el
        for (const item of items) {
          let coordinateProjection = registry.coordinateProjectionWkid
          const latitudeColumn = registry.columns.find(x => x.isLatitude)
          const longitudeColumn = registry.columns.find(x => x.isLongitude)
          const sh = latitudeColumn ? item[latitudeColumn.key] : null
          const dl = longitudeColumn ? item[longitudeColumn.key] : null
          if (coordinateProjection && dl && sh) {
            const point = new Point([dl, sh])
            if (coordinateProjection === 102100) {
              coordinateProjection = 3857
            }
            if (coordinateProjection === 84) {
              coordinateProjection = 4326
            }

            const { data } = await axios.post('/api/map/projection', {
              geometry: new WKT().writeGeometry(point),
              projection: 3857,
              originalProjection: coordinateProjection
            })

            const result = new WKT().readGeometry(data)

            allGeometriesList.push(result)
          }
        }
      }

      const extend = getGeometriesExtent(allGeometriesList)
      const minimumMapAutoScale = this.settingsProfile.minimumMapAutoScale
      zoomMapToGeometryOrExtent(this.map, extend, minimumMapAutoScale)
    },
    changeLayerFilter (payload) {
      const isFiltered = !payload.layer.isFiltered
      const index = this.layers.findIndex(x => x.layer.id === payload.layer.id)

      if (this.actualLayer && 'isFiltered' in this.actualLayer) {
        this.actualLayer.isFiltered = isFiltered
      }

      if (~index) {
        this.$set(this.layers, index, {
          layer: {
            ...payload.layer,
            isFiltered
          },
          mapLayer: payload.mapLayer
        })
      }

      if (isFiltered) {
        updateFilters(payload.layer, payload.mapLayer)
        return
      }

      resetFilters(payload.mapLayer)
    }
  }
}
</script>

<style lang="stylus" scoped>
.registries-map-container
  margin 5px
  border 1px solid #ddd
.registries-map-container > .panel
  margin 0
  border none
.map
  height 100%
  overflow hidden
  position relative
.draw-tools
  display flex
  flex-direction column-reverse
  z-index 1
.fullscreen-map
  height 98vh !important
  position fixed
  top 5px
  left 5px
  right 5px
  bottom 15px
  z-index 3
.map >>> .ol-scale-line.ol-unselectable
  bottom 29px !important
  .ol-scale-line-inner
    color #888
    border-color #888
.map-scale-control
  position absolute
  z-index 1
  left 5px
  bottom 3px
</style>