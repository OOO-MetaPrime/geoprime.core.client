<template lang="pug">
panel(:title="dialogTitle")
  div(slot="heading-elements")
    button.btn.btn-default.btn-icon(@click.capture="save" :disabled="!isChanged && disabledSave" v-if="editable && !isFromPointCard" title="Сохранить")
      <i class="icon_floppy_disk"></i>
    button.btn.btn-primary.btn-icon.go-btn(v-if="showBack" title="Назад" @click="goToBack")
      span.icon_arrow_back
  div.panel-body.flex-column.flex-1
    tabs.flex-column.flex-1.tabs-container
      tab(title="Атрибуты")
        registry-record-attributes(
          :columns="registry.columns"
          :item="item"
          :editable="editable"
          @changeDisable="changeDisable"
          :handlers="handlers"
          :classifiers="classifiers"
          :registry="registry"
        )
      tab(title="Дополнительные сведения" v-if="(!isFromPointCard && registry.relatedRegistries.length > 0 && !viewParams && mode != 'create') && !modal" class="correcter")
        registry-record-related-registries.related-registries(
          :registry="registry"
          :item="item"
          ref="registries"
          :rootView="rootView")
      tab(title="Файлы" v-if="!isFromPointCard && viewParams !== breadcrumbs['catalog'].viewParams")
        registry-record-files.uploader-events(
          :registry="registry"
          :item="item"
          v-model="newFiles"
          :editable="editable"
          :mode="mode"
          ref="files"
          @changed="changed"
          @input="input($event)"
          :isShowSystemCoordinates="isShowSystemCoordinates"
        )
  </template>

<script>
import RegistryRecordAttributes from './RegistryRecordAttributes.vue'
import RegistryRecordFiles from './RegistryRecordFiles.vue'
import RegistryRecordRelatedRegistries from './RegistryRecordRelatedRegistries.vue'
import { mapState, mapActions } from 'vuex'
import { getRegistryClassifiers } from '^/helpers/registryHelper'
import moment from 'moment'

