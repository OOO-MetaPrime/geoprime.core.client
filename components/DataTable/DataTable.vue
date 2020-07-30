<template>
  <div class="dt-table" :class="tableClass">
    <data-table-header
      :sorting="sorting"
      @change="onChange"
      @selectfilter="$emit('selectfilter', $event)"
      ref="header"
      :canSelectAll="canSelectAll"
      :isSortingDisabled="isSortingDisabled"
    />
    <data-table-filters
      :filters="filters"
      @filter="onFilter"
      ref="filters"
      v-if="filterable"
      :isFiltersDisabled="isFiltersDisabled"
    />
    <data-table-body
      :itemsForCreate="itemsForCreate"
      :canSelectCallback="canSelectCallback"
      :columns="calculatedColumns"
      :readonly="readonly"
      :items="items"
      :aggregationName="aggregationName"
      :aggregation="aggregation"
      :selectable="selectable"
      :stopProp="stopProp"
      :noDataTooltip="noDataTooltip"
      v-model="value"
      @scrollLeft="onScrollLeft"
      @select="onSelect"
      @unsavedChanges="$emit('unsavedChanges', $event)"
      @changingValue="$emit('changingValue', $event)"
      @lookupValueSelected="$emit('lookupValueSelected', $event)"
      @inputUniversalSelected="$emit('inputUniversalSelected', $event)"
      @inputUniversalForCreateSelected="$emit('inputUniversalForCreateSelected', $event)"
      @setNewEditValue="$emit('setNewEditValue', $event)"
      @setNewValueForCreate="$emit('setNewValueForCreate', $event)"
      ref="tableBody"
      :mode="mode"
      @editItemGo="$emit('editItemGo', $event)"
      @saveEditItemGo="$emit('saveEditItemGo', $event)"
      @cancelEditGo="$emit('cancelEditGo', $event)"
      @deleteItemGo="$emit('deleteItemGo', $event)"
      @cancelCreateGo="$emit('cancelCreateGo', $event)"
      @saveCreateGo="$emit('saveCreateGo')"
      @onGetCoordinates="$emit('onGetCoordinates')"
      :editItem="editItem"
      :createItem="createItem"
      :universalSelectInputOptions="universalSelectInputOptions"
      :borderClass="borderClass"
      :aggregationColumns="aggregationColumns"
      :disabledToolbarBtn="disabledToolbarBtn"
    />
    <data-table-footer
      :count="count"
      :page="page"
      :pageSize="size"
      @change="onPage"
      v-if="pagable"
    />
  </div>
</template>

<script>
import DataTableHeader from './DataTableHeader'
import DataTableFilters from './DataTableFilters'
import DataTableBody from './DataTableBody'
import DataTableFooter from './DataTableFooter'

