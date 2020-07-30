<template>
  <panel title="Каталог георесурсов">

    <template slot="heading-elements">
      <button class="btn btn-default btn-icon" @click="create" title="Создать карточку ПД">
        <i class="icon_bigplus"></i>
      </button>
      <button class="btn btn-default btn-icon" @click="removePdCard" title="Удалить" :disabled="!selectedItem">
        <i class="icon_bin"></i>
      </button>
      <button class="btn btn-default btn-icon" title="Обновить" @click="refresh">
        <i class="icon_sync"></i>
      </button>
      <button type="button" class="btn btn-default btn-icon" @click="exportGeoresourcesCatalog" title="Выгрузка в файл">
        <i class="icon_file_excel"></i>
      </button>
      <button
        type="button"
        class="btn btn-icon btn-default"
        title="Перевести в архив"
        @click="archiveDocument"
        :disabled="!selectedItem || !isArchiveDocumentBtnVisible"
      >
        <svg-icon url="/static/archive.svg" />
      </button>
      <report-template-print-button
        :templateResource="reportTemplateResources.spatialData"
        :printParams="printOptions"
        :disabled="!selectedItem"
      />
      <button
        class="btn btn-default btn-icon"
        type="button"
        title="Отобразить на карте"
        :disabled="!isShowOnMapBtnEnabled"
        @click="showSelectedOnMap"
      >
        <i class="icon_map"></i>
      </button>
    </template>

    <data-table
      :columns="columns"
      :items="items"
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
  </panel>
</template>

<script>
import { mapState } from 'vuex'
import ReportTemplatePrintButton from '^/components/reportTemplate/ReportTemplatePrintButton'

