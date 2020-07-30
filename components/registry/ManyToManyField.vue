<template lang="pug">
div.manytomany-container
  div.buttons-header(v-if="editable")
    ul.icons-list
      li
        a(@click.capture="showModal" title="Добавить" v-if="editable")
          i.icon_bigplus
      li(v-if="selectedItem")
        a(@click.capture="remove" title="Удалить" v-if="editable")
          i.icon_cross
  grid(
    :columns="columns"
    :source="visibleItems"
    v-model="selectedItem"
    :maxHeight="'400px'"
    :points="points"
    ref="valuesGrid")
  div.modal.fade(tabindex="-1" role="dialog" ref="selectModal" v-if="")
    div.modal-dialog.modal-lg.select-content(role="document")
      div.modal-content
        div.modal-header
          h4.modal-title Выберите запись
      div.modal-body
          grid(
            :columns="columns"
            :source="filteredClassifier"
            v-model="selectedForAdd"
            :maxHeight="'550px'"
            :points="points"
            ref="addGrid")
      div.modal-footer
        button.btn.btn-default(type="button" data-dismiss="modal")
          span Отмена
        button.btn.btn-primary(type="button" :disabled="!selectedForAdd" @click.stop.prevent="addItem") Добавить
</template>

<script>
import Grid from './Grid'
import $ from 'jquery'

export default {
  props: ['column', 'value', 'editable'],
  components: {
    Grid
  },
  data () {
    return {
      selectedItem: null,
      selectedForAdd: null,
      columns: [],
      tableData: null,
      items: [],
      allClassifier: [],
      filteredClassifier: [],
      visibleItems: [],
      points: 'px'
    }
  },
  watch: {
    value (newValue) {
      this.refreshVisibleItems()
      this.refreshFiltered()
    }
  },
  async mounted () {
    const tableData = await this.coreApi.classifier.getClassifierColumns(this.column.manyToManyTable, this.column.manyToManyColumn, this.column.manyToManyDisplayColumn)
    const isClassifier = tableData.columns.length === 1
    if (isClassifier) {
      this.points = '%'
      tableData.columns.forEach(a => {
        a.width = 100
      })
    } else {
      tableData.allcolumns = tableData.columns
      tableData.columns = tableData.columns.filter(a => a.isVisibleInGrid)
      tableData.columns
        .forEach(column => {
          column.width = 250
          if (column.isBoolean) {
            column.valueFormat = (value, item) => {
              if (value) {
                return 'Да'
              } else {
                return value === false ? 'Нет' : 'Не указано'
              }
            }
          }
          if (column.isHtml) {
            column.valueFormat = (value, item) => 'Текст HTML'
          }
          if (column.isClassifier) {
            const tableName = column.id
            column.valueFormat = function (value, item) {
              var belongTable = tableName in item ? item[tableName] : null
              if (!belongTable) {
                return ''
              }
              if (belongTable && column.foreignTableDisplayColumn in belongTable) {
                return belongTable[column.foreignTableDisplayColumn]
              }
              return ''
            }
          }
        })
    }
    this.tableData = tableData
    this.columns = this.tableData.columns
    if (tableData.columns.length === 1) {
      // Одно поле значит что это обычный классификатор
      let allItems = await this.coreApi.classifier.getClassifier({
        tableName: this.column.manyToManyTable,
        keyColumn: this.column.manyToManyColumn,
        displayColumn: this.column.manyToManyDisplayColumn
      })
      allItems = allItems.map(a => {
        const item = {
          __id: a.id
        }
        item[this.column.manyToManyDisplayColumn] = a.title
        return item
      })
      this.allClassifier = allItems
    } else {
      // Много полей значит что это реестр ПД
      let records = await this.coreApi.registry.getAllRegistryItems(this.tableData.id)
      const primaryKey = this.tableData.allcolumns.find(a => a.isPrimaryKey).key
      records.forEach(a => {
        a['__id'] = a[primaryKey]
      })
      this.allClassifier = records
    }

    this.refreshVisibleItems()
    this.refreshFiltered()
    this.setupModal()
  },
  methods: {
    refreshFiltered () {
      if (!this.value) {
        this.filteredClassifier = this.allClassifier
        return
      }
      this.filteredClassifier = this.allClassifier.filter(a => !this.value.includes(a.__id))
    },
    addItem () {
      this.value.push(this.selectedForAdd.__id)
      this.refreshVisibleItems()
      this.refreshFiltered()
      $(this.$refs.selectModal).modal('hide')
    },
    setupModal () {
      $(this.$refs.selectModal).modal({
        keyboard: true,
        show: false
      })
    },
    showModal () {
      this.selectedForAdd = false
      this.$refs.addGrid.loadPage(1)
      $(this.$refs.selectModal).modal('show')
    },
    refreshVisibleItems () {
      if (this.value) {
        this.visibleItems = this.allClassifier.filter(a => this.value.includes(a.__id))
      }
    },
    remove () {
      this.value.splice(this.value.findIndex(a => a === this.selectedItem.__id), 1)
      this.refreshVisibleItems()
      this.refreshFiltered()
    }
  }
}
</script>

<style lang="stylus" scoped>
.manytomany-container
  height 450px
.select-content
  background-color white
.buttons-header
  display flex
  flex-direction column
  align-items flex-end
  margin-right 10px
</style>
