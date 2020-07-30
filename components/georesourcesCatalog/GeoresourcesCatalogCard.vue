<template>
  <panel :title="title">
    <template slot="heading-elements">
      <button
        type="button"
        @click="save"
        class="btn btn-default btn-icon"
        title="Сохранить"
        :disabled="isSaveDisabled || readonly || isArchive"
      >
        <i class="icon_floppy_disk"></i>
      </button>
      <report-template-print-button
        :templateResource="reportTemplateResources.spatialData"
        :printParams="printOptions"
      />
      <button
        type="button"
        class="btn btn-default btn-icon"
        title="Отобразить на карте"
        :disabled="isShowOnMapBtnDisabled"
        @click="showLayersOnMap"
      >
        <i class="icon_map"></i>
      </button>
      <button
        type="button"
        class="btn btn-icon btn-default"
        title="Перевести в архив"
        @click="archiveDocument"
        :disabled="readonly || isArchive || isNew || !isUserCanSendToArchive"
      >
        <svg-icon url="/static/archive.svg" />
      </button>
    </template>
    <div class="panel-body flex-column flex-1">
      <tabs class="flex-column flex-1">
        <tab title="Атрибуты">
          <georesources-catalog-card-attributes
            v-model="pdCard"
            :readonly="readonly"
            :isArchive="isArchive"
            :isRfpd="isRfpd"
            @change="onChange"
          />
        </tab>
        <tab title="Файлы">
          <div class="flex-column flex-1 content">
            <panel v-if="!isNew" class="flex-1 flex-column" title="Загруженные файлы">
              <georesources-catalog-files
                v-model="pdCard.files"
                :id="id"
                :readonlyFiles="readonlyFiles"
                @change="onChange"
              />
            </panel>
            <panel v-if="!readonly && !isArchive && !isRfpd && canUpdateFiles && !readonlyFiles" class="flex-1 flex-column upload-panel aligner" title="Загрузить файлы">
              <georesources-catalog-files-upload
                v-model="pdCard.newFiles"
                @change="onChange"
              />
            </panel>
          </div>
        </tab>
        <tab title="Опубликованные слои" v-if="canEditLayers">
          <georesources-catalog-card-spatial-data
            v-model="pdCard.layers"
            :readonly="readonly"
            :isArchive="isArchive"
            @addLayer="addLayer"
            @layersUpdated="setLayers"
            :canUpdateCard="canUpdate"
          />
        </tab>
      </tabs>
    </div>
  </panel>
</template>

<script>
import GeoresourcesCatalogCardAttributes from './GeoresourcesCatalogCardAttributes'
import GeoresourcesCatalogFiles from './GeoresourcesCatalogFiles'
import GeoresourcesCatalogFilesUpload from './GeoresourcesCatalogFilesUpload'
import GeoresourcesCatalogCardSpatialData from './GeoresourcesCatalogCardSpatialData'
import ReportTemplatePrintButton from '^/components/reportTemplate/ReportTemplatePrintButton'
import { mapState } from 'vuex'

