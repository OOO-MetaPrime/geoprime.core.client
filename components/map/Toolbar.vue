<template>
  <div class="heading-btn custom-heading-btn" :class="{wrap: isWrap}">
    <toolbar-base-maps
      :layers="layers"
      @exchangeBasemaps="x => $emit('exchangeBasemaps', x)"
      v-if="isBasemapLoaded"
    />
    <identify-point
      :map="map"
      :layers="layers"
      ref="identifyPoint"
    />
    <identify-polygon
      :map="map"
      :layers="layers"
      ref="identifyPolygon"
      @click="identifyPolygonClick"
    />
    <button
      type="button"
      class="btn btn-icon hidden-xs"
      @click="toggleCoordsToolPanel"
      :class="toggleButtonClass(visibleCoordsPanel)"
      :disabled="false"
      title="Получить координаты"
    >
      <i class="icon_target"></i>
    </button>
    <button
      type="button"
      class="btn btn-icon hidden-xs"
      @click="drawPanelClick"
      :class="toggleButtonClass(visibleDrawPanel)"
      title="Панель редактирования объектов карты"
    >
      <i class="icon_edit"></i>
    </button>
    <button
      type="button"
      class="btn btn-icon hidden-xs"
      @click="bindClick"
      :class="toggleButtonClass(isLinked)"
      :disabled="!canBind"
      title="Связать с объектом карты"
    >
      <i class="icon_link"></i>
    </button>
    <button
      type="button"
      class="btn btn-icon hidden-xs"
      :class="toggleButtonClass(visibleTopologyPanel)"
      title="Проверка топологии"
      @click="checkTopologyClick"
      :disabled="topologySettingsExist"
    >
      <i class="icon_copy"></i>
    </button>
    <button
      type="button"
      class="btn btn-default btn-icon hidden-xs"
      @click="downloadScreenshotMap"
      title="Выгрузить карту"
    >
      <a ref="link" style="display: hidden"></a>
      <i class="icon_download"></i>
    </button>
    <button type="button"
      class="btn btn-default btn-icon hidden-xs"
      :class="toggleButtonClass(visibleDrawNotesPanel)"
      @click="drawNotesPanelClick"
      title="Заметки"
    >
      <i class="icon_pushpin"></i>
    </button>
    <toolbar-measure
      :map="map"
      ref="measure"
      :mapCurrentScale="currentScale"
      @click="measureClick"
      @changeMeasureValue="$emit('changeMeasureValue')"
      @changeMeasureValueArea="$emit('changeMeasureValueArea')"
      @measureStart="$emit('measureStart', $event)"
    />
    <toolbar-full-map-button :map="map"/>
    <button
      @click="clearLayers"
      class="btn btn-default btn-icon"
      title="Очистка карты"
    >
      <i class="icon_eraser"></i>
    </button>
    <button
      @click="showFullScreen"
      class="btn btn-default btn-icon"
      title="Развернуть"
    >
      <i class="icon_screen_full"></i>
    </button>
    <toolbar-toggle-sidebar />
    <div class="hidden-sm hidden-md hidden-lg">
      <a
        class="btn btn-default"
        :class="searchClass"
        title="Поиск"
        href="#map-sidebar-search"
        data-toggle="tab"
        @click="openSidebar('search')"
      >
        <i class="icon_search"></i>
      </a>
      <a
        class="btn btn-default"
        :class="layersClass"
        title="Слои"
        href="#basic-tab2"
        data-toggle="tab"
        @click="openSidebar('layers')"
      >
        <svg-icon>
          <svg class="icon-svg" viewBox="0 0 24 24">
            <path class="icon-svg-path" d="M12,16L19.36,10.27L21,9L12,2L3,9L4.63,10.27M12,18.54L4.62,12.81L3,14.07L12,21.07L21,14.07L19.37,12.8L12,18.54Z" />
          </svg>
        </svg-icon>
      </a>
      <a
        class="btn btn-default"
        :class="legendClass"
        title="Легенда"
        href="#basic-tab3"
        data-toggle="tab"
        @click="openSidebar('legend')"
      >
        <i class="icon_list2"></i>
      </a>
      <a
        class="btn btn-default"
        :class="catalogClass"
        title="Каталог ПД"
        href="#basic-tab4"
        data-toggle="tab"
        @click="openSidebar('catalog')"
      >
        <svg-icon>
          <svg class="icon-svg" viewBox="0 0 24 24">
            <path class="icon-svg-path" d="M15,19L9,16.89V5L15,7.11M20.5,3C20.44,3 20.39,3 20.34,3L15,5.1L9,3L3.36,4.9C3.15,4.97 3,5.15 3,5.38V20.5A0.5,0.5 0 0,0 3.5,21C3.55,21 3.61,21 3.66,20.97L9,18.9L15,21L20.64,19.1C20.85,19 21,18.85 21,18.62V3.5A0.5,0.5 0 0,0 20.5,3Z" />
          </svg>
        </svg-icon>
      </a>
    </div>
    <button type="button"
      v-if="isDrawingsBtnVisible"
      class="btn btn-default btn-icon hidden-xs"
      :map="map"
      :class="toggleButtonClass(visibleDrawToolsPanel)"
      @click="drawToolsPanelClick"
      title="Чертеж"
    >
      <i class="icon_design"></i>
    </button>

  </div>
