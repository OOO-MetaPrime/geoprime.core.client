<template>
  <data-table
    :readonly="readonly"
    :count="count"
    :items="itemsModel"
    :pagable="pagable"
    :stopProp="stopProp"
    v-bind="$attrs"
    :value="value"
    @input="$emit('input', $event)"
    @itemSelected="$emit('itemSelected', $event)"
    @selectfilter="onSelectAll"
    v-on="$listeners"
    @change="onFiltersChanged"
    @changingValue="$emit('changingValue',$event)"
    ref="dataTable"
    :hasError="hasError"
  />
</template>

<script>
import _set from 'lodash/set'
import { filter, sort, offset } from '^/components/DataTable/helpers'

export default {
  inheritAttrs: false,
  props: {
    items: Array,
    value: Object,
    initialParams: Object,
    readonly: {
      type: Boolean,
      default: false
    },
    pagable: {
      type: Boolean,
      default: true
    },
    stopProp: {
      type: Boolean,
      default: false
    },
    hasError: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      itemsModel: this.items,
      filteredItems: this.items,
      filters: {
        filters: [],
        sorting: [],
        page: 1,
        size: 10
      }
    }
  },
  watch: {
    items: {
      immediate: true,
      handler (newValue, oldValue) {
        this.itemsModel = newValue
        this.filters.page = 1
        this.setFilters()
        if (newValue && oldValue) {
          this.$refs.dataTable.resetPage()
        }
      }
    },
    initialParams: {
      immediate: true,
      handler (newValue) {
        this.setFilters(this.initialParams)
      }
    }
  },
  computed: {
    count () {
      return this.filteredItems.length
    }
  },
  methods: {
    setBusy (isBusy) {
      this.$refs.dataTable.setBusy(isBusy)
    },
    setFilters (filters) {
      if (filters) {
        this.filters = Object.assign({}, this.filters, filters)
      }
      const sorted = filter(this.items, this.filters.filters)
      this.filteredItems = sort(sorted, this.filters.sorting, this.$attrs.columns)
      this.$emit('filtered', this.filteredItems)
      this.itemsModel = this.pagable ? offset(this.filteredItems, this.filters) : this.filteredItems
    },
    getFilters (filters) {
      return this.$refs.dataTable.getFiltersParams()
    },
    onSelectAll (newValue) {
      if (this.$listeners.selectfilter) {
        this.$emit('selectfilter', newValue)
      } else {
        const selectAllColumn = this.$attrs.columns.find(x => x.type === 'checkbox')
        for (const item of this.itemsModel) {
          _set(item, selectAllColumn.field, newValue)
        }
      }
    },
    getFilteredItems () {
      return this.itemsModel
    },
    onFiltersChanged (filters) {
      this.setFilters(filters)
      this.$emit('onFilterItems', this.itemsModel)
    }
  }
}
</script>
