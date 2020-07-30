<template>
  <panel :title="viewParams.name" :toolbarMenu="true">
    <div slot="heading-elements" class="heading-btn custom-heading-btn">
      <button
        type="button"
        class="btn btn-default btn-icon"
        @click="addItem(registry)"
        :disabled="!checkCreatePermissions()"
        title="Создать"
      >
        <i class="icon_bigplus"></i>
      </button>
      <button
        type="button"
        class="btn btn-default btn-icon"
        @click="deleteItem($refs.registryItems, registry.id, selectedItem[registry.primaryKeyColumn.key])"
        :disabled="!checkPermissions('delete')"
        title="Удалить"
      >
        <i class="icon_bin"></i>
      </button>
      <button
        type="button"
        class="btn btn-default btn-icon"
        @click="exportRegistry($refs.registryItems,registry.id)"
        title="Выгрузка списка в файл"
        v-if="isFullToolbar"
      >
        <i class="icon_file_excel"></i>
      </button>
      <button
        type="button"
        class="btn btn-default btn-icon"
        @click="print"
        title="Печать"
        :disabled="isPrintDisabled"
        v-if="isFullToolbar"
      >
        <i class="icon_printer"></i>
      </button>
      <button
        type="button"
        class="btn btn-default btn-icon"
        @click="uploadExcel(registry.id)"
        title="Загрузить объекты из XLSX"
        v-if="isFullToolbar"
      >
        <i class="icon_upload"></i>
      </button>
      <button
        type="button"
        class="btn btn-default btn-icon"
        @click="downloadExcelTemplate(registry.id)"
        title="Выгрузить шаблон для реестра в XLSX"
        v-if="isFullToolbar"
      >
        <i class="icon_insert_template"></i>
      </button>
      <button type="button" class="btn btn-default btn-icon" title="Обновить" @click="refresh">
        <i class="icon_sync"></i>
      </button>
      <button class="btn btn-primary btn-icon" title="Назад" @click="goToBack">
        <span class="icon_arrow_back"></span>
      </button>
      <button
        class="btn btn-primary btn-icon"
        @click="showHelp"
        title="Справка"
        v-if="!isFullToolbar"
      >
        <i class="icon_help"></i>
      </button>
    </div>

    <data-table
      :columns="columns"
      :items="items"
      :count="count"
      @change="onChange"
      class="flex-1"
      sortable
      filterable
      pagable
      selectable
      v-if="loaded"
      v-model="selectedItem"
      :noDataTooltip="noDataTooltip"
    />
    <select-template-dialog ref="selectTemplateDialog" @select="printTemplate" />
    <file-selector ref="fileSelector" @changed="selectFile" :filter="'.xlsx'" />
  </panel>
</template>

<script>
import _cloneDeep from 'lodash/cloneDeep'
import SelectTemplateDialog from './SelectTemplateDialog.vue'
import {
  getFilterColumnOperator,
  getColumnRenderFunc,
  getColumnDataType,
  booleanLookupSource,
  openInNewWindow,
  openEmail,
  mapParams
} from '^/helpers/registryColumnsHelper'
import { mapState, mapActions } from 'vuex'
import getFieldName from '^/helpers/nameFieldHelper'
import mapEventActions from '^/components/map/mapActions'
import mapEventsMixin from '^/mixins/mapEvents'
import { updateFilters } from '^/components/map/map'

function createEmptyRegistry () {
  return {
    name: '',
    source: '',
    columns: [],
    gridColumns: [],
    claims: {},
    basemapLayers: []
  }
}