</template>

<script>
import ToolbarMeasure from './ToolbarMeasure'
import ToolbarFullMapButton from './ToolbarFullMapButton'
import ToolbarBaseMaps from './ToolbarBaseMaps'
import ToolbarToggleSidebar from './ToolbarToggleSidebar'
import IdentifyPoint from './IdentifyPoint'
import IdentifyPolygon from './IdentifyPolygon'
import componentsMixin from '^/mixins/components'
import removeLayerHelper from './removeLayerHelper'
import ActiveTools from './enums/activeTools.js'
import axios from 'axios'

export default {
  props: {
    currentScale: Number,
    map: Object,
    layers: Array,
    isDrawModeActive: Boolean,
    visibleDrawPanel: Boolean,
    visibleTopologyPanel: Boolean,
    visibleDrawNotesPanel: Boolean,
    visibleDrawToolsPanel: Boolean,
    visibleCoordsPanel: Boolean,
    isBasemapLoaded: Boolean,
    isDrawingsBtnVisible: {
      type: Boolean,
      default: false
    },
    disable: Object,
    canDraw: {
      type: Boolean,
      default: false
    },
    canBind: {
      type: Boolean,
      default: false
    },
    isWrap: {
      type: Boolean,
      default: false
    },
    mode: String,
    isDrawingsAllowed: Boolean,
    disableDTools: Boolean,
    isToolbarActive: Boolean
  },
  mixins: [componentsMixin],
  components: {
    ToolbarMeasure,
    ToolbarFullMapButton,
    ToolbarBaseMaps,
    ToolbarToggleSidebar,
    IdentifyPoint,
    IdentifyPolygon
  },
  data () {
    return {
      isLinked: false,
      activeTool: null,
      drawToolsActive: false,
      modeButton: null,
      topologySettingsExist: false,
      toolbarsMatrix: {
        [ActiveTools.IdentifyPoint]: {
          disableLowerToolbar: [],
          turnOff: []
        },
        [ActiveTools.IdentifyPolygon]: {
          disableLowerToolbar: [
            ActiveTools.CheckTopology,
            ActiveTools.DrawNotes,
            ActiveTools.DrawTools
          ],
          turnOff: [
            ActiveTools.PointCoordinates,
            ActiveTools.Draw,
            ActiveTools.Bind,
            ActiveTools.Measure
          ]
        },
        [ActiveTools.PointCoordinates]: {
          disableLowerToolbar: [
            ActiveTools.CheckTopology,
            ActiveTools.DrawNotes,
            ActiveTools.DrawTools
          ],
          turnOff: [
            ActiveTools.IdentifyPolygon,
            ActiveTools.Draw,
            ActiveTools.Bind,
            ActiveTools.Measure
          ]
        },
        [ActiveTools.Draw]: {
          disableLowerToolbar: [
            ActiveTools.CheckTopology,
            ActiveTools.DrawTools,
            ActiveTools.DrawNotes
          ],
          turnOff: [
            ActiveTools.IdentifyPolygon,
            ActiveTools.PointCoordinates,
            ActiveTools.Bind,
            ActiveTools.Measure
          ]
        },
        [ActiveTools.Bind]: {
          disableLowerToolbar: [
            ActiveTools.CheckTopology,
            ActiveTools.DrawNotes,
            ActiveTools.DrawTools
          ],
          turnOff: [
            ActiveTools.IdentifyPolygon,
            ActiveTools.PointCoordinates,
            ActiveTools.Draw,
            ActiveTools.Measure
          ]
        },
        [ActiveTools.Download]: {
          disableLowerToolbar: [],
          turnOff: []
        },
        [ActiveTools.CheckTopology]: {
          disableLowerToolbar: [
            ActiveTools.DrawTools,
            ActiveTools.DrawNotes
          ],
          turnOff: [
            ActiveTools.IdentifyPolygon,
            ActiveTools.PointCoordinates,
            ActiveTools.Draw,
            ActiveTools.Bind,
            ActiveTools.Measure
          ]
        },
        [ActiveTools.DrawNotes]: {
          disableLowerToolbar: [
            ActiveTools.CheckTopology,
            ActiveTools.Draw,
            ActiveTools.DrawTools
          ],
          turnOff: [
            ActiveTools.IdentifyPolygon,
            ActiveTools.PointCoordinates,
            ActiveTools.Bind,
            ActiveTools.Measure
          ]
        },
        [ActiveTools.Measure]: {
          disableLowerToolbar: [
            ActiveTools.CheckTopology,
            ActiveTools.DrawNotes
          ],
          turnOff: [
            ActiveTools.IdentifyPolygon,
            ActiveTools.PointCoordinates,
            ActiveTools.Draw,
            ActiveTools.Bind
          ]
        },
        [ActiveTools.ShowAll]: {
          disableLowerToolbar: [],
          turnOff: []
        },
        [ActiveTools.ClearMap]: {
          disableLowerToolbar: [],
          turnOff: []
        },
        [ActiveTools.FullScreen]: {
          disableLowerToolbar: [],
          turnOff: []
        },
        [ActiveTools.ManagingMap]: {
          disableLowerToolbar: [],
          turnOff: []
        },
        [ActiveTools.DrawTools]: {
          disableLowerToolbar: [
            ActiveTools.CheckTopology,
            ActiveTools.DrawNotes
          ],
          turnOff: [
            ActiveTools.IdentifyPolygon,
            ActiveTools.PointCoordinates,
            ActiveTools.Draw,
            ActiveTools.Bind
          ]
        }
      },
      tools: [
        { tool: ActiveTools.IdentifyPolygon, isActive: false },
        { tool: ActiveTools.PointCoordinates, isActive: false },
        { tool: ActiveTools.Draw, isActive: false },
        { tool: ActiveTools.Bind, isActive: false },
        { tool: ActiveTools.CheckTopology, isActive: false },
        { tool: ActiveTools.DrawNotes, isActive: false },
        { tool: ActiveTools.Measure, isActive: false },
        { tool: ActiveTools.DrawTools, isActive: false }
      ]
    }
  },
  computed: {
    searchClass () {
      return (this.modeButton === 'search' && this.mode !== null) ? 'btn-primary' : ''
    },
    layersClass () {
      return (this.modeButton === 'layers' && this.mode !== null) ? 'btn-primary' : ''
    },
    legendClass () {
      return (this.modeButton === 'legend' && this.mode !== null) ? 'btn-primary' : ''
    },
    catalogClass () {
      return (this.modeButton === 'catalog' && this.mode !== null) ? 'btn-primary' : ''
    }
  },
  async mounted () {
    this.activateDefaultTool()

    const topologySettings = await axios.get('/api/map/topology-control-settings')
    if (topologySettings.data.length > 0) {
      this.topologySettingsExist = false
    } else {
      this.topologySettingsExist = true
    }
  },
  methods: {
    activateDefaultTool () {
      this.activeTool = ActiveTools.IdentifyPoint
      this.$refs.identifyPoint.activate()
    },
    deactivate (activeTool) {
      const activeToolFromMatrix = this.toolbarsMatrix[activeTool]

      if (!activeToolFromMatrix) {
        return
      }

      const simpleTools = [ActiveTools.IdentifyPolygon, ActiveTools.PointCoordinates, ActiveTools.Bind, ActiveTools.Measure]

      this.$refs.identifyPoint.deactivate()
      if (activeToolFromMatrix.turnOff.find(x => x === ActiveTools.IdentifyPolygon)) {
        this.$refs.identifyPolygon.deactivate()
      }
      if (activeToolFromMatrix.turnOff.find(x => x === ActiveTools.PointCoordinates)) {
        this.deactivateCoordsPanel()
      }
      if (activeToolFromMatrix.turnOff.find(x => x === ActiveTools.Draw)) {
        this.deactivateDraw()
      }
      if (activeToolFromMatrix.turnOff.find(x => x === ActiveTools.Bind)) {
        this.deactivateBind()
      }
      if (activeToolFromMatrix.turnOff.find(x => x === ActiveTools.CheckTopology)) {
        this.deactivateCheckTopology()
      }
      if (activeToolFromMatrix.turnOff.find(x => x === ActiveTools.DrawNotes)) {
        this.deactivateDrawNotes()
      }
      if (activeToolFromMatrix.turnOff.find(x => x === ActiveTools.Measure)) {
        this.$refs.measure.deactivate()
        this.$emit('measureEnd')
        this.$emit('turnOffDrawTools', false)
      }

      if (activeToolFromMatrix.disableLowerToolbar.find(x => x === ActiveTools.Draw)) {
        this.$emit('disableDraw', true)
      }
      if (activeToolFromMatrix.disableLowerToolbar.find(x => x === ActiveTools.CheckTopology)) {
        if (this.visibleTopologyPanel) {
          if (simpleTools.includes(activeTool)) {
            this.$emit('disableCheckTopology', { disabled: true, simple: true })
          } else {
            this.$emit('disableCheckTopology', { disabled: true, simple: false })
          }
        }
      }
      if (activeToolFromMatrix.disableLowerToolbar.find(x => x === ActiveTools.DrawNotes)) {
        if (this.visibleDrawNotesPanel) {
          if (activeTool === ActiveTools.DrawTools || activeTool === ActiveTools.Draw) {
            this.$emit('disableDrawNotes', { disabled: true, block: false })
          } else {
            this.$emit('disableDrawNotes', { disabled: true, block: true })
          }
        }
      }
      if (activeToolFromMatrix.disableLowerToolbar.find(x => x === ActiveTools.DrawTools)) {
        if (this.visibleDrawToolsPanel) {
          if (activeTool === ActiveTools.DrawNotes || activeTool === ActiveTools.Draw) {
            this.$emit('disableDrawTools', false)
          } else {
            this.$emit('disableDrawTools', true)
          }
        }
      }
    },
    resetToolbar () {
      // console.log('this.activeTool resetToolbar =', this.activeTool)
    },
    toggle (tool, isActive) {
      this.updateToolsActivity(tool, isActive)

      if (isActive) {
        this.activeTool = tool
        this.deactivate(tool)
      } else {
        if (this.visibleTopologyPanel) {
          this.$emit('disableCheckTopology', { disabled: false })
        }
        if (this.visibleDrawNotesPanel) {
          this.$emit('disableDrawNotes', { disabled: false, block: false })
        }
        if (this.visibleDrawToolsPanel) {
          this.$emit('disableDrawTools', false)
        }

        const resultArray = this.tools.filter(x => x.isActive === true)
        if (resultArray.length === 0) {
          this.activateDefaultTool()
        }
      }
    },
    updateToolsActivity (tool, isActive) {
      const toolFound = this.tools.find(x => x.tool === tool)
      const index = this.tools.indexOf(toolFound)
      toolFound.tool = tool
      toolFound.isActive = isActive
      this.tools.splice(index, 1, toolFound)
    },
    identifyPolygonClick (isActive) {
      this.toggle(ActiveTools.IdentifyPolygon, isActive)
    },
    toggleCoordsToolPanel () {
      this.drawToolsActive = false
      this.toggle(ActiveTools.PointCoordinates, !this.visibleCoordsPanel)
      this.toggleCoordsTool()
    },
    drawPanelClick () {
      this.toggle(ActiveTools.Draw, !this.visibleDrawPanel)
      this.toggleDraw()
    },
    bindClick () {
      this.drawToolsActive = false
      this.toggle(ActiveTools.Bind, !this.isLinked)
      this.toggleBind()
    },
    checkTopologyClick () {
      this.drawToolsActive = false
      this.toggle(ActiveTools.CheckTopology, !this.visibleTopologyPanel)
      this.toggleCheckTopology()
    },
    drawNotesPanelClick () {
      this.toggle(ActiveTools.DrawNotes, !this.visibleDrawNotesPanel)
      this.toggleDrawNotes()
    },
    measureClick (isActive) {
      if (isActive) {
        this.$emit('turnOffDrawTools', true)
      } else {
        this.$emit('measureEnd')
        this.$emit('turnOffDrawTools', false)
      }
      this.toggle(ActiveTools.Measure, isActive)
    },
    drawToolsPanelClick () {
      this.drawToolsActive = !this.drawToolsActive

      this.updateToolsActivity(ActiveTools.DrawTools, this.drawToolsActive)

      if (this.drawToolsActive) {
        this.deactivate(ActiveTools.DrawTools)
      } else {
        this.activateDefaultTool()
        if (this.visibleTopologyPanel) {
          this.$emit('disableCheckTopology', false)
        }
      }
      this.toggleDrawTools()
    },
    toggleCoordsTool () {
      this.$emit('toggleCoordsTool')
    },
    deactivateCoordsTool () {
      this.$emit('deactivateCoordsTool')
    },
    deactivateCoordsPanel () {
      if (this.visibleCoordsPanel) {
        this.toggleCoordsTool()
      }
    },
    toggleDraw () {
      this.$emit('toggleDrawPanel')
    },
    deactivateDraw () {
      if (this.visibleDrawPanel) {
        this.toggleDraw()
      }
    },
    toggleBind () {
      if (!this.isLinked) {
        this.activateBind()
      } else {
        this.deactivateBind()
      }
    },
    activateBind () {
      this.isLinked = true
      this.$emit('toggleBinding', true)
      this.map.on('singleclick', this.bindToObjectMapClick)
    },
    deactivateBind () {
      this.$emit('toggleBinding', false)
      this.map.un('singleclick', this.bindToObjectMapClick)
      this.isLinked = false
    },
    bindToObjectMapClick (e) {
      this.$emit('bindToObject', e)
    },
    toggleCheckTopology () {
      this.$emit('toggleCheckTopologyPanel')
    },
    deactivateCheckTopology () {
      if (this.visibleTopologyPanel) {
        this.toggleCheckTopology
      }
    },
    toggleDrawNotes () {
      this.$emit('toggleDrawNotesPanel')
    },
    deactivateDrawNotes () {
      if (this.visibleDrawNotesPanel) {
        this.toggleDrawNotes()
      }
    },
    toggleDrawTools () {
      this.$emit('toggleDrawToolsPanel')
    },
    deactivateDrawTools () {
      if (this.visibleDrawToolsPanel) {
        this.toggleDrawTools()
      }
    },

    // TODO метод повторяется, вынести в отдельный файл
    downloadScreenshotMap () {
      const link = this.$refs.link
      this.map.once('postcompose', function (event) {
        if (event.context.canvas.msToBlob) {
          window.navigator.msSaveBlob(event.context.canvas.msToBlob(), 'map.png')
        } else {
          link.href = event.context.canvas.toDataURL('image/png')
          link.download = 'map.png'
          link.click()
        }
      })
      this.map.renderSync()
    },
    openSidebar (activeMode) {
      this.modeButton = activeMode
      this.$emit('changeMode', activeMode)
      this.$store.commit('MAP_OPEN_SIDEBAR')
    },
    changeMode () {
      this.openSidebar('search')
    },
    clearLayers () {
      const layersToRemove = this.layers.filter(x => !(x.layer.disableRemove || x.layer.isBasemap))
      layersToRemove.forEach(x => {
        removeLayerHelper({ layer: x, layers: this.layers, map: this.map })
      })
      this.$emit('removeDrawNotes')
    },
    showFullScreen () {
      this.$emit('toggleFullScreen')
    }
  }
}
</script>

<style lang="stylus" scoped>
  .custom-heading-btn
    margin: 0
    text-align: left
  .custom-heading-btn > div, button
    margin 0 1px
  .wrap
    flex-wrap wrap
</style>
