<template lang="pug">
div.grid-container(:style="{ maxHeight: maxHeight ? maxHeight : 'inherited', minHeight: minHeight ? minHeight : 'inherited' }")
  form.form-horizontal.settings-form
    fieldset
      div
        div.col-md-2.search-field
          span Поиск
          input.form-control(type="text" v-on:keydown.enter.prevent="stub" v-model="filter")
    div.separator
    slot
  div.table_container.separator
    div(:style="{ width: (fullWidth + columnPoints) }")
      table.table-headers
        thead
          tr
            th.table-header-cell(v-for="column in columns" :style="{ 'width': column.width + columnPoints }" @click.capture="sortColumn(column)")
              span(:title="column.title") {{ column.title }}
              span.separator
              div.sorting-icons
                i.icon_small_arrow_up(v-if="columnSorted(column, !sortingDescending)")
                i.icon_small_arrow_down(v-if="columnSorted(column, sortingDescending)")
      div.table-responsive.pre-scrollable
        table.table-cells(:style="{ width: fullWidth + columnPoints }")
          tbody
            tr(v-for="item in pageItems" :class="{ 'selected-row': item === selectedItem }" @click.stop.prevent="selectItem(item)")
              td(v-for="column in columns" :style="{ 'width': column.width  + columnPoints }")
                span(v-if="!column.valueFormat") {{ getColumnValue(item, column.key) }}
                span(v-if="column.valueFormat") {{ column.valueFormat(getColumnValue(item, column.key),item) }}
      div.table-responsive.pre-scrollable.footer-table(v-if="footer")
        table.table-cells(:style="{ width: fullWidth + columnPoints }")
          tbody
            tr(v-for="item in footer" :class="{ 'selected-row': item === selectedItem }")
              td(v-for="column in columns" :style="{ 'width': column.width  + columnPoints }")
                span(v-if="!column.valueFormat") {{ getColumnValue(item, column.key) }}
                span(v-if="column.valueFormat") {{ column.valueFormat(getColumnValue(item, column.key),item) }}
  div.pagination-container
    div.pagination-info
      span Страница {{ currentPage }} из {{ countPages }} всего {{ countItems }} записей
    div.separator
    div
      button.paginate_button.previous(:class="{disabled: currentPage <= 1}" :disabled="currentPage <= 1" @click.stop.prevent="loadPage(currentPage - 1)")
        span ←
      button.paginate_button(
        v-for="pageIndex in paginatePages"
        :class="{ current: pageIndex === currentPage }"
        @click.stop.prevent="loadPage(pageIndex)"
        :disabled="pageIndex === currentPage")
        span {{ pageIndex }}
      button.paginate_button.next(:class="{disabled: currentPage >= countPages}" :disabled="currentPage >= countPages" @click.stop.prevent="loadPage(currentPage + 1)")
        span →
</template>

<script>
import axios from 'axios'
import _get from 'lodash/get'
import _minBy from 'lodash/minBy'
import _sumBy from 'lodash/sumBy'
import _meanBy from 'lodash/meanBy'
import _orderBy from 'lodash/orderBy'
import _isString from 'lodash/isString'
import _isArray from 'lodash/isArray'

