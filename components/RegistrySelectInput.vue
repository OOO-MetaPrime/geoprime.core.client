<template>
  <div>
    <div class="select-section-block">
      <div class="input-group">
        <input type="text"
          class="form-control territory-name"
          :value="inputName"
          disabled="true"
        />
        <span class="input-group-btn">
          <button type="button" class="btn btn-default text-primary" @click="onSelectSection" :disabled="disabled">
            Выбрать
          </button>
        </span>
      </div>
    </div>
    <modal-dialog
      v-model="isShow"
      title="Выбор реестра"
      size="lg"
      @hide="onHide"
      append-to-body
      :before-close="onClassifierSelected"
      ok-text="Выбрать"
    >
      <data-table
        :columns="columns"
        :items="itemsForSelect"
        :count="count"
        @change="onChange"
        v-model="selectedItem"
        class="flex-1"
        ref="dataTable"
        sortable
        filterable
        pagable
        selectable
      />
    </modal-dialog>
  </div>
</template>

<script>
import {
  getFilterColumnOperator,
  getColumnRenderFunc,
  getColumnDataType,
  booleanLookupSource,
  openInNewWindow,
  openEmail,
  mapParams
} from '^/helpers/registryColumnsHelper'
import _cloneDeep from 'lodash/cloneDeep'
export default {
  props: {
    disabled: Boolean,
    registryColumns: Array,
    classifierRegistry: Object,
    initialKey: {
      type: [String, Number],
      default: null
    },
    items: {
      type: Array,
      default: []
    }
  },
  data () {
    return {
      columns: [],
      registry: null,
      selectedClassifierItem: null,
      selectedItem: {
        id: null,
        name: 'Не выбрано'
      },
      isShow: false,
      params: {
        page: 1,
        size: 10,
        filters: [],
        sorting: []
      },
      itemsForSelect: [],
      count: 0
    }
  },
  computed: {
    inputName () {
      const selectedClassifierName = this.selectedClassifierItem && this.selectedClassifierItem['title']
      return selectedClassifierName || 'Не выбрано'
    }
  },
  watch: {
    items (newValue) {
      this.selectedItem = this.items.find(x => x.id === this.initialKey)
      this.selectedClassifierItem = this.selectedItem
    },
    initialKey (newValue, oldValue) {
      this.selectedItem = this.items.find(x => x.id === this.initialKey)
      this.selectedClassifierItem = this.selectedItem
    }
  },
  mounted () {
    this.selectedItem = this.items.find(x => x.id === this.initialKey)
    this.selectedClassifierItem = this.selectedItem
    this.load()
  },
  methods: {
    load () {
      this.columns = this.registryColumns
        // Не отображаем в таблицы колонки HTML
        .filter(x => x.isVisibleInGrid && !x.isHtml && x.showWhenSelected)
        .map(x => ({
          id: x.id,
          field: x.key,
          title: x.title,
          displayField: x.id,
          displayValue: x.foreignTableDisplayColumn,
          filterable: true,
          invertedSort: x.isBoolean,
          textFilterOperator: getFilterColumnOperator(x),
          filter: this.getFilter(x),
          // filterField: x.isClassifier ? `$${x.id}.${x.foreignTableKeyColumn}$` : undefined,
          render: getColumnRenderFunc(x),
          displayAs: getColumnDataType(x),
          type: this.setHandler(x)
        }))
      this.refresh()
    },
    getFilter (column) {
      if (column.isBoolean) {
        return { type: 'lookup', source: booleanLookupSource, operator: '=' }
      }

      if (column.isInteger) {
        return { type: 'number', operator: '=', isInteger: true }
      }

      if (column.isNumeric) {
        return { type: 'number', operator: '=', isInteger: false }
      }

      if (column.isDate) {
        return { type: 'date', operator: '=' }
      }

      if (column.isDateTime) {
        return { type: 'datetime', operator: '=' }
      }

      if (column.isClassifier) {
        return {
          type: 'asyncselect',
          nameField: column.foreignTableDisplayColumn,
          keyField: column.foreignTableKeyColumn,
          tableName: column.foreignTable,
          operator: '='
        }
      }

      return undefined
    },
    setHandler (x) {
      const handlerObject = { type: 'link' }
      if (x.isNameField) {
        return {
          ...handlerObject,
          onClick: this.openCard
        }
      }
      if (x.isLink) {
        return {
          ...handlerObject,
          linkType: 'site',
          onClick: openInNewWindow
        }
      }
      if (x.isEmail) {
        return {
          ...handlerObject,
          linkType: 'email',
          onClick: openEmail
        }
      }
      return undefined
    },
    async refresh () {
      this.registry = this.classifierRegistry
      const params = _cloneDeep(mapParams(this.params, this.columns))
      if (!this.registry || !this.registry.id) {
        return
      }
      const data = await this.coreApi.registries.registry(this.registry.id, params, this.showAllRecords)
      this.itemsForSelect = data.rows
      this.count = data.count
    },
    onChange (params) {
      this.params = params
      this.refresh()
    },
    onSelectSection () {
      this.isShow = true
    },
    onHide (msg) {
      this.isShow = false
    },
    async onClassifierSelected (msg) {
      if (msg === 'ok') {
        if (!this.selectedItem) {
          this.$error('Выберите значение')
          return
        }

        this.selectedClassifierItem = this.selectedItem

        this.$emit('itemSelected', this.selectedClassifierItem)
      }
      this.isShow = false
    }
  }
}
</script>