export default {
  props: {
    // TODO Переименовать
    id: Object,
    rootView: String,
    stateModule: {
      type: String,
      default: 'registries'
    },
    showAllRecords: {
      type: Boolean,
      default: false
    },
    isSkipLayerAdding: {
      type: Boolean,
      default: false
    }
  },
  components: {
    SelectTemplateDialog
  },
  mixins: [mapEventsMixin],
  data () {
    return {
      isDeactivated: true,
      columns: [],
      items: [],
      count: 0,
      isCardVisible: false,
      registriesVisible: true,
      selectedItem: null,
      drawIsChecked: false,
      selectedLayer: null,
      openedCards: [],
      currentOpenedCard: null,
      registry: createEmptyRegistry(),
      selectedMapLayer: null,
      templates: [],
      loaded: false,
      viewParams: _cloneDeep(this.id),
      params: {
        page: 1,
        size: 10,
        filters: [],
        sorting: []
      },
      isLoading: false,
      nameField: {}
    }
  },
  computed: {
    noDataTooltip () {
      if (this.checkCreatePermissions()) {
        return 'Нет данных. Для создания записи нажмите на кнопку "+"'
      }

      return 'Нет данных'
    },
    isPrintDisabled () {
      return !this.templates || !this.templates.length
    },
    isItemSelected () {
      return !!this.selectedItem
    },
    isFullToolbar () {
      return !this.ecoMode
    },
    ...mapState({
      isRecordListActual: state => state.registries.isRecordListActual,
      registryId: state => state.registries.id,
      selectedRecord: state => state.registries.selectedRecord,
      selectedRegistry: state => state.registries.selectedRegistry,
      user: state => state.user,
      ecoMode: state => state.registries.ecoMode,
      ReportTemplateResources: state => state.enums.public.ReportTemplateResources
    })
  },
  watch: {
    selectedItem (newValue) {
      this.selectRecord(newValue)
      this.emitEventToMap(mapEventActions.SHOW_REGISTRY_OBJECT, { record: newValue })
    },
    async isRecordListActual (isActual) {
      if (isActual) {
        return
      }
      await this.refresh()
      this.recordsChanged(true)
    }
  },
  mounted () {
    // TODO Переименовать this.id
    this.load(this.viewParams.id)
    this.onBroadcastEventFromMap(mapEventActions.CHANGE_GEOMETRY, this.changeGeometry)
  },
  activated () {
    this.isDeactivated = false
    if (!this.loaded) {
      return
    }
    // отправка события карте по EventBus о том что был выбран реестр
    this.emitEventToMap(mapEventActions.ADD_REGISTRY_LAYER, {
      registry: this.registry,
      isSkipLayerAdding: this.isSkipLayerAdding
    })

    this.selectRegistry(this.registry)
    this.refresh()
  },
  deactivated () {
    this.isDeactivated = true
  },
  beforeDestroy () {
    this.isDeactivated = true
  },
  methods: {
    ...mapActions({
      selectRegistry: 'registries/selectRegistry',
      selectRecord: 'registries/selectRecord',
      go: 'registries/go',
      navigate: 'registries/navigate',
      recordsChanged: 'registries/recordsChanged',
      breadcrumbBack: 'breadcrumbBack',
      getPreviousBreadcrumbItem: 'getPreviousBreadcrumbItem'
    }),
    async changeGeometry (payload) {
      const { layer, record, entityOptions } = payload
      const { field, value, mode, layerFieldValue } = entityOptions

      const index = this.items.findIndex(x => x.id === record.id)

      if (index === -1) {
        return
      }

      if (mode === 'delete') {
        if (!layer || !layer.objects) {
          await this.refresh()

          return
        }
        const targetItems = this.items.filter(x => `${x[field]}` === `${layerFieldValue}`)

        if (!targetItems.length) {
          return
        }

        for (const item of targetItems) {
          const objIndex = layer.objects.findIndex(x => x.id === item.id)
          if (~objIndex) {
            layer.objects[objIndex][field] = null
            if (layer.isFiltered) {
              updateFilters(layer, layer.view)
            }
          }
        }

        await this.refresh()

        return
      }

      if (mode === 'create') {
        const item = _cloneDeep(this.items[index])
        item[field] = value
        this.emitEventToMap(mapEventActions.SHOW_REGISTRY_OBJECT, {
          record: item
        })
      }

      if (!layer || !layer.objects) {
        await this.refresh()

        return
      }

      const objIndex = layer.objects.findIndex(x => x.id === this.items[index].id)

      if (~objIndex) {
        layer.objects[objIndex][field] = value
        if (layer.isFiltered) {
          updateFilters(layer, layer.view)
        }
      }

      await this.refresh()
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
    async load (id) {
      this.selectedItem = null
      this.openedCards = []
      this.isCardVisible = false

      if (id) {
        // Загружаем список шаблонов в фоне.
        this.loadTemplates(id)

        const registry = await this.coreApi.registry.getRegistry(id)
        registry.source = '/api/registries/registry/paginate/' + id
        registry.id = id
        registry.primaryKeyColumn = registry.columns.find(a => a.isPrimaryKey)
        this.registry = registry
        this.nameField = registry.columns.find(x => x.isNameField)
        this.columns = registry.columns
          // Не отображаем в таблицы колонки HTML
          .filter(x => x.isVisibleInGrid && !x.isHtml)
          .map(x => ({
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
        this.loaded = true
        this.refresh()
      } else {
        this.registry = createEmptyRegistry()
      }
      // отправка события карте по EventBus о том что был выбран реестр
      this.emitEventToMap(mapEventActions.ADD_REGISTRY_LAYER, {
        registry: this.registry,
        isSkipLayerAdding: this.isSkipLayerAdding
      })

      this.selectRegistry(this.registry)
      this.selectRecord(null)
      this.emitEventToMap(mapEventActions.SHOW_REGISTRY_OBJECT, { record: null })
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
    async openCard (selectedItem) {
      const registry = this.registry
      const recordId = selectedItem[this.registry.primaryKeyColumn.key]
      const item = await this.coreApi.registry.getItem(registry.id, recordId)
      const cardMode = this.checkPermissions('update') ? 'edit' : 'view'
      this.showCard({ item, mode: cardMode, registry, selectedItem })
    },
    addItem (registry) {
      const newItem = { files: [], newFiles: [] }

      // для полей многие ко многим создаем массивы
      const manyToManyColumns = registry.columns.filter(a => a.isManyToMany)
      for (let column of manyToManyColumns) {
        newItem[column.id] = []
      }
      // для обычных полей создаем свойства
      const simpleColumns = registry.columns.filter(a => !a.isManyToMany)
      for (let column of simpleColumns) {
        newItem[column.key] = null
      }
      // поле oktmo_id по умолчанию заполняем значением аналогичного поля из пользователя
      newItem.oktmo_id = this.user.oktmoId

      // постоянные фильтры из родительской записи нужно записать в новую запись в качестве значений по умолчанию
      if (this.viewParams.filters && this.viewParams.filters.length) {
        for (const filter of this.viewParams.filters) {
          newItem[filter.field] = filter.value
        }
      }

      this.showCard({ item: newItem, mode: 'create', registry })
    },
    async deleteItem (grid, registryId, recordId) {
      // Для ссылки обработчик вызывается даже в состоянии disabled.
      if (!this.checkPermissions('delete')) {
        return
      }
      const checkResult = await this.coreApi.registry.checkItemBeforeDelete(registryId, recordId)
      if (checkResult.length) {
        const documentsListString = checkResult.map(x => `${x.documentTypeName} №${x.docNumber}`).join(', ')
        if (!await this._confirm(`Эта запись включена в разрабатываемый документ(ы):<BR> ${documentsListString}.<BR>При удалении записи, она будет исключена из указанных документов. Удалить запись?`, 'Удаление записи', 'Удалить', 'Отмена', 'danger')) {
          return
        }
      } else {
        if (!await this._confirm('Вы действительно хотите удалить выбранную запись?', 'Удаление записи', 'Удалить', 'Отмена', 'danger')) {
          return
        }
      }
      await this.coreApi.registry.deleteItem(registryId, recordId)
      this.refresh()
    },
    exportRegistry (grid, registryId) {
      const url = this.$url(`/api/registries/registry/${registryId}/export`)
      const params = _cloneDeep(this.params)
      if (this.viewParams.filters && this.viewParams.filters.length) {
        params.filters = params.filters.concat(this.viewParams.filters)
      }
      this.coreApi.download.downloadFile(url, 'options', JSON.stringify(params))
    },
    async print () {
      if (this.templates.length === 1) {
        // Настроен только один шаблон. Печатаем сразу.
        this.printTemplate(this.templates[0].id)
      } else {
        // Настроено несколько шаблонов. Отображаем диалог выбора.
        this.$refs.selectTemplateDialog.show(this.templates)
      }
    },
    async printTemplate (templateId) {
      try {
        await this.coreApi.reportTemplates.printTemplate(templateId)
      } catch (e) {
        this.$error('Печать. Ошибка при печати шаблона.')
      }
    },
    uploadExcel (registryId) {
      this.$refs.fileSelector.selectFile(registryId)
    },
    async selectFile (file, registryId) {
      try {
        const importInfo = await this.coreApi.xlsx.importRegistryItems(registryId, file)
        if (!importInfo.complete) {
          this.$error(`
            Импорт записей из xlsx.
            <ul class="navigation">
                ${importInfo.errors.split('\n').map(a => '<li>' + a + '</li>').join('')}
            </ul>`, { hide: false })
          return
        }
        if (importInfo.incompleted === 0) {
          this.$success(`Импортировано записей ${importInfo.completed}`)
        } else {
          this.$notice(`
            Было импортировано ${importInfo.completed} и неимпортировано ${importInfo.incompleted} записей.
            <a href="${this.$url(`/api/xlsx/registry/import/errorlog/${importInfo.logId}`)}">
              Скачать строки с ошибками.
            </a>`, { title: 'Результаты импорта', hide: false })
        }
        this.refresh()
      } catch (error) {
      }
    },
    downloadExcelTemplate (registryId) {
      location.href = this.$url(`/api/xlsx/registry/template/${registryId}`)
    },
    checkCreatePermissions () {
      if (this.ecoMode === 'view') {
        return false
      }
      return this.registry.claims['create']
    },
    checkPermissions (mode) {
      // если перешли с карточки экопаспорта и там нельзя редактирование производить, в реестре тоже нельзя
      if (this.ecoMode === 'view') {
        return false
      }
      // Если октмо юзера и октмо объекта не совпадает - нет прав на редактирование и удаление
      const selectedItem = this.selectedItem && this.selectedItem.oktmo_id
      return this.registry.claims[mode] && selectedItem && this.user && this.user.oktmoId === this.selectedItem.oktmo_id
    },
    showCard ({ item, mode, registry, selectedItem }) {
      if (!this.isCardVisible) {
        this.isCardVisible = true
      }

      const newCard = {
        id: this.openedCards.length + 1, // surrogate unique key
        item,
        mode,
        registry: registry,
        viewItem: this.viewItem,
        showBack: true
      }

      const dispatchedObject = {
        id: newCard,
        selectedRegistry: registry,
        view: 'registries-record',
        rootView: this.rootView
      }

      if (mode === 'create') {
        dispatchedObject.name = `Создание ${registry.name}`
      } else {
        dispatchedObject.name = getFieldName({
          item: selectedItem,
          nameField: this.nameField,
          columns: this.columns
        })
      }

      this.navigate(dispatchedObject)

      // отправка события карте по EventBus о том что был выбран реестр
      this.emitEventToMap(mapEventActions.ADD_REGISTRY_LAYER, { registry: registry, isSkipLayerAdding: this.isSkipLayerAdding })
    },
    async loadTemplates (registryId) {
      this.templates = []
      this.templates = await this.coreApi.reportTemplates.getTemplates(this.ReportTemplateResources.spatialRegistry, { registryId })
    },
    async refresh () {
      if (this.isDeactivated) {
        return
      }
      const params = _cloneDeep(mapParams(this.params, this.columns))
      if (this.viewParams.filters && this.viewParams.filters.length) {
        params.filters = params.filters.concat(this.viewParams.filters)
      }
      if (!this.registry.id) {
        return
      }
      const primaryKeyColumnName = [this.registry.primaryKeyColumn.key]
      const oldSelectedItemId = this.selectedItem ? this.selectedItem[primaryKeyColumnName] : null
      const data = await this.coreApi.registries.registry(this.registry.id, params, this.showAllRecords)
      this.items = data.rows
      this.count = data.count
      if (oldSelectedItemId) {
        const foundItem = this.items.find(x => x[primaryKeyColumnName] === oldSelectedItemId)
        this.selectedItem = foundItem
      } else {
        this.selectedItem = null
      }
    },
    onChange (params) {
      this.params = params
      this.refresh()
    },
    async goToBack () {
      const previousItem = await this.getPreviousBreadcrumbItem()
      this.go(previousItem)
    },
    showHelp () {
      window.open(this.$url(`/help/index.html`), '_blank')
    }
  }
}
</script>

<style lang="stylus" scoped>
.custom-heading-btn
  height: max-content
  margin: 0
  text-align: left
@media (max-width 425px)
  .content > .panel
    height 92%
</style>