export default {
  props: [
    'columns',
    'source',
    'points',
    'maxHeight',
    'minHeight',
    'permanentFilters',
    'metadata',
    'options',
    'defaultFilter'
  ],
  data () {
    return {
      pageItems: [],
      pageSize: 5,
      pageSizes: [5, 10, 15],
      currentPage: 0,
      countItems: 0,
      selectedItem: null,
      paginatePages: [],
      filter: this.defaultFilter,
      sortingColumn: null,
      sortingDescending: false,
      columnPoints: 'px',
      footer: null
    }
  },
  watch: {
    async 'options.footerAggregation' (newValue) {
      this.reset()
      await this.loadPage(1)
    },
    // дублируем загрузку страницы для случая когда колонки приехали после выполнения mounted
    async columns (newValue) {
      if (newValue) {
        this.reset()
        await this.loadPage(1)
      }
    },
    async filter (newValue) {
      this.reset()
      await this.loadPage(1)
    },
    async source (newValue) {
      if (newValue) {
        await this.loadPage(1)
      }
    },
    points (newValue) {
      this.columnPoints = this.points
    }
  },
  async mounted () {
    if (this.points) {
      this.columnPoints = this.points
    }
    if (this.columns && this.currentPage === 0 && this.source) {
      await this.loadPage(1)
    }
  },
  computed: {
    countPages () {
      return Math.ceil(this.countItems / this.pageSize)
    },
    fullWidth () {
      if (!this.columns || this.columns.length === 0) {
        return 500 // TODO: Сделать что-то посерьезней
      }
      var result = this.columns
        .map(a => a.width)
        .reduce((left, right) => {
          return left + right
        })
      return result
    }
  },
  methods: {
    // Предотвращает нажатие Enter
    // TODO не использовать форму
    stub () {
    },
    onSettingsChanged () {
      const settings = {
        currentPage: this.currentPage,
        filter: this.filter,
        sortingColumn: this.sortingColumn,
        sortingDescending: this.sortingDescending
      }
      this.$emit('settingsChanged', settings)
    },
    getColumnValue (item, columnKey) {
      return _get(item, columnKey)
    },
    columnSorted (column, condition) {
      if (this.sortingColumn !== column) {
        return true
      }
      return condition
    },
    async sortColumn (column) {
      const isAlreadySorted = column === this.sortingColumn
      if (!isAlreadySorted) {
        this.sortingColumn = column
        this.sortingDescending = false
      } else {
        this.sortingDescending = !this.sortingDescending
      }
      await this.loadPage(1)
    },
    async reloadData () {
      this.reset()
      await this.loadPage(1)
    },
    async reloadCurrentPage () {
      await this.loadPage(this.currentPage)
    },
    reset () {
      this.pageItems = []
      this.sortingColumn = null
      this.sortingDescending = false
      this.paginatePages = []
      this.currentPage = 0
      this.countItems = 0
      this.selectItem(null)
    },
    getAggregatiton (propertyName) {
      switch (this.options.footerAggregation) {
        case 'min':
          return _minBy(this.source, a => a[propertyName] || 0)[propertyName]
        case 'sum':
          return _sumBy(this.source, a => a[propertyName] || 0)
        case 'count':
          return this.source.length
        case 'average':
          return _meanBy(this.source, a => a[propertyName] || 0)
        default:
          return ''
      }
    },
    setupArraySource (number) {
      const offset = (number - 1) * this.pageSize
      let fullItems = this.source
      if (this.filter) {
        const textFields = this.columns.filter(column => column.dataType === 'text').map(a => a.key)
        fullItems = fullItems.filter(a => {
          for (let textField of textFields) {
            if (a[textField] && a[textField].indexOf(this.filter) !== -1) {
              return true
            }
          }
          return false
        })
      }
      if (this.sortingColumn) {
        fullItems = _orderBy(fullItems, [this.sortingColumn.key], [this.sortingDescending ? 'desc' : 'asc'])
      }
      const result = {
        rows: fullItems.slice(offset, offset + this.pageSize),
        count: this.source.length
      }
      if (result.rows.length > 0 && this.options && this.options.footerAggregation) {
        const footerRow = {}
        const properties = Object.keys(result.rows[0]).filter(a => a.indexOf('indicator') > -1)
        properties.forEach(a => {
          footerRow[a] = this.getAggregatiton(a)
        })
        result.footer = [footerRow]
      }
      return result
    },
    async loadPage (number) {
      if (!this.source) {
        return
      }
      let result
      if (_isString(this.source)) {
        const response = await axios.post(this.source, {
          page: number,
          pageSize: this.pageSize,
          filter: this.filter,
          sortingColumn: this.sortingColumn ? this.sortingColumn.key : null,
          sortingDescending: this.sortingDescending,
          filters: this.permanentFilters,
          metadata: this.metadata
        })
        result = response.data
      } else if (_isArray(this.source)) {
        result = this.setupArraySource(number)
      }
      this.pageItems = result.rows
      this.footer = result.footer
      this.countItems = result.count
      var paginatePages = []
      if (number > 1) {
        paginatePages.push(number - 1)
      }
      paginatePages.push(number)
      if (number < this.countPages) {
        paginatePages.push(number + 1)
      }
      this.paginatePages = paginatePages
      this.currentPage = number
      this.selectItem(null)
      this.onSettingsChanged()
    },
    selectItem (item) {
      this.selectedItem = item
      this.$emit('input', item)
      this.$emit('selected', item)
    }
  }
}
</script>