export default {
  components: {
    GeoresourcesCatalogFiles,
    GeoresourcesCatalogFilesUpload,
    GeoresourcesCatalogCardAttributes,
    GeoresourcesCatalogCardSpatialData,
    ReportTemplatePrintButton
  },
  props: {
    id: String
  },
  data () {
    return {
      printOptions: {
        id: this.id
      },
      pdCard: {
        id: null,
        name: null,
        description: null,
        ownerId: null,
        registrarOrganizationId: null,
        thematicSectionId: null,
        reason: null,
        scaleId: null,
        accessRestriction: null,
        pdType: null,
        coordinateProjectionId: null,
        accuracy: null,
        manufacturer: null,
        yearCorrespondence: null,
        accessPurchaseAndUseTerms: null,
        characteristics: null,
        status: null,
        layers: [],
        files: [],
        newFiles: []
      },
      isArchive: false,
      isRfpd: false,
      canUpdateFiles: false,
      readonlyFiles: false,
      isSaveDisabled: true,
      flag: false
    }
  },
  computed: {
    ...mapState({
      systemParameters: state => state.systemParameters,
      user: state => state.user,
      spatialDataPdStatusTypes: state => state.enums.public.SpatialDataPdStatusTypes,
      reportTemplateResources: state => state.enums.public.ReportTemplateResources,
      accessRestrictions: state => state.enums.public.AccessRestrictions,
      resources: state => state.resources,
      actions: state => state.actions
    }),
    isNew () {
      if (!this.id) {
        return true
      }
      return false
    },
    readonly () {
      const user = this.$store.state.user
      return !user.can(this.resources.spatialDataPd, this.actions.update)
    },
    title () {
      return this.isNew ? 'Создание карточки каталога георесурсов' : `Редактирование карточки каталога ПД ${this.pdCard.name}`
    },
    currentModule () {
      return this.$store.state.currentModule
    },
    canEditLayers () {
      if (this.pdCard.accessRestriction !== this.accessRestrictions.owner) {
        return true
      }

      return this.$store.state.user.urbanPlanningObjectId === this.pdCard.ownerId
    },
    canUpdate () {
      return this.$store.state.user.urbanPlanningObjectId === this.pdCard.registrarOrganizationId
    },
    isShowOnMapBtnDisabled () {
      if (this.accessRestrictions.owner === this.pdCard.accessRestriction) {
        return this.$store.state.user.urbanPlanningObjectId !== this.pdCard.ownerId
      }
      return false
    },
    isUserCanSendToArchive () {
      if (this.pdCard.status === this.spatialDataPdStatusTypes.rfpd && (this.user.UrbanPlanningObject.id === this.pdCard.registrarOrganizationId || this.user.UrbanPlanningObject.id === this.systemParameters.rfpdOperatorId)) {
        return true
      }

      return false
    }
  },
  watch: {
    'pdCard.newFiles' (newValue, oldValue) {
      if (!oldValue && newValue && newValue.length) {
        this.onChange(false)
        return
      }
      if (!oldValue && newValue && !newValue.length) {
        this.onChange(true)
        return
      }
      if (oldValue && !oldValue.length && newValue && newValue.length) {
        this.onChange(false)
      }
    }
  },
  async mounted () {
    this.pdCard.status = this.spatialDataPdStatusTypes.project
    await this.refresh()
    this.flag = true
  },
  methods: {
    async archiveDocument () {
      if (!this.id) {
        return
      }
      if (!await this._confirm('Вы хотите перевести документ в архив?', 'Перевод документа в архив', 'Перевести', 'Отмена')) {
        return
      }

      try {
        await this.coreApi.pdCards.sendDocumentToArchive(this.id)
        await this.refresh()
        this.$success('Документ успешно переведен в архив')
      } catch (err) {
        console.error(err)
        this.$error('Ошибка при переводе документа в архив')
      }
    },
    onChange (value) {
      if (this.flag && value === false) {
        this.isSaveDisabled = value
      }
      if (this.flag && value === true) {
        this.isSaveDisabled = value
      }
    },
    validate () {
      if (!this.validateRequiredFields()) {
        this.$error('Необходимо заполнить все поля, отмеченные звездочкой')
        return
      }
      if (this.pdCard.yearCorrespondence <= 0 && this.pdCard.yearCorrespondence) {
        this.$error('Поле "Год соответствия" заполнено не корректно')
        return false
      }
      if (!this.isYearValid() && this.pdCard.yearCorrespondence) {
        this.$error('Поле "Год соответствия" заполнено не корректно')
        return false
      }
      return true
    },
    validateRequiredFields () {
      return [
        this.pdCard.name,
        this.pdCard.thematicSectionId,
        this.pdCard.registrarOrganizationId,
        this.pdCard.ownerId,
        this.pdCard.accessRestriction,
        this.pdCard.status
      ].every(Boolean)
    },
    isYearValid () {
      let year = this.pdCard.yearCorrespondence + ''
      let regexp = new RegExp('[0-9]{4}')
      return regexp.test(year)
    },
    async save () {
      if (!this.validate()) {
        return
      }
      try {
        this.blockUI(this.$el, true)
        if (this.isNew) {
          const data = await this.coreApi.pdCards.create(this.pdCard)
          this.$store.dispatch('georesourcesCatalog/navigateReplace', {
            name: `${this.pdCard.name}`,
            routeParams: { name: `${this.currentModule.link}/pdCard`, params: { id: data.id } }
          })
          this.newFiles = []
        } else {
          await this.coreApi.pdCards.update(this.id, this.pdCard)
          this.newFiles = []
          this.refresh()
        }
        this.$success('Данные успешно сохранены')
      } catch (err) {
        this.$error('Ошибка записи данных')
      } finally {
        this.blockUI(this.$el, false)
        this.onChange(true)
      }
    },
    async refresh () {
      const registrarOrganizationId = this.$store.state.systemParameters.rfpdOperatorId || this.$store.state.user.urbanPlanningObjectId
      if (!this.isNew) {
        this.pdCard = await this.coreApi.pdCards.getById(this.id)
        this.pdCard.files.map(x => {
          x.name = x.name + x.file_type
          return x
        })
        if (this.pdCard.status === this.spatialDataPdStatusTypes.archive) {
          this.isArchive = true
        }
        if (this.pdCard.status === this.spatialDataPdStatusTypes.rfpd) {
          this.isRfpd = true
        }
      } else {
        this.pdCard.registrarOrganizationId = registrarOrganizationId
      }

      if (this.canUpdate && !this.readonly) {
        this.canUpdateFiles = true
      }
      if (registrarOrganizationId !== this.pdCard.registrarOrganizationId && registrarOrganizationId === this.pdCard.ownerId) {
        this.readonlyFiles = true
      }
    },
    addLayer (layer) {
      const { layers } = this.pdCard
      layers.push(layer)
      this.onChange(false)
    },
    setLayers (newLayers) {
      this.pdCard.layers = newLayers
      this.onChange(false)
    },
    showLayersOnMap () {
      const layers = this.pdCard.layers.filter(({ id }) => id).map(({ id }) => id)
      this.$store.commit('georesourcesCatalog/setSelectedPdCardLayers', layers)
    }
  }
}
</script>

<style lang="stylus" scoped>
>>> .tab-content
  display flex
  flex 1
  overflow-x hidden
  overflow-y auto
.tab-content
  .active
    display flex
.tab-pane
  flex 1
.aligner
  flex 0
</style>
