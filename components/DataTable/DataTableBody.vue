<template>
  <div class="dt-body" :class="tableClass">
    <table class="table dataTable">
      <colgroup>
        <col
          v-for="(column, index) of columns"
          :key="index"
          :style="{ width: column.calculatedWidth }">
      </colgroup>
      <tbody>
        <template>
          <tr>
            <td 
              class="borders"
              v-for="(itemForCreate, index) of itemsForCreate"
              :key="index"
            >
              <data-table-create-toolbar
                v-if="itemForCreate.type && itemForCreate.type === 'createItemToolbar' && mode === 'create'"
                :isSaveCreateBtnActive="isCreateChange"
                :itemForCreate="itemForCreate"
                @cancelCreateGo="cancelCreateGo"
                @saveCreateGo="saveCreateGo"
              />
              <data-table-coordinate-input
                v-if="itemForCreate.type && itemForCreate.type === 'inputCoordinate' && mode === 'create'"
                :readonly="itemForCreate.readonly"
                :required="itemForCreate.required"
                :mask="itemForCreate.mask"
                :value="getRawValueForCreateMode(itemForCreate)"
                @setNewValue="setNewValueForCreate(itemForCreate, $event)"
              />
              <data-table-coordinate-input-with-btn
                v-if="itemForCreate.type && itemForCreate.type === 'inputCoordinateWithBtn' && mode === 'create'"
                :readonly="itemForCreate.readonly"
                :required="itemForCreate.required"
                :mask="itemForCreate.mask"
                :value="getRawValueForCreateMode(itemForCreate)"
                @setNewValue="setNewValueForCreate(itemForCreate, $event)"
                @getCoordinates="getCoordinatesForCreate"
              />
              <data-table-number-input
                v-if="itemForCreate.type && itemForCreate.type === 'inputNumber' && mode === 'create'"
                :readonly="itemForCreate.readonly"
                :required="itemForCreate.required"
                :decimalPlaces="itemForCreate.decimalPlaces"
                :value="getRawValueForCreateMode(itemForCreate)"
                @setNewValue="setNewValueForCreate(itemForCreate, $event)"
                :isNotNegative="itemForCreate.isNotNegative"
              />
              <data-table-date-input
                v-if="itemForCreate.type && itemForCreate.type === 'inputDate' && mode === 'create'"
                :readonly="itemForCreate.readonly"
                :value="getRawValueForCreateMode(itemForCreate)"
                :required="itemForCreate.required"
                @setNewValue="setNewValueForCreate(itemForCreate, $event)"
              />
              <data-table-input
                v-if="itemForCreate.type && itemForCreate.type === 'inputText' && mode === 'create'"
                :readonly="itemForCreate.readonly"
                :required="itemForCreate.required"
                :value="getRawValueForCreateMode(itemForCreate)"
                @setNewValue="setNewValueForCreate(itemForCreate, $event)"
              />
              <data-table-universal-select-input
                v-if="itemForCreate.type && itemForCreate.type === 'inputUniversalSelect' && mode === 'create'"
                :required="itemForCreate.required"
                :modalTitle="itemForCreate.modalTitle"
                :placeholder="itemForCreate.placeholder"
                :btnTitle="itemForCreate.btnTitle"
                :clearBtnTitle="itemForCreate.clearBtnTitle"
                :isClearBtnVisible="itemForCreate.isClearBtnVisible"
                :clearFunction="itemForCreate.clearFunction"
                :apiFunction="itemForCreate.apiFunction"
                :method="itemForCreate.method"
                :options="universalSelectInputOptions"
                :url="itemForCreate.url"
                :columns="itemForCreate.columns"
                :readonly="itemForCreate.readonly"
                :value="getUniversalSelectInputValueForCreatedMode(itemForCreate.valueObject, itemForCreate.valueField)"
                @itemSelected="inputUniversalForCreateSelected(itemForCreate.valueObject, itemForCreate.valueField, $event)"
              />
              <div class="data-table-lookup-input" :class="{'has-warning has-feedback': !getRawValueForCreateMode(itemForCreate) && itemForCreate.required}" v-if="itemForCreate.type && itemForCreate.type === 'lookup' && mode === 'create' && isLookupVisible(itemForCreate.lookupSource, itemForCreate)">
                <select2
                  class="form-control"
                  :disabled="itemForCreate.readonly"
                  :value="getRawValueForCreateMode(itemForCreate)"
                  :data="getLookupValues(itemForCreate.lookupSource, itemForCreate)"
                  :hideFilter="itemForCreate.hideFilterSearch"
                  :onSelected="newValue => changingLookupValueForCreate(itemForCreate, newValue)"
                />
              </div>
            </td>
          </tr>
        </template>
        <template v-for="(item, itemIndex) of items">
          <tr
            :key="itemIndex"
            v-on="selectable ? { click: () => onSelect(item) } : null"
            class="red"
            :class="rowClass"
          >
            <td
              v-for="(column, columnIndex) of columns"
              :key="columnIndex"
              :align="column.textAlign"
              :class="getCellClass(item, column)"
            >
              <data-table-toolbar-column
                v-if="column.type && column.type === 'toolbar'"
                :item="item"
                :isRemoveBtnDisabled="mode === 'edit' && item === editItem"
                :isEditBtnDisabled="mode === 'edit' && item === editItem"
                :isCancelBtnDisabled="mode !== 'edit' && mode !== 'create'"
                :isSaveEditBtnActive="mode === 'edit' && item === editItem && isChange"
                @editItemGo="editItemGo"
                @cancelEditGo="cancelEditGo"
                @saveEditItemGo="saveEditItemGo"
                @deleteItemGo="deleteItemGo"
                :disabled="(mode === 'edit' && item !== editItem) || mode === 'create' || disabledToolbarBtn"
              />
              <a
                v-if="stopProp && column.type && column.type.type === 'link' && !isLinkDisabled(item, column)"
                @click.stop="column.type.onClick(item, column)"
                :title="getTooltip(item, column)"
              >
                {{ getValue(item, column) }}
              </a>
              <a
                v-if="!stopProp && column.type && column.type.type === 'link' && !isLinkDisabled(item, column)"
                @click.capture="column.type.onClick(item, column)"
                :title="getTooltip(item, column)"
              >
                {{ getValue(item, column) }}
              </a>
              <span
                v-if="column.type && column.type.type === 'link' && isLinkDisabled(item, column)"
              >
                {{ getValue(item, column) }}
              </span>
              <data-table-universal-select-input
                v-if="column.type && column.type === 'inputUniversalSelect'"
                :required="column.required"
                :modalTitle="column.modalTitle"
                :placeholder="column.placeholder"
                :btnTitle="column.btnTitle"
                :clearBtnTitle="column.clearBtnTitle"
                :isClearBtnVisible="column.isClearBtnVisible"
                :clearFunction="column.clearFunction"
                :value="getUniversalSelectInputValue(column.valueObject, column.valueField, item)"
                :apiFunction="column.apiFunction"
                :method="column.method"
                :options="universalSelectInputOptions"
                :url="column.url"
                :columns="column.columns"
                @itemSelected="inputUniversalSelected(column.valueObject, column.valueField, item, $event)"
                :readonly="readonly"
              />
              <data-table-universal-select-input 
                v-if="column.edit && column.edit.type === 'inputUniversalSelect' && mode === 'edit' && item === editItem"
                :placeholder="column.placeholder"
                :readonly="column.edit.readonly"
                :required="column.required"
                :modalTitle="column.modalTitle"
                :btnTitle="column.btnTitle"
                :clearBtnTitle="column.clearBtnTitle"
                :isClearBtnVisible="column.isClearBtnVisible"
                :clearFunction="column.clearFunction"
                :value="getUniversalSelectInputValue(column.valueObject, column.valueField, item)"
                :apiFunction="column.apiFunction"
                :method="column.method"
                :options="universalSelectInputOptions"
                :url="column.url"
                :columns="column.columns"
                @itemSelected="inputUniversalSelected(column.valueObject, column.valueField, item, $event)"
              />
              <data-table-input
                v-if="column.type && column.type === 'inputText'"
                :readonly="readonly"
                :value="getRawValue(item, column)"
                :required="column.required"
                @setNewValue="setNewValue(item, column, $event)"
              />
              <data-table-coordinate-input
                v-if="column.edit && column.edit.type === 'inputCoordinate' && mode === 'edit' && item === editItem"
                :readonly="column.edit.readonly"
                :required="column.required"
                :mask="column.edit.mask"
                :value="getRawValue(item, column)"
                @setNewValue="setNewEditValue(item, column, $event)"
              />
              <data-table-coordinate-input-with-btn
                v-if="column.edit && column.edit.type === 'inputCoordinateWithBtn' && mode === 'edit' && item === editItem"
                :readonly="column.edit.readonly"
                :required="column.required"
                :mask="column.edit.mask"
                :value="getRawValue(item, column)"
                @setNewValue="setNewEditValue(item, column, $event)"
                @getCoordinates="getCoordinatesForEdit"
              />
              <data-table-input
                v-if="column.edit && column.edit.type === 'inputText' && mode === 'edit' && item === editItem"
                :readonly="column.edit.readonly"
                :value="getRawValue(item, column)"
                :required="column.required"
                @setNewValue="setNewEditValue(item, column, $event)"
              />
              <data-table-date-input
                v-if="column.type && column.type === 'inputDate' && item !== editItem"
                :readonly="readonly"
                :value="getRawValue(item, column)"
                :required="column.required"
                :displayFormat="column.displayFormat"
                @setNewValue="setNewValue(item, column, $event)"
              />
              <data-table-number-input
                v-if="column.type && column.type === 'inputNumber'"
                :readonly="readonly"
                :value="item[column.field]"
                :required="column.required"
                @setNewValue="setNewValue(item, column, $event)"
              />
              <data-table-date-input
                v-if="column.edit && column.edit.type === 'inputDate' && mode === 'edit' && item === editItem"
                :readonly="column.edit.readonly"
                :value="item[column.field]"
                :required="column.required"
                @setNewValue="setNewEditValue(item, column, $event)"
              />
              <data-table-number-input
                v-if="column.edit && column.edit.type === 'inputNumber' && mode === 'edit' && item === editItem"
                :readonly="column.edit.readonly"
                :value="item[column.field]"
                :decimalPlaces="column.edit.decimalPlaces"
                :required="column.required"
                @setNewValue="setNewEditValue(item, column, $event)"
                :isNotNegative="column.edit.isNotNegative"
              />
              <data-table-checkbox
                v-if="column.type && column.type === 'checkbox'"
                :value="item[column.field]"
                @setNewValue="setNewValue(item, column, $event)"
                :disabled="isDisabled(item, column) || readonly"
              />
              <data-table-binary-image
                v-if="column.type && column.type === 'binary'"
                :value="item[column.field]"
              />
              <data-table-base64-image
                v-if="column.type && column.type === 'base64'"
                :value="item[column.field]"
              />
              <data-table-icon
                v-if="column.type && column.type === 'icon'"
                :icon="getValue(item, column)"
              />
              <div class="data-table-lookup-input" v-if="column.edit && column.edit.type === 'lookup' && mode === 'edit' && item === editItem && isLookupVisible(column.type.lookupSource, item)" :class="{'has-warning has-feedback': isValueRequired(item , column) }">
                <select2
                  class="form-control"
                  :disabled="column.edit.readonly"
                  :value="item[column.field]"
                  :data="getLookupValues(column.type.lookupSource, item)"
                  :hideFilter="column.type.hideFilterSearch"
                  :onSelected="newValue => changingLookupValueForUpdate(item, column, newValue)"
                />
              </div>
              <div class="data-table-lookup-input" v-if="column.type && column.type.type === 'lookup' && item !== editItem && isLookupVisible(column.type.lookupSource, item)" :class="{'has-warning has-feedback': isValueRequired(item , column) }">
                <select2
                  class="form-control"
                  :disabled="readonly"
                  v-model="item[column.field]"
                  :data="getLookupValues(column.type.lookupSource, item)"
                  :hideFilter="column.type.hideFilterSearch"
                  :onSelected="newValue => changingLookupValue(item, column, newValue)"
                />
              </div>
              <div v-if="column.type && column.type.type === 'linklist'" class="data-table-links-cell">
                <a v-for="(link, linkIndex) of getLinkList(getValue(item, column), column.type.limit)" :key="linkIndex" @click.capture="column.type.onClick(item, link)">{{ getLinkValue(link, column.type.displayField) }}</a>
                <span v-if="column.type.limit && getValue(item, column).length >  column.type.limit">...</span>
              </div>
              <span class="simple-text-cell" v-if="!column.type && item !== editItem" :title="getTooltip(item, column)">{{ getValue(item, column) }}</span>
            </td>
          </tr>
        </template>
        <template>
          <tr v-if="aggregationColumns.length">
            <td
               v-for="(column, index) of columns"
              :key="index"
              class="aggregation"
            >
              <span class="simple-text-cell">{{index === 0 ? 'Всего:' : getAggregationValue(column) }}</span>
            </td>
          </tr>
        </template>
          <tr v-if="aggregation && Object.values(aggregation).length && items.length" >
            <td :align="column.textAlign"
              v-for="(column, index) of columns" :key="index"
              class="aggregation-row-column"
            >
              <div v-if="index === 0 && aggregationName"> {{ aggregationName }} </div>
              <span
                v-if="aggregation[column.field]"
              > {{ aggregation[column.field] }}
              </span>
            </td>
          </tr>
          <tr v-if="items.length === 0">
            <td :colspan="columns.length" class="no-data-cell-placeholder"></td>
            <!-- <td v-for="(column, columnIndex) of columns"
              :key="columnIndex"></td> -->
          </tr>
        </tbody>
    </table>
    <div class="no-data-tooltip-container" v-if="items.length === 0">
      <div class="no-data-tooltip">
      {{ noDataTooltip }}
      </div>
    </div>
  </div>