export default {
  props: {
    disabledToolbarBtn: {
      type: Boolean,
      default: false
    },
    aggregationColumns: {
      type: Array,
      default: function () {
        return []
      }
    },
    borderClass: {
      type: Boolean,
      default: false
    },
    isFiltersDisabled: {
      type: Boolean,
      default: false
    },
    isSortingDisabled: {
      type: Boolean,
      default: false
    },
    universalSelectInputOptions: {
      type: Object,
      default: function () {
        return {}
      }
    },
    editItem: {
      type: Object,
      default: function () {
        return {}
      }
    },
    createItem: {
      type: Object,
      default: function () {
        return {}
      }
    },
    mode: {
      type: String,
      default: ''
    },
    itemsForCreate: {
      type: Array,
      default: function () {
        return []
      }
    },
    canSelectCallback: {
      type: Function,
      default: function () {
        return true
      }
    },
    columns: Array,
    items: {
      type: Array,
      required: true
    },
    readonly: {
      type: Boolean,
      default: false
    },
    count: Number,
    sortable: Boolean,
    filterable: Boolean,
    value: Object,
    pagable: Boolean,
    selectable: Boolean,
    // aggregation - объект со свойствами названиями полей (field) колонок
    // и соответствующим агрегирующим значением
    aggregation: Object,
    aggregationName: {
      type: String,
      default: ''
    },
    stopProp: {
      type: Boolean,
      default: false
    },
    noDataTooltip: {
      type: String
    },
    canSelectAll: {
      type: Boolean,
      default: true
    },
    hasError: {
      type: Boolean,
      default: false
    },
    selectedTerritoryCode: {
      type: String,
      default: ''
    },
    tableToTheFirstPage: Array
  },
  components: {
    DataTableHeader,
    DataTableFilters,
    DataTableBody,
    DataTableFooter
  },
  data () {
    return {
      sorting: [],
      filters: [],
      page: 1,
      size: 10
    }
  },
  watch: {
    columns: 'resetFilters',
    items (newValue) {
      if (this.$refs.header) {
        this.$refs.header.clearSelection()
      }
    },
    // Проп из IsogdDocumentsList, по его изменению возвращаемся на первую страницу
    tableToTheFirstPage () {
      this.onPage({ page: 1, size: this.size })
    }
  },
  computed: {
    tableClass () {
      return {
        'has-err': this.hasError
      }
    },
    calculatedColumns () {
      if (!this.columns || !this.columns.length) {
        return []
      }

      return this.columns.map(x => ({
        calculatedWidth: this.calculateColumnWidth(x),
        textAlign: this.getColumnTextAlign(x),
        ...x
      }))
    }
  },
  created () {
    this.setupColumns()
  },
  methods: {
    setBusy (isBusy) {
      this.$refs.tableBody.setBusy(isBusy)
    },
    onScrollLeft (offset) {
      this.$refs.header.scrollLeft(offset)
      if (this.$refs.filters) {
        this.$refs.filters.scrollLeft(offset)
      }
    },
    invertDirection (direction) {
      if (!direction) {
        return direction
      }

      return direction.toLowerCase() === 'asc' ? 'desc' : 'asc'
    },
    onChange () {
      this.$emit('change', this.getFiltersParams())
    },
    getFiltersParams () {
      return {
        sorting: this.sorting
          .filter(x => x.direction)
          .map(x => ({
            field: x.column.sortingField || x.column.field,
            direction: x.column.invertedSort ? this.invertDirection(x.direction) : x.direction
          })),
        filters: this.filters
          .filter(x => (x.value != null && x.value !== '') || x.hideEmpty)
          .map(x => ({
            field: x.column.filterField || x.column.field,
            value: x.value,
            hideEmpty: x.hideEmpty,
            operator: x.operator,
            type: x.type
          })),
        page: this.page,
        size: this.size
      }
    },
    onFilter () {
      this.resetPage()
      this.onChange()
    },
    onPage ({ page, size }) {
      this.page = page
      this.size = size
      this.onChange()
    },
    onSelect (item) {
      this.$emit('input', item)
      this.$emit('itemSelected', item)
    },
    resetPage () {
      this.page = 1
    },
    refresh () {
      this.onChange()
    },
    adaptFilters (newFilters) {
      this.sorting.forEach(sort => {
        const newSort = newFilters.sorting.find(x => x.field === sort.column.sortingField || x.field === sort.column.field)
        if (newSort) {
          sort.direction = newSort.direction
        }
      })
      this.filters.forEach(filter => {
        const newFilter = newFilters.filters.find(x => x.field === filter.column.filterField || x.field === filter.column.field)
        if (newFilter) {
          filter.value = newFilter.value
          filter.operator = newFilter.operator
          filter.type = newFilter.type
        } else {
          filter.value = null
        }
      })
      this.page = newFilters.page
      this.size = newFilters.size
    },
    calculateColumnWidth (column) {
      if (column.width) {
        return column.width
      }
      if (column.displayAs) {
        switch (column.displayAs) {
          case 'date':
          case 'input':
            return this.getColumnWidthFromStringLength(column.title, 100, 150) + 'px'
          case 'datetime':
            return this.getColumnWidthFromStringLength(column.title, 100, 170) + 'px'
          case 'number':
            return this.getColumnWidthFromStringLength(column.title, 170, 180) + 'px'
        }
      }
      return this.getColumnWidthFromStringLength(column.title) + 'px'
    },
    getColumnTextAlign (column) {
      if (column.displayAs) {
        switch (column.displayAs) {
          case 'date':
          case 'input':
          case 'datetime':
            return 'center'
          case 'number':
            return 'right'
        }
      }
      return 'left'
    },
    getColumnWidthFromStringLength (str, minWidth = 150, maxWidth = 200) {
      const widthMultiplier = 10
      const widthAddingNumber = 20
      let width = str.length * widthMultiplier + widthAddingNumber

      if (width < minWidth) {
        width = minWidth
      }
      if (width > maxWidth) {
        width = maxWidth
      }
      return width
    },
    setupColumns () {
      this.sorting = this.columns.map(x => ({
        column: x,
        calculatedWidth: this.calculateColumnWidth(x),
        direction: x.sortDirection || null,
        selectable: x.type === 'checkbox',
        sortable: x.sortable === false ? false : this.sortable
      }))
      this.filters = this.columns.map(x => ({
        column: x,
        calculatedWidth: this.calculateColumnWidth(x),
        value: x.filter ? x.filter.value : null,
        hideEmpty: x.filter ? x.filter.hideEmpty : false,
        hideFilterSearch: x.filter ? x.filter.hideFilterSearch : false,
        filterable: x.filterable === false ? false : this.filterable,
        operator: x.filter && x.filter.operator ? x.filter.operator : 'ilike',
        type: x.filter ? x.filter.type : null,
        source: x.filter ? this.getLookupValues(x.filter.source) : null,
        isInteger: x.filter ? x.filter.isInteger : false
      }))
    },
    getLookupValues (lookupSource) {
      if (lookupSource == null) {
        return null
      }
      if (Array.isArray(lookupSource)) {
        return lookupSource
      }
      return lookupSource()
    },
    resetFilters (newValue, oldValue) {
      this.setupColumns()
      this.page = 1
      if (oldValue.length && newValue.length) {
        this.onChange()
      }
    }
  }
}
</script>

<style scoped>
.dt-table {
  display: flex;
  flex-direction: column;
}
.dt-table.has-err {
  border: 1px solid #D84315;
  border-radius: 3px;
}
div.modal-dialog .modal-body > .dt-table {
  min-height: 500px;
  height: 500px;
}
div.modal-dialog.modal-lg .modal-body > .dt-table {
  min-height: 460px;
  height: 460px;
}
@media (min-height: 700px) {
  div.modal-dialog.modal-lg .modal-body > .dt-table {
    min-height: 560px;
    height: 560px;
  }
}
@media (min-height: 800px) {
  div.modal-dialog.modal-lg .modal-body > .dt-table {
    min-height: 660px;
    height: 660px;
  }
}
@media (min-height: 900px) {
  div.modal-dialog.modal-lg .modal-body > .dt-table {
    min-height: 760px;
    height: 760px;
  }
}
</style>
