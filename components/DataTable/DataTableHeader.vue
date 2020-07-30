<template>
  <div class="dt-header">
    <div ref="scroll">
      <table class="table dataTable">
        <colgroup>
          <col
            v-for="(sort, index) of sorting" :key="index"
            :style="{ width: sort.calculatedWidth }"
          />
        </colgroup>
        <thead>
          <tr>
            <template v-for="(sort, index) of sorting">
              <th v-if="sort.sortable" height="4em" :key="index"
                :class="{ 'sorting': sort.direction === null, 'sorting_asc': sort.direction === 'asc', 'sorting_desc': sort.direction === 'desc' }"
                @click="onClick(sort)"
                :title="sort.column.title">
                <data-table-selection-header-cell v-if="canSelectAll && sort.selectable" @selectfilter="$emit('selectfilter', $event)" ref="selectionCell"/>
                <span v-else>
                  <div class="text-container">
                    <div class="text-wrapper">
                    {{ sort.column.title }}
                    </div>
                  </div>
                </span>
              </th>
              <th v-else :key="index" height="4em">
                <data-table-selection-header-cell v-if="canSelectAll && sort.selectable" @selectfilter="$emit('selectfilter', $event)" ref="selectionCell" />
                <span v-else>
                  <div class="text-container">
                    <div class="text-wrapper">
                    {{ sort.column.title }}
                    </div>
                  </div>
                </span>
              </th>
            </template>
          </tr>
        </thead>
      </table>
    </div>
  </div>
</template>

<script>
import DataTableSelectionHeaderCell from './DataTableSelectionHeaderCell'

export default {
  components: {
    DataTableSelectionHeaderCell
  },
  props: {
    isSortingDisabled: Boolean,
    sortable: Boolean,
    sorting: Array,
    canSelectAll: Boolean
  },
  methods: {
    scrollLeft (offset) {
      this.$refs.scroll.scrollLeft = offset
    },
    clearSelection () {
      if (this.$refs.selectionCell) {
        this.$refs.selectionCell[0].clear()
      }
    },
    onClick (sorting) {
      if (this.isSortingDisabled) {
        return false
      }
      // Одна активная сортировка
      // TODO Добавить опцию, реализовать мультисортировку
      this.sorting
        .filter(x => x !== sorting)
        .forEach(x => {
          x.direction = null
        })

      if (sorting.direction === null) {
        sorting.direction = 'asc'
      } else if (sorting.direction === 'asc') {
        sorting.direction = 'desc'
      } else if (sorting.direction === 'desc') {
        sorting.direction = null
      } else {
        throw new Error('Значение вне диапазона: direction.')
      }

      this.$emit('change')
    }
  }
}
</script>

<style scoped>
.dt-header {
  /* Ширина скроллбара */
  padding-right: 17px;
  overflow: hidden;
  border-bottom: 0px solid #ddd;
  border-top: 1px solid #ddd;
  min-height: 32px;
  flex: 0 0 auto;
}
.dt-header > div {
  overflow: hidden;
}
.dt-header table {
  table-layout: fixed;
}
.dt-header th {
  word-break: break-word;
}
.dt-header th span {
  height: 100%;
  display: block;
  overflow: hidden;
  padding-left: 2px;
}
.dt-header th span .text-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
}
.dt-header .table > thead > tr > th {
  border-bottom: none;
  border-top: none;
}
.panel-heading + .dt-table .dt-header .table > thead > tr > th {
  border-bottom: none;
  border-top: none;
}
.modal-body > .dt-table .dt-header .table > thead > tr > th {
  border-bottom: none;
  border-top: none;
}
.panel-heading + .dt-table .dt-header {
  border-top: none;
}
/* TODO Перенести класс dataTable */
</style>