</template>

<script>
import moment from 'moment'
import _get from 'lodash/get'
import _set from 'lodash/set'
import DataTableInput from './DataTableInput'
import DataTableDateInput from './DataTableDateInput'
import DataTableNumberInput from './DataTableNumberInput'
import DataTableCheckbox from './DataTableCheckbox'
import DataTableBinaryImage from './DataTableBinaryImage'
import DataTableBase64Image from './DataTableBase64Image'
import DataTableUniversalSelectInput from './DataTableUniversalSelectInput'
import DataTableToolbarColumn from './DataTableToolbarColumn'
import DataTableCreateToolbar from './DataTableCreateToolbar'
import DataTableCoordinateInput from './DataTableCoordinateInput'
import DataTableCoordinateInputWithBtn from './DataTableCoordinateInputWithBtn'
import DataTableIcon from './DataTableIcon'

export default {
  components: {
    DataTableInput,
    DataTableNumberInput,
    DataTableCheckbox,
    DataTableDateInput,
    DataTableBinaryImage,
    DataTableBase64Image,
    DataTableUniversalSelectInput,
    DataTableToolbarColumn,
    DataTableCreateToolbar,
    DataTableCoordinateInput,
    DataTableCoordinateInputWithBtn,
    DataTableIcon
  },
  props: {
    disabledToolbarBtn: Boolean,
    aggregationColumns: Array,
    borderClass: Boolean,
    universalSelectInputOptions: Object,
    editItem: Object,
    createItem: Object,
    mode: String,
    itemsForCreate: Array,
    canSelectCallback: {
      type: Function
    },
    selectable: Boolean,
    value: Object,
    columns: Array,
    items: Array,
    aggregation: Object,
    aggregationName: String,
    readonly: {
      type: Boolean,
      default: false
    },
    stopProp: {
      type: Boolean,
      default: false
    },
    noDataTooltip: {
      type: String,
      default: 'Нет данных'
    }
  },
  data () {
    return {
      isChange: false,
      isCreateChange: false,
      selected: null
    }
  },
  computed: {
    rowClass () {
      if (!this.selectable) {
        return null
      }

      return {
        'row-hoverable': true
      }
    },
    tableClass () {
      if (!this.items) {
        return null
      }

      return {
        'no-rows-table': !this.items.length
      }
    }
  },
  watch: {
    value (newValue) {
      this.selected = newValue
    },
    isCreateChange (newValue) {
      this.$emit('unsavedChanges', !newValue)
    },
    isChange (newValue) {
      this.$emit('unsavedChanges', !newValue)
    }
  },
  mounted () {
    this.$el.addEventListener('scroll', this.onScroll)
  },
  destroyed () {
    this.$el.removeEventListener('scroll', this.onScroll)
  },
  methods: {
    getCoordinatesForCreate () {
      this.isCreateChange = true
      this.$emit('onGetCoordinates')
    },
    getCoordinatesForEdit () {
      this.isChange = true
      this.$emit('onGetCoordinates')
    },
    getUniversalSelectInputValue (valueObject, valueField, item) {
      return item[valueObject][valueField]
    },
    getUniversalSelectInputValueForCreatedMode (valueObject, valueField) {
      return this.createItem[valueObject][valueField]
    },
    editItemGo (item) {
      this.$emit('editItemGo', item)
    },
    saveEditItemGo (item) {
      this.isChange = false
      this.$emit('saveEditItemGo', item)
    },
    cancelEditGo (item) {
      this.isChange = false
      this.$emit('cancelEditGo', item)
    },
    deleteItemGo (item) {
      this.$emit('deleteItemGo', item)
    },
    saveCreateGo () {
      this.isCreateChange = false
      this.$emit('saveCreateGo')
    },
    cancelCreateGo (item) {
      this.isCreateChange = false
      this.$emit('cancelCreateGo', item)
    },
    setBusy (isBusy) {
      this.blockUI(this.$el, isBusy)
    },
    onScroll (event) {
      this.$emit('scrollLeft', event.target.scrollLeft)
    },
    async onSelect (item) {
      if (this.selected === item) {
        return
      }

      if (await this.canSelectCallback()) {
        this.selected = item
        this.$emit('select', item)
      }
    },
    getRawValue (item, column) {
      return _get(item, column.field, '')
    },
    getRawValueForCreateMode (itemForCreate) {
      return this.createItem[itemForCreate.field] || itemForCreate.defaultValue
    },
    getValue (item, column) {
      // Формат передачи значений справочников:
      // column.displayField = "611e62c9-7f3c-4990-a95a-79840f2508e0"
      // column.displayValue = "name"
      //
      // Описание колонки:
      // {
      //   "title": "Тип территориальной единицы",
      //   "id": "611e62c9-7f3c-4990-a95a-79840f2508e0",
      // }
      //
      // Значение:
      // {
      //   "type_territorial_unit_id": "d0e77ba9-203b-4924-92ec-0f4d5018fe32",
      //   "611e62c9-7f3c-4990-a95a-79840f2508e0": {
      //     "name": "Муниципальный район"
      //   }
      // }
      if (column.displayField && column.displayValue && item[column.displayField]) {
        return item[column.displayField][column.displayValue]
      }
      const columnValue = _get(item, column.field, '')
      if (column.dateFormat) {
        if (!column.field) {
          return ''
        }
        const parsedDate = column.dateFormat === 'date' ? moment(columnValue, ['YYYY-MM-DD', moment.ISO_8601]) : moment(columnValue)
        if (parsedDate.isValid()) {
          if (column.dateFormat === 'date') {
            return column.displayFormat ? parsedDate.format(column.displayFormat) : parsedDate.format('DD.MM.YYYY')
          }
          if (column.dateFormat === 'datetime') {
            return column.displayFormat ? parsedDate.format(column.displayFormat) : parsedDate.format('DD.MM.YYYY HH:mm:SS')
          }
          return parsedDate.format(column.dateFormat)
        }
      }
      if (column.render) {
        return column.render(columnValue, item)
      }
      return columnValue
    },
    getLinkList (links, maxCount) {
      if (maxCount) {
        return links.slice(0, maxCount)
      }

      return links
    },
    getLinkValue (link, field) {
      return _get(link, field, '')
    },
    isLinkDisabled (item, column) {
      return column.type.isDisabled ? column.type.isDisabled(item, column) : false
    },
    getTooltip (item, column) {
      if (!column.tooltipFunc) {
        return this.getValue(item, column)
      }

      return column.tooltipFunc(item, column)
    },
    isValueRequired (item, column) {
      if (column.required) {
        return !this.getValue(item, column)
      }

      return false
    },
    getCellClass (item, column) {
      const cellClass = column.cellClass
      if (!cellClass) {
        if (column.class) {
          return {
            [column.class]: true,
            selected: this.selected === item && this.selectable,
            borders: !!this.borderClass
          }
        }
        return {
          selected: this.selected === item && this.selectable,
          borders: !!this.borderClass
        }
      }
      if (typeof cellClass === 'string') {
        return cellClass
      }
      const classes = {
        ...cellClass(item, column),
        selected: this.selected === item && this.selectable,
        borders: !!this.borderClass
      }
      return classes
    },
    setNewValue (item, column, newValue) {
      _set(item, column.field, newValue)
      // TODO передать колбэк в объект колонки, аттрибут type(onClick)
      this.changingValue(item)
    },
    getLookupValues (lookupSource, item) {
      if (Array.isArray(lookupSource)) {
        return lookupSource
      }
      return lookupSource(item)
    },
    isLookupVisible (lookupSource, item) {
      return this.getLookupValues(lookupSource, item).length
    },
    isDisabled (item, column) {
      if (!column.isDisabled) {
        return false
      }
      return column.isDisabled(item, column)
    },
    changingValue (newValue) {
      this.$emit('changingValue', newValue)
    },
    changingLookupValue (item, column, newValue) {
      if (column.type.onLookupValueChanged) {
        column.type.onLookupValueChanged(item, column, newValue)
      }
      this.$emit('changingValue', newValue)
    },
    inputUniversalSelected (valueObject, valueField, item, newValue) {
      this.isChange = true
      this.$emit('inputUniversalSelected', {
        valueObject,
        valueField,
        item,
        newValue
      })
    },
    inputUniversalForCreateSelected (valueObject, valueField, newValue) {
      this.isCreateChange = true
      this.$emit('inputUniversalForCreateSelected', {
        valueObject,
        valueField,
        newValue
      })
    },
    setNewEditValue (item, column, newValue) {
      this.isChange = true
      this.$emit('setNewEditValue', {
        item,
        column,
        newValue
      })
    },
    changingLookupValueForUpdate (item, column, newValue) {
      this.isChange = true
      this.$emit('setNewEditValue', {
        item,
        column,
        newValue
      })
    },
    setNewValueForCreate (itemForCreate, newValue) {
      this.isCreateChange = true
      this.$emit('setNewValueForCreate', {
        itemForCreate,
        newValue
      })
    },
    changingLookupValueForCreate (itemForCreate, newValue) {
      this.isCreateChange = true
      this.$emit('setNewValueForCreate', {
        itemForCreate,
        newValue
      })
    },
    getAggregationValue (column) {
      const isAggregationColumn = !!this.aggregationColumns.find(x => x === column.field)
      if (!isAggregationColumn) {
        return null
      }

      let sumValue = 0
      for (const item of this.items) {
        let targetFieldValue = item[column.field]
        if (!targetFieldValue) {
          targetFieldValue = 0
        }
        sumValue = sumValue + parseFloat(targetFieldValue)
        sumValue = parseFloat(sumValue.toFixed(4))
      }

      return sumValue
    }
  }
}
</script>