<style lang="stylus" scoped>
.footer-table
  margin-top 3px
  table
    border-color black
    border-top-style solid !important
    border-top 2px
.table-cells
  td
    word-break break-all
.grid-container
  display flex
  flex-direction column
  height 100%
.settings-form
  display flex
  align-items center
  padding 8px 4px
.separator
  flex 1
.table-headers tr
  display flex
.table-header-cell
  content ''
  top 50%
  right 20px
  margin-top -6px
  display inline-block
  line-height 1
  -webkit-font-smoothing antialiased
  display flex
  align-items center
  flex-direction row
  cursor pointer
  word-break break-all
  max-height 54px
  overflow-y hidden
.table-headers
  border-top 1px solid #bbb
  border-bottom 0px solid #bbb
.search-field
  display inline-flex
  align-items center
  span
    margin-left 5px
    margin-right 5px
  input
    margin 3px
    min-width 130px
.pagination-container
  padding 20px
  display flex
  align-items center
  .separator
    flex 1
.table
  user-select none
  tbody tr td
    cursor pointer
.pagination-info
  user-select none
.table_container
  overflow-y auto
  overflow-x auto
  border-bottom 1px solid #bbb
.pre-scrollable
  overflow-x hidden
  overflow-y auto
.selected-row
  background-color rgba(163, 163, 194, 50)
.sorting-icons
  color #999999
  display flex
  justify-items center
  flex-direction column
  font-family 'gprime'
  margin-bottom -2px
  margin-left 6px
  i
    font-size 12px
.table-cells > thead > tr > th, .table-cells > tbody > tr > th, .table-cells > tfoot > tr > th, .table-cells > thead > tr > td, .table-cells > tbody > tr > td, .table-cells > tfoot > tr > td
  vertical-align middle
  padding 7px 20px
  line-height 1.5384616
  border-top 1px solid #ddd
  cursor pointer
.table-headers > thead > tr > th, .table-headers > tbody > tr > th, .table-headers > tfoot > tr > th, .table-headers > thead > tr > td, .table-headers > tbody > tr > td, .table-headers > tfoot > tr > td
  vertical-align middle
  padding 10px 20px
  line-height 1.5384616
  border-top 1px solid #ddd
  cursor pointer
.table-headers
  width 100%
</style>

<style>
.dataTables_paginate {
  float: right;
  text-align: right;
  margin: 0 0 20px 20px;
}
.paginate_button {
  display: inline-block;
  padding: 7px 12px;
  min-width: 36px;
  margin-left: 2px;
  text-align: center;
  text-decoration: none;
  cursor: pointer;
  color: #333333;
  border: 1px solid transparent;
  border-radius: 3px;
  user-select: none;
}
.paginate_button:first-child {
  margin-left: 0;
}
.paginate_button {
  background: transparent;
}
.paginate_button:hover,
.paginate_button:focus {
  background-color: #f5f5f5;
}
.paginate_button.current,
.paginate_button.current:hover,
.paginate_button.current:focus {
  color: #fff;
  background-color: #455A64;
}
.paginate_button.disabled,
.paginate_button.disabled:hover,
.paginate_button.disabled:focus {
  cursor: default;
  background-color: transparent;
  color: #bbb;
}
.paginate-left {
  float: left;
}
.paging_simple .paginate_button:hover,
.paging_simple .paginate_button:focus {
  color: #fff;
  background-color: #455A64;
}
</style>