<template>
  <div class="flex-column" style="margin: 10px 0 0 0">
    <div class="input-group controls" v-if="thematicSearches.length" v-show="!selectedResult">
      <input type="text" class="form-control" :placeholder="selectedSearch.name" v-model="searchInput" @keyup.enter="search">
      <span class="input-group-addon" v-if="isBusy">
        <i class="icon_spinner spinner"></i>
      </span>
      <div class="input-group-btn" v-else>
        <dropdown menu-right>
          <div>
            <button type="button" class="btn btn-default dropdown-toggle">
              <img v-if="selectedSearch.icon" class="position-left" :src="`data:image/png;base64, ${selectedSearch.icon}`">
              <i v-if="!selectedSearch.icon && !selectedSearch.castomIcon" class="icon_search"/>
              <i v-if="selectedSearch.castomIcon && !search.icon" :class="selectedSearch.castomIcon"/>
              <span class="caret"></span>
            </button>
            <button type="button" class="btn btn-default">
              <i class="icon_cross" @click="clearSearchResults"/>
            </button>
          </div>
          <template slot="dropdown">
            <li v-for="search of thematicSearches" :key="search.id" @click="selectSearch(search)">
              <a :title="search.name">
                <img v-if="search.icon" class="position-left" :src="`data:image/png;base64, ${search.icon}`">
                <i v-if="!search.icon && !search.castomIcon" class="icon_search"/>
                <i v-if="search.castomIcon && !search.icon" :class="search.castomIcon"/>
                {{ search.name }}
              </a>
            </li>
          </template>
        </dropdown>
      </div>
    </div>
    <div class="input-group" v-show="this.selectedSearch.typeSearch === 4">
      <label>Система координат
        <span class="text-danger"> * </span>
      </label>
      <select2
        v-model="selectedCoordinateSystem"
        :data="coordinateSystems"
        class="form-control"
        id="wkid"
      />
    </div>

    <!-- TODO В отдельный компонент -->
    <div style="margin-top: 5px; flex: 1; overflow: auto" v-show="!selectedResult">
      <ul class="media-list">
        <li class="media" v-for="(result, index) of results" :key="index">
          <div class="media-body">
            <a class="media-heading text-semibold" @click="zoom(result)">{{ result.name }}</a>
            <span class="text-size-mini text-muted display-block">{{ result.description }}</span>
          </div>
        </li>
      </ul>
    </div> 

    <!-- TODO В отдельный компонент -->
    <div v-if="selectedResult">
      <ul class="icons-list">
        <li>
          <button type="button" class="btn btn-default btn-icon">
            <i @click="selectedResult = null" class="icon_arrow_back" style="cursor: pointer" title="Назад"></i> 
          </button>
        </li>
        <li>
          <button class="btn btn-default btn-icon" @click="print">
            <i class="icon_printer" title="Печать карточки"></i>
          </button>
        </li>
        <li>
          <button class="btn btn-default btn-icon" @click="exportToXLSX">
            <i class="icon_file_excel" title="Экспорт в xlsx"></i>
          </button>
        </li>
        <li>
          <button class="btn btn-default btn-icon" @click="getCoord">
            <i class="icon_location" title="Экспорт координат"></i>
          </button>
        </li>
        <li>
          <button class="btn btn-default btn-icon" @click="openCoordModal" :disabled="!selectedResult.geometry">
            <i class="icon_square_down" title="Координаты объекта (json)"></i>
          </button>
        </li>
        <li>
          <button 
            class="btn btn-primary button" 
            v-if="isDescribeButtonAvailable /*  &&  selectedResult.filePlace && selectedResult.objectIdValue && selectedResult.layerField */" 
            @click="showEntityDescription"
          >
            Подробнее
          </button>
        </li>
      </ul>
      <h6 class="content-group text-semibold event-name">
        {{ selectedResult.name }}
        <small class="display-block">{{ selectedResult.description }}</small>
      </h6>
      <button v-if="selectedResult.isBindable" class="btn btn-primary bind-button" @click="bindToObject" title="Привязать выбранный объект на карте к выбранной записи в списке">
        <i class="icon_link"></i>
        Привязать
      </button>
      <tabs-panel class="no-border">
        <tabs class="tabs">
          <div slot="nav-right">
          </div>
          <tab title="Описание">
            <table class="table table-striped">
              <tbody>
                <tr v-for="(attribute, index) of selectedResult.attributes" :key="index">
                  <td>{{ attribute.name }}</td>
                  <td>{{ attribute.value }}</td>
                </tr>
              </tbody>
            </table>
          </tab>
          <tab v-if="selectedResult.files" title="Файлы">
            <tr v-if="selectedResult.files">
              <td>Файлы</td>
              <td>
                <div class="filename" v-for="(file, index) of selectedResult.files" :key="index">
                  <a @click="getUrl(file)">{{ file.name }}</a> 
                </div>              
              </td>
            </tr>
          </tab>
        </tabs>
      </tabs-panel>
    </div>
    <entity-description
      ref="description"
    />
   <coordinate-transform-modal
    :geometry="selectedResult ? selectedResult.geometry : null"
    :featureSrid="selectedResult ? selectedResult.crs : null"
    ref="coordinateModal"
   /> 
  </div>