<style lang="stylus" scoped>

</style>
<style scoped>
.has-warning {
  border: 1px solid red;
}
.borders {
  border: 0.5px solid #bbb;
  border-collapse: collapse;
}
.dt-body {
  flex: 1 1 0;
  /* В IE не оторажаются элементы без этих свойств */
  /* https://github.com/philipwalton/flexbugs#flexbug-1 */
  -ms-flex-preferred-size: 0px;
  -ms-flex-negative: 0;
  /* !!! Закоментировано, так как overflow поменян на auto  */
  /* Для предотвращения смещения заголовков */
  /* overflow-y: scroll; */
  overflow: auto;
  /* WORKAROUND в IE11 без указания высоты flex элемент не сжимается по высоте */
  height: 250px;
  border-bottom: 1px solid #bbb;
}
.dt-body table {
  table-layout: fixed;
  border-top: none;
  border-collapse: collapse;
}
.dt-body table.no-rows-table {
  height: 100%;
}
.dt-body.no-rows-table {
  overflow-y: hidden;
  display: flex;
  flex-direction: column;
}
.dt-body div.no-data-tooltip-container {
  flex: 1;
  width: 100%;
  display: flex;
  justify-content:center;
  align-content:center;
  flex-direction:column;
}
.dt-body .no-data-cell-placeholder {
  padding-bottom: 0px;
  padding-top: 1px;
}
.dt-body div.no-data-tooltip {
  text-align: center;
  margin: 10px;
  font-size: 15px;
  font-weight: bold;
}
.dt-header + .dt-body table {
  border-top: 1px solid #ddd;
}
.dt-body tbody > tr.selected {
  background-color: #e3f2fd;
  color: #104d92;
}
.dt-body tr span {
  max-height: 4.8em;
  overflow: hidden;
  display: block;
}

.dt-body tr a {
  max-height: 4.8em;
  overflow: hidden;
  display: block;
}

.data-table-lookup-input .form-control {
  padding: 3px 10px !important;
  height: 30px !important
}
>>> .data-table-lookup-input .select2-selection.select2-selection--single {
  height: 30px;
  padding-top: 4px
}
td {
  word-break: break-word;
  text-align: left
}
.aggregation-row-column {
  border-top: 1.4px solid #000000;
  vertical-align: bottom;
}
.aggregation {
  border: 2.4px solid #000000;
  vertical-align: bottom;
}
.data-table-links-cell > a {
  display: block
}
@media (max-width: 425px) {
  .dt-body {
    min-height: 300px;
  }
}
</style>
