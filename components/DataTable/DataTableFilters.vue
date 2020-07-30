<template>
  <div class="dt-filters">
    <div ref="scroll">
      <table class="table">
        <colgroup>
          <col
            v-for="(filter, index) of filters"
            :key="index"
            :style="{ width: filter.calculatedWidth }"
          >
        </colgroup>
        <thead>
          <tr>
            <td v-for="(filter, index) of filters" :key="index" :class="getFilterCellClass(filter)">
              <component
                v-if="filter.filterable"
                :is="getFilterComponentName(filter)"
                :filter="filter"
                :operators="getFilterOperators(filter)"
                @filter="$emit('filter')"
                @selectfilter="$emit('selectfilter', $event)"
                :isLastIndex="index === lastFilterIndex"
                :isCorrectValidation="isValidFilter(filter)"
                :title="invalidFilterTooltip(filter)"
                :isFiltersDisabled="isFiltersDisabled"
              />
            </td>
          </tr>
        </thead>
      </table>
    </div>
  </div>
</template>

<script>
import DataTableTextFilter from './DataTableTextFilter'
import DataTableNumberFilter from './DataTableNumberFilter'
import DataTableLookupFilter from './DataTableLookupFilter'
import DataTableDateFilter from './DataTableDateFilter'
import DataTableAsyncLookupFilter from './DataTableAsyncLookupFilter'

import moment from 'moment'

export default {
  props: {
    isFiltersDisabled: Boolean,
    filters: Array
  },
  data () {
    return {
      operators: [{
        id: '=',
        name: '='
      }, {
        id: '>',
        name: '>'
      }, {
        id: '>=',
        name: '>='
      }, {
        id: '<',
        name: '<'
      }, {
        id: '<=',
        name: '<='
      }]
    }
  },
  components: {
    DataTableTextFilter,
    DataTableNumberFilter,
    DataTableLookupFilter,
    DataTableDateFilter,
    DataTableAsyncLookupFilter
  },
  computed: {
    lastFilterIndex () {
      return this.filters.length - 1
    }
  },
  methods: {
    getFilterComponentName (filter) {
      switch (filter.type) {
        case 'lookup': return 'DataTableLookupFilter'
        case 'number': return 'DataTableNumberFilter'
        case 'date': return 'DataTableDateFilter'
        case 'datetime': return 'DataTableDateFilter'
        case 'checkbox' : return null
        case 'asyncselect': return 'DataTableAsyncLookupFilter'
        default: return 'DataTableTextFilter'
      }
    },
    getFilterCellClass (filter) {
      switch (filter.type) {
        case 'lookup': return 'lookup-cell'
        case 'asyncselect': return 'lookup-cell'
        case 'number': return 'number-cell'
        case 'date': return 'date-cell'
        case 'datetime': return 'datetime-cell'
        default: return 'text-cell'
      }
    },
    getFilterOperators (filter) {
      switch (filter.type) {
        case 'date':
        case 'datetime':
          return this.operators
        default: return null
      }
    },
    scrollLeft (offset) {
      this.$refs.scroll.scrollLeft = offset
    },
    isInt (value) {
      var er = /^-?[0-9]+$/

      return er.test(value)
    },
    invalidFilterTooltip (filter) {
      if ((filter.type === 'date' || filter.type === 'datetime') && filter.value) {
        return !this.isValidFilter(filter) ? 'Введите корректную дату' : ''
      }
      if (filter.type === 'number' && filter.value) {
        return !this.isValidFilter(filter)
          ? (filter.isInteger ? 'Введите корректное целое число' : 'Введите корректное число')
          : ''
      }
    },
    isValidFilter (filter) {
      if ((filter.type === 'date' || filter.type === 'datetime') && filter.value) {
        const momentDate = moment(filter.value, ['DD.MM.YYYY', 'DD.MM.YY', 'DD.MM', 'DD-MM-YY'], true)
        return momentDate.isValid()
      }
      if (filter.type === 'number' && filter.value) {
        if (filter.isInteger) {
          if (!this.isInt(filter.value)) {
            return false
          }
          const parsedValue = parseInt(Number(filter.value))
          return !isNaN(parsedValue)
        } else if (!filter.isInteger) {
          const parsedValue = Number(filter.value)
          return !isNaN(parsedValue)
        }
      }
      return true
    }
  }
}
</script>

<style scoped>
.dt-filters {
  /* Ширина скроллбара */
  padding-right: 17px;
  overflow: hidden;
  border-bottom: 1px solid #ddd;
  min-height: 40px;
}
.dt-filters > div {
  overflow: hidden;
}
.dt-filters table {
  table-layout: fixed;
  border-top: 0px;
}
.dt-filters table > thead > tr > td {
  border-top: none;
  /* border-bottom: 1px solid #bbb; */
  padding-top: 1px;
}
.dt-filters table > thead > tr > td.lookup-cell{
  padding-top: 0px;
}
</style>