export default {
  components: {
    ReportTemplatePrintButton
  },
  data () {
    return {
      columns: [
        {
          title: 'Название',
          field: 'name',
          type: {
            type: 'link',
            onClick: this.openCard
          },
          sortDirection: 'asc',
          width: '250px'
        },
        {
          title: 'Ограничение по доступу',
          field: 'accessRestrictionName',
          sortingField: 'spatialDataPd.accessRestriction',
          filterField: '$spatialDataPd.access_restriction$',
          filter: { type: 'lookup', source: this.getAccessRestrictions, operator: '=' }
        },
        {
          title: 'Правообладатель',
          field: 'ownerName',
          sortingField: 'spatialDataPd.owner.name',
          filterField: '$spatialDataPd.owner.name$',
          width: '300px'
        },
        {
          title: 'Тематический раздел',
          field: 'thematicSectionName',
          sortingField: 'spatialDataPd.thematicSection.name',
          filterField: '$spatialDataPd.thematicSection.name$'
        },
        {
          title: 'Регистратор',
          field: 'registrarName',
          sortingField: 'registrar.name',
          filterField: '$registrar.name$',
          width: '300px'
        },
        {
          title: 'Статус',
          field: 'status',
          sortingField: 'spatialDataPd.status',
          filterField: '$spatialDataPd.status$',
          width: '200px',
          filter: { type: 'lookup', source: this.getSpatialDataPdStatuses, operator: '=' },
          render: this.renderSpatialDataPdStatus
        }
      ],
      items: [],
      count: 0,
      selectedItem: null,
      params: {
        page: 1,
        size: 10,
        filters: [],
        sorting: [{ field: 'name', direction: 'asc' }]
      }
    }
  },
  activated () {
    this.refresh()
  },
  computed: {
    ...mapState({
      selectedPdCardLayers: state => state.georesourcesCatalog.selectedPdCardLayers,
      systemParameters: state => state.systemParameters,
      user: state => state.user,
      accessRestrictions: state => state.enums.public.AccessRestrictions,
      reportTemplateResources: state => state.enums.public.ReportTemplateResources,
      spatialDataPdStatusTypes: state => state.enums.public.SpatialDataPdStatusTypes,
      spatialDataPdStatusTypeArray: state => state.enums.public.SpatialDataPdStatusTypes.toArray()
    }),
    isArchiveDocumentBtnVisible () {
      if (this.selectedItem && this.selectedItem.status && this.selectedItem.status === this.spatialDataPdStatusTypes.rfpd && this.isUserCanSendToArchive) {
        return true
      }

      return false
    },
    isUserCanSendToArchive () {
      if (this.selectedItem && (this.user.UrbanPlanningObject.name === this.selectedItem.registrarName || this.user.UrbanPlanningObject.id === this.systemParameters.rfpdOperatorId)) {
        return true
      }

      return false
    },
    printOptions () {
      if (this.selectedItem) {
        return {
          id: this.selectedItem.id
        }
      }
      return null
    },
    currentModule () {
      return this.$store.state.currentModule
    },
    canViewLayers () {
      if (!this.selectedItem) {
        return false
      }

      if (this.selectedItem.accessRestriction === this.accessRestrictions.owner) {
        return this.selectedItem.ownerId === this.user.urbanPlanningObjectId
      }

      return true
    },
    isShowOnMapBtnEnabled () {
      return this.selectedItem && this.selectedItem.layers.length && this.canViewLayers
    }
  },
  methods: {
    getAccessRestrictions () {
      return this.accessRestrictions.toArray()
    },
    renderSpatialDataPdStatus (value) {
      const enumItem = this.getSpatialDataPdStatuses().find(el => el.id === value)
      return enumItem ? enumItem.name : null
    },
    getSpatialDataPdStatuses () {
      return this.spatialDataPdStatusTypeArray
    },
    async archiveDocument () {
      if (!this.selectedItem) {
        return
      }

      if (!await this._confirm('Вы хотите перевести документ в архив?', 'Перевод документа в архив', 'Перевести', 'Отмена')) {
        return
      }

      try {
        this.blockUI(this.$el, true)
        await this.coreApi.pdCards.sendDocumentToArchive(this.selectedItem.id)
        await this.refresh()
        this.selectedItem = null
        this.$success('Документ успешно переведен в архив')
      } catch (err) {
        console.error(err)
        this.$error('Ошибка при переводе документа в архив')
      } finally {
        this.blockUI(this.$el, false)
      }
    },
    onChange (params) {
      this.params = params
      this.selectedItem = null
      this.refresh()
    },
    async refresh () {
      const { rows, count } = await this.coreApi.pdCards.getCards(this.params)
      this.count = count
      this.items = rows
    },
    openCard (item) {
      this.$store.dispatch('georesourcesCatalog/navigate', {
        name: `${item.name}`,
        routeParams: { name: `${this.currentModule.link}/pdCard`, params: { id: item.id } }
      })
    },
    create () {
      this.$store.dispatch('georesourcesCatalog/navigate', {
        name: `Создание карточки каталога георесурсов`,
        routeParams: { name: `${this.currentModule.link}/pdCardCreate` }
      })
    },
    showSelectedOnMap () {
      const layers = this.selectedItem.layers
        .filter(({ id }) => id)
        .map(({ id }) => id)
      this.$store.commit('georesourcesCatalog/setSelectedPdCardLayers', layers)
    },
    async removePdCard () {
      if (this.selectedItem.status !== this.spatialDataPdStatusTypes.project) {
        this.$error(`Невозможно удалить карточку в статусе ${this.spatialDataPdStatusTypes.toDisplayName(this.selectedItem.status)}`)
        return
      }
      const result = await this.coreApi.pdCards.checkLayers({
        layers: this.selectedItem.layers,
        isRemoveCard: true
      })
      const { isUse, layersName } = await this.coreApi.pdCards.checkPdCardLayers(this.selectedItem.layers)
      if (isUse) {
        this.$error(`Указанная настройка используется в "Пространственные связи", следующих георесурсов:
        ${layersName}.Изменение недоступно. Сначала выполните изменение настроек георесурсов.`)
        return
      }
      if (result.message !== 'ok') {
        if (await this._confirm(result.message)) {
          try {
            this.blockUI(this.$el, true)
            await this.coreApi.pdCards.destroy(this.selectedItem.id)
            this.$success('Данные успешно удалены')
            this.selectedItem = null
            this.refresh()
          } catch (err) {
            this.$error('Ошибка удаления данных')
          } finally {
            this.blockUI(this.$el, false)
          }
        } else {
          return
        }
      } else {
        if (await this._confirm('Вы уверены, что хотите удалить выбранную карточку?')) {
          try {
            this.blockUI(this.$el, true)
            await this.coreApi.pdCards.destroy(this.selectedItem.id)
            this.$success('Данные успешно удалены')
            this.selectedItem = null
            this.refresh()
          } catch (err) {
            this.$error('Ошибка удаления данных')
          } finally {
            this.blockUI(this.$el, false)
          }
        } else {
          return
        }
      }
    },
    exportGeoresourcesCatalog () {
      const url = this.$url('/api/pd-cards/export')
      const params = this.params
      const titles = this.columns.map(x => x.title)
      this.coreApi.download.downloadFile(url, 'options', JSON.stringify({
        params: params,
        titles: titles
      }))
    }
  }
}
</script>

<style lang="stylus" scoped>
</style>