</template>

<script>
import { highlightGeometriesOnMap, zoomAndHighlightObjectsOnMap, clearHighlightedObjectsOnMap, zoomMapToGeometryOrExtent } from '^/components/map/map'
import { mapState, mapActions } from 'vuex'
import rosreestrSearch from './rosreestrSearch'
import addressRegistrySearch from './addressRegistrySearch'
import thematicObjectSearch from './thematicObjectSearch'
import objectSearch from './objectSearch'
import getFlatCoordinates from '^/helpers/getFlatCoordinates.js'
import Point from 'ol/geom/point'
import axios from 'axios'
import WKT from 'ol/format/wkt'
import EntityDescription from './EntityDescription'
import CoordinateTransformModal from './CoordinateTransformModal'
import descriptionHelper from './descriptionHelper.js'

export default {
  props: {
    map: Object,
    layers: Array
  },
  components: {
    CoordinateTransformModal,
    EntityDescription
  },
  mixins: [descriptionHelper],
  data () {
    return {
      selectedCoordinateSystem: null,
      coordinateSystems: [],
      showSearchDropdown: false,
      selectedSearch: {},
      showSearch: true,
      searchInput: null,
      selectedResult: null,
      isBusy: false,
      userCanReadingResource: false,
      entityRegistry: null,
      isDescribeButtonAvailable: false
    }
  },
  computed: {
    ...mapState({
      thematicSearches: state => {
        return [
          {
            name: 'По объектам',
            typeSearch: 0,
            isPartiallyMatch: true,
            icon: null,
            matchCase: false,
            layerId: null
          },
          {
            name: 'По координатам',
            typeSearch: 4,
            isPartiallyMatch: false,
            icon: null,
            castomIcon: 'icon_location',
            matchCase: false,
            layerId: null
          },
          ...state.settingsProfile.thematicSearches
        ]
      },
      user: state => state.user,
      results: state => state.searchResults,
      settingsProfile: state => state.settingsProfile,
      ThematicSearchTypes: state => state.enums.public.ThematicSearchTypes,
      resources: state => state.resources,
      actions: state => state.actions
    })
  },
  watch: {
    selectedResult (newValue) {
      if (!newValue) {
        clearHighlightedObjectsOnMap()
        return
      }
      this.userCanReadResource().then(res => {
        this.isDescribeButtonAvailable = res
      })
    },
    results () {
      this.selectedResult = null
    }
  },
  async mounted () {
    this.getCoordinate()
    if (this.thematicSearches.length) {
      this.selectedSearch = this.thematicSearches[0]
    }
  },
  methods: {
    ...mapActions({
      clearResults: 'clearSearchResults'
    }),
    async getCoordinate () {
      const coordinateSystems = await this.coreApi.pdCards.getCoordinateSystems()
      this.coordinateSystems = coordinateSystems.map(x => ({
        code: x.code,
        id: x.id,
        name: `${x.name}  ${x.wkid}`,
        projection: x.projection,
        title: x.title,
        wkid: x.wkid,
        wkt: x.wkt
      }))
    },
    selectSearch (search) {
      this.searchInput = null
      this.selectedCoordinateSystem = null
      clearHighlightedObjectsOnMap()
      this.selectedSearch = search
      this.showSearchDropdown = false
    },
    async search () {
      if (!this.searchInput || this.isBusy) {
        return
      }
      if (this.selectedSearch.typeSearch === 4) {
        this.coordinatesSearch()
        return
      }

      clearHighlightedObjectsOnMap()

      try {
        this.isBusy = true

        const results = await this.getFeaturesByType()

        this.$store.dispatch('setSearchResults', results)

        if (!results.length) {
          this.$notice('Не найдено ни одного объекта.')
        }
      } finally {
        this.isBusy = false
      }
    },
    async coordinatesSearch () {
      if (!this.searchInput) {
        this.$error('Не указаны координаты')
        return
      }
      if (!this.selectedCoordinateSystem) {
        this.$error('Не указана система координат.')
        return
      }
      const coords = this.searchInput.trim().split(' ').map(x => parseFloat(x))
      if (coords.some(x => isNaN(x))) {
        this.$error('Введены не корректные координаты.')
        return
      }
      if (coords.length === 1) {
        this.$error('Необходимо ввести две координаты через пробел.')
      }
      const point = new Point(coords)
      if (this.selectedCoordinateSystem === 102100) {
        this.selectedCoordinateSystem = 3857
      }
      if (this.selectedCoordinateSystem === 84) {
        this.selectedCoordinateSystem = 4326
      }
      const { data } = await axios.post('/api/map/projection', {
        geometry: new WKT().writeGeometry(point),
        projection: 3857,
        originalProjection: this.selectedCoordinateSystem
      })
      const result = new WKT().readGeometry(data)
      await clearHighlightedObjectsOnMap()
      const minimumMapAutoScale = this.settingsProfile.minimumMapAutoScale
      zoomMapToGeometryOrExtent(this.map, result, minimumMapAutoScale)
      highlightGeometriesOnMap([result], this.map, true)
    },
    async getFeaturesByType () {
      switch (this.selectedSearch.typeSearch) {
        // Поиск по объектам
        case this.ThematicSearchTypes.objectSearch:
          const visibleLayers = this.layers
            .filter(layer => layer.mapLayer && layer.mapLayer.getVisible())
            .map(layer => layer.layer)
          return objectSearch.getFeatures(visibleLayers, this.searchInput, { thematicSearch: this.selectedSearch })
        // Поиск по параметрам
        case this.ThematicSearchTypes.byParameters:
          return thematicObjectSearch.getFeatures(this.searchInput, { thematicSearch: this.selectedSearch })
        // Поиск по ПКК Росреестра
        case this.ThematicSearchTypes.rosreestr:
          return rosreestrSearch.getFeatures(this.searchInput)
        // Адресный поиск
        case this.ThematicSearchTypes.address:
          return addressRegistrySearch.getFeatures(this.searchInput, { thematicSearch: this.selectedSearch })
        default: return []
      }
    },
    zoom (result) {
      clearHighlightedObjectsOnMap()
      this.selectedResult = result
      const minimumMapAutoScale = this.settingsProfile.minimumMapAutoScale
      if (result.geometry) {
        zoomAndHighlightObjectsOnMap([result], this.map, 17, minimumMapAutoScale)
      }
    },
    bindToObject () {
      this.$emit('bindToObject', { feature: this.selectedResult })
    },
    clearSearchResults () {
      clearHighlightedObjectsOnMap()
      this.clearResults()
      this.searchInput = null
      this.selectedCoordinateSystem = null
    },
    getUrl (file) {
      const downloadUrl = this.$url(file.downloadUrl)
      this.coreApi.download.downloadFile(downloadUrl, 'options', JSON.stringify({ download: true }), 'GET')
    },
    print () {
      window.print()
    },
    async exportToXLSX () {
      const attributes = this.selectedResult.attributes.map(el => {
        return { 'поле': el.name, 'значение': el.value }
      })
      const data = { attributes: attributes, name: this.selectedResult.name }
      this.coreApi.download.downloadFileAxios(`/api/xlsx/objects/export`, { data })
    },
    getCoord () {
      getFlatCoordinates(this.selectedResult)
    },
    openCoordModal () {
      this.$refs.setComponent
      this.$refs.coordinateModal.openModal()
    },
    async showEntityDescription () {
      const res = await this.getJustEntity()
      if (!res) {
        return
      }
      await this.$refs.description.setComponent(res)
      this.$refs.description.openModal()
    },

    async getJustEntity () {
      const entityComponent = await this.getDescription(this.entityDeterm)
      if (!entityComponent) {
        return null
      }
      this.entityComponent = entityComponent
      return entityComponent
    },

    async getEntityDescription () {
      const recognizedItem = this.recognizeEntity()
      if (!recognizedItem) {
        return false
      }
      this.entityDeterm = recognizedItem

      const entityComponent = await this.getDescription(recognizedItem)
      if (!entityComponent) {
        return
      }
      this.entityComponent = entityComponent
      return entityComponent
    },
    /**
     * проверка прав на чтение ресурса для подробнее
     */
    async userCanReadResource () {
      const entityComponent = await this.getEntityDescription()
      if (!entityComponent) {
        return false
      }
      const { component: componentName, ...params } = entityComponent
      if (!componentName) {
        return false
      }
      switch (componentName) {
        case 'IsogdDocumentCard' :
          return this.user.can(this.resources.ISOGDDocument, this.actions.read)
        case 'UrbanPlanningCard' :
          return this.user.can(this.resources.terrZone, this.actions.read)
        case 'RegistriesRecord' :
          return params.registry.claims.read
        default: return false
      }
    }
  }
}
</script>

<style lang="stylus" scoped>
.dropdown-toggle img
  max-width 16px
  max-height 16px
.bind-button
  margin-bottom 10px
.filename 
  padding-bottom 15px
  word-break break-word
.filename:last-child
  padding-bottom 0
.event-name 
  margin-top 18px
.pl
  padding-left 0
.corrd-input
  margin-bottom 20px
.controls
  margin-bottom 20px
</style>