export default {
  props: ['registry', 'item', 'mode', 'handlers', 'isNeedAddLayer', 'isChanged', 'rootView', 'isFromPointCard', 'territoryFilter', 'showBack', 'modal'],
  data () {
    return {
      title: '',
      modalVisible: true,
      newFiles: [],
      isShowSystemCoordinates: false,
      disabledSave: true,
      classifiers: {}
    }
  },
  components: {
    RegistryRecordAttributes,
    RegistryRecordFiles,
    RegistryRecordRelatedRegistries
  },
  computed: {
    ...mapState({
      khaView: state => state.kha.view,
      user: state => state.user,
      breadcrumbs: state => state.breadcrumbs,
      ecoMode: state => state.registries.ecoMode
    }),
    viewParams () {
      if (this.khaView === 'kha-registries-catalog-root') {
        return this.breadcrumbs['catalog'].viewParams
      } else if (this.khaView === 'kha-news') {
        return this.breadcrumbs['news'].viewParams
      } else {
        return null
      }
    },
    editable () {
      if (this.ecoMode === 'view') {
        return false
      }
      return this.mode === 'create' || (this.mode === 'edit' && this.user.oktmoId === this.item.oktmo_id)
    },
    dialogTitle () {
      const name = this.registry.name
      switch (this.mode) {
        case 'view':
          return `${name}`
        case 'edit':
          return `${name}`
        case 'create':
          return `Создание ${name}`
        default:
          return `Карточка ${name}`
      }
    },
    currentProjection () {
      return this.$refs.files ? this.$refs.files.getCurrentProjection() : null
    }
  },
  async mounted () {
    this.setBeforeLeaveFunc(this.saveChangesBeforeLeave.bind(this))
    this.classifiers = await this.getClassifiers(this.registry)
    const files = await this.coreApi.registry.getItemFiles(this.item[this.registry.primaryKeyColumn.key], this.registry.id)
    this.item.files = files
    const turningPoints = await this.coreApi.registry.getItemTurningPoints(this.item[this.registry.primaryKeyColumn.key], this.registry.id)
    this.$set(this.item, 'turningPoints', turningPoints)
    // для запрета/разрешения кнопки Сохранить нужно отслежить все изменения объекта
    this.$watch('item', this.itemChanged, { deep: true })
  },
  activated () {
    this.setBeforeLeaveFunc(this.saveChangesBeforeLeave.bind(this))
  },
  beforeDestroy () {
    this.setBeforeLeaveFunc(null)
  },
  deactivated () {
    this.setBeforeLeaveFunc(null)
  },
  methods: {
    ...mapActions({
      renameLastBreadcrumbElement: 'kha/renameLastBreadcrumbElement',
      setBeforeLeaveFunc: 'setBeforeLeaveFunc',
      go: 'registries/go',
      getPreviousBreadcrumbItem: 'getPreviousBreadcrumbItem'
    }),
    async saveChangesBeforeLeave () {
      if (this.isChanged) {
        if (!await this._confirm('Запись не сохранена. Сохранить?', '', 'Сохранить', 'Не сохранять', 'primary', 'danger')) {
          return false
        }

        await this.save()
        return true
      }

      return false
    },
    async goToBack () {
      if (this.isChanged) {
        if (!await this._confirm('Есть не сохраненные изменения. Сохранить?', '', 'Да', 'Нет', 'primary', 'danger')) {
          this.$emit('onBack')
        } else {
          await this.save()
        }
      } else {
        this.$emit('onBack')
      }
      const previousItem = await this.getPreviousBreadcrumbItem()
      this.go(previousItem)
    },
    async getClassifiers (registry) {
      this.blockUI(this.$el, true)
      const classifierColumns = registry.columns.filter(x => x.isClassifier && !x.isPrimaryKey)
      const classifiers = await getRegistryClassifiers(classifierColumns, this.filterClassifiersField, this.selectingOrganizationId, !!this.territoryFilter)
      this.blockUI(this.$el, false)

      return classifiers
    },
    itemChanged () {
      this.$emit('onChanged', true)
    },
    reloadData (id) {
      this.$refs.registries.reloadData(id)
    },
    validate () {
      // Ключи колонок заполняемых автоматически
      const autoFilledColumnsKeys = ['oktmo_id']
      // Все остальные колонки (кроме primaryKey), то есть заполняемые вручную и которые надо проверять
      const manuallyFilledColumns = this.registry.columns.filter(x => !autoFilledColumnsKeys.includes(x.key) && !x.isPrimaryKey)

      const notNullColumns = manuallyFilledColumns.filter(a => a.isNotNull)
      for (const column of notNullColumns) {
        if (this.item[column.key] == null) {
          this.$error(`Не заполнено обязательное поле ${column.title}`)
          return
        }
      }

      const isAnyColumnFilled = manuallyFilledColumns.map(x => this.item[x.key]).some(Boolean)
      if (!isAnyColumnFilled) {
        this.$error(`Заполните хотя бы одно поле`)
        return
      }

      return true
    },
    async save () {
      this.blockUI(this.$el, true)

      if (!this.validate()) {
        this.blockUI(this.$el, false)
        this.$emit('onChanged', false)
        return false
      }

      try {
        if (this.mode === 'create') {
          this.$notice('Создание карточки')
          await this.create()
        }
        if (this.mode === 'edit') {
          this.$notice('Обновление карточки', { hide: false, animation: 'none' })
          await this.update()
          if (this.$refs.files) {
            this.$refs.files.uploadNotUploadedFiles()
          }
        }
        if (await this.$refs.files) {
          await this.$refs.files.reloadFiles()
        }
        this.newFiles = []
        this.$emit('saved', this.item)
      } catch (e) {
        this.$closeAllNotifications()
        this.$error('Ошибка при записи данных')
        return
      } finally {
        this.blockUI(this.$el, false)
        this.$emit('onChanged', false)
      }
    },
    async create () {
      this.item.author_id = this.user.id
      this.item.datecreated = moment().format()
      const newItem = await this.coreApi.registry.create(this.registry.id, this.item, this.currentProjection)
      this.item[this.registry.primaryKeyColumn.key] = newItem.id
      this.$closeAllNotifications()
      if (this.viewParams) {
        this.renameLastBreadcrumbElement({
          menuItem: this.viewParams.menuItem,
          name: this.item[this.registry.columns.find(x => x.isNameField).key]
        })
      }
      this.$success('Карточка успешно создана')
      this.disabledSave = true
    },
    async update () {
      this.item.editor_id = this.user.id
      this.item.dateedited = moment().format()
      await this.coreApi.registry.update(this.registry.id, this.item, this.currentProjection)
      this.$closeAllNotifications()
      if (this.viewParams) {
        this.renameLastBreadcrumbElement({
          menuItem: this.viewParams.menuItem,
          name: this.item[this.registry.columns.find(x => x.isNameField).key]
        })
      }
      this.$success('Изменения успешно сохранены')
    },
    changed () {
      this.$emit('onChanged', true)
    },
    input (e) {
      this.item.newFiles = e
      this.isShowSystemCoordinates = e.some(element => element.name.toLowerCase().lastIndexOf('.csv') > -1)
    },
    changeDisable (newValue) {
      this.disabledSave = newValue
    }
  }
}
</script>

<style lang="stylus" scoped>
.go-btn
  margin-right 5px
.related-registries, .tabs-container
  height 100%
a[disabled]
  opacity 0.65
>>> .tab-content
  flex 1
  overflow auto
 .correcter
  height 100%
@media (max-width: 768px)
  >>> .nav-tabs
    padding 0
  >>> .nav-tabs::before
    content: ''
    margin 0
</style>