<template>
  <div v-if="item" class="record-fields">
    <div class="row form-group" v-for="(row, index) in rows" :key="index">
      <div class="registry-field col-lg-12" :key="row.column.id" v-if="row.isSingleRow">
        <form-label :title="row.column.title" :required="row.column.isNotNull"/>
        <registry-card-field
          :editable="!row.column.isPrimaryKey && editable"
          :column="row.column"
          :item="item"
          @changeDisable="changeDisable($event, row.column)"
          :handlers="handlers"
          :classifiers="classifiers"
          @getCoordinates="getCoordinates"
        />
      </div>
      <div class="registry-field col-lg-6" :key="column.id" v-for="column in row.columns" v-else>
        <form-label :title="column.title" :required="column.isNotNull"/>
        <registry-card-field
          :editable="!column.isPrimaryKey && editable"
          :column="column"
          :item="item"
          @changeDisable="changeDisable($event, column)"
          :handlers="handlers"
          :classifiers="classifiers"
          @getCoordinates="getCoordinates"
        />
      </div>
    </div>
    <panel
      :collapsible="true"
      title="Поворотные точки"
      class="category-panel"
      headingClass="category-panel-heading"
      v-if="registry.useTurningPoints"
    >
      <template slot="body">
        <div>
          <form-row>
            <form-group-horizontal :columns="8" labelMinWidth="170px" title="Система координат" :htmlTitle="false" :labelColumns="2" :contentColumns="2">
              <input 
                type="text"
                :value="item.geomSrid"
                :disabled="true"
                class="form-control"
              >
            </form-group-horizontal>
             <form-group-horizontal :columns="4" labelMinWidth="170px" title="Получить координаты" :htmlTitle="false" :labelColumns="1" :contentColumns="1">
               <button
                  type="button"
                  class="btn btn-icon hidden-xs"
                  title="Получить координаты"
                >
                  <i class="icon_target"></i>
              </button>
            </form-group-horizontal>
          </form-row>
          <memory-data-table :columns="turningPointsColumns" :items="turningPoints" class="points-table" :pagable="false" />
        </div>
      </template>
    </panel>
    <panel
      :collapsible="true"
      v-if="item.systemAttributes"
      title="Системные сведения"
      class="category-panel"
      headingClass="category-panel-heading"
      >
        <template slot="body">
          <div>
            <div class="row form-group">
              <div class="registry-field col-lg-6" v-for="attribute of item.systemAttributes">
                <form-label :title="attribute.title"/>
                  <vue-switch
                  v-if="typeof attribute.value === 'boolean'"
                  :readonly="true"
                  :value="attribute.value"
                  />
                  <text-input
                  :value="attribute.value"
                  :disabled="true"
                  v-else
                  />
              </div>
            </div>
          </div>
        </template>
      </panel>
  </div>
</template>

<script>
import RegistryCardField from './RegistryCardField'
import _chunk from 'lodash/chunk'
import mapEventActions from '^/components/map/mapActions'
import mapEventsMixin from '^/mixins/mapEvents'
import Projection from 'ol/proj'
import _orderBy from 'lodash/orderBy'

export default {
  props: {
    registry: Object,
    columns: Array,
    classifiers: Object,
    item: Object,
    editable: Boolean,
    handlers: Object
  },
  components: {
    RegistryCardField
  },
  mixins: [mapEventsMixin],
  data () {
    return {
      turningPointsColumns: [{
        field: 'contourNumber',
        title: 'Контур',
        width: '100px',
        render: val => `Контур ${val}`
      }, {
        field: 'spatialElementNumber',
        title: 'Полигон',
        width: '100px',
        render: val => `Полигон ${val}`
      }, {
        field: 'x',
        title: 'Координата X'
      }, {
        field: 'y',
        title: 'Координата Y'
      }, {
        field: 'ordinalNumber',
        title: 'Номер точки (порядок обхода)',
        width: '120px'
      }, {
        field: 'geopointNumber',
        title: 'Номер точки (межевой точки)',
        width: '120px'
      }]
    }
  },
  computed: {
    turningPoints () {
      if (this.item.turningPoints) {
        let duplicates = this.item.turningPoints.filter((v, i, a) => a.findIndex(t => (t.geopointNumber === v.geopointNumber)) !== i)
        let unique = this.item.turningPoints.filter((v, i, a) => a.findIndex(t => (t.geopointNumber === v.geopointNumber)) === i)
        let duplicatesFiltered = _orderBy(duplicates, ['contourNumber', 'spatialElementNumber', 'geopointNumber'], ['asc', 'asc', 'asc'])
        let uniqueFiltered = _orderBy(unique, ['contourNumber', 'spatialElementNumber', 'geopointNumber'], ['asc', 'asc', 'asc'])
        return [...duplicatesFiltered, ...uniqueFiltered]
      } else {
        return []
      }
    },
    rows () {
      const chunkedRows = _chunk(this.columns.filter(column => column.isVisibleInGrid && !column.isPrimaryKey && !column.isSystemAttribute), 2)
      const rows = []
      for (const row of chunkedRows) {
        const htmlColumnInRow = row.some(column => column.isHtml)
        if (htmlColumnInRow) {
          for (const column of row) {
            if (column.isHtml || column.isLink || column.isEmail) {
              rows.push({
                isSingleRow: true,
                column: column
              })
            } else {
              rows.push({
                isSingleRow: false,
                columns: [column]
              })
            }
          }
        } else {
          rows.push({
            isSingleRow: false,
            columns: row
          })
        }
      }
      return rows
    }
  },
  mounted () {
    this.onEventFromMap(mapEventActions.COORDINATES_RESULT, this.setCoordinates)
  },
  methods: {
    changeDisable (newValue, column) {
      this.$emit('changeDisable', newValue)
      this.$emit('itemChanged', column)
    },
    getCoordinates () {
      this.emitEventToMap(mapEventActions.GET_COORDINATES)
    },
    setCoordinates (payload) {
      const coordinateProjection = `EPSG:${this.registry.coordinateProjectionWkid}`
      const projectedCoordinates = Projection.transform(payload.coordinate, 'EPSG:3857', coordinateProjection)
      const [longitude, latitude] = projectedCoordinates
      const latitudeColumn = this.registry.columns.find(x => x.isLatitude).key
      const longitudeColumn = this.registry.columns.find(x => x.isLongitude).key
      this.item[latitudeColumn] = latitude
      this.item[longitudeColumn] = longitude
    }
  }
}
</script>

<style lang="stylus" scoped>
.record-fields
  margin 10px
  margin-top 0px
.dt-table.points-table
  min-height 250px  
</style>
