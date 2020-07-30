<template>
<panel class="flex-column flex-1" bodyClass="flex-column flex-1" title="Загруженные файлы">
  <div slot="heading-elements">
      <icon-button
        v-if="showImageButtons"
        @click="setMainPreview"
        :disabled="!selected || readonly || !selected.isImage"
        title="Сделать основным изображением"
        icon="icon_file_check"
      />
      <icon-button
        v-if="showImageButtons"
        @click="resetMainPreview"
        :disabled="readonly || !hasDefaultPreview"
        title="Сбросить основное изображение"
        icon="icon_file_minus"
      />
      <icon-button
        @click="showModal"
        :disabled="!selected || readonly"
        title="Переименовать"
        icon="icon_edit"
      />
      <icon-button
        @click="download"
        :disabled="!selected"
        title="Скачать"
        icon="icon_file_download"
      />
      <icon-button
        @click="remove"
        :disabled="!selected || readonly"
        title="Удалить"
        icon="icon_bin"
      />
  </div>
  <data-table
    :items="value"
    :columns="displayedColumns"
    :canSelectAll="canSelectAll"
    v-model="selected"
    @changingValue="$emit('changingValue', $event)"
    class="flex-1 files-table"
    selectable
  />
  <div @click='hideFrame' v-if="show" class="frame-wrap">
    <i @click='hideFrame' class="icon_close" aria-hidden="true" />
    <iframe class="frame" :src="this.url" frameborder="0" />
  </div>
  <modal-dialog size="md" v-model="modalOpen" title="Переименование файла" @hide="renameFile" :before-close="checkFileName">
    <div>
      <label for="modalInput" class="control-label">Имя файла</label>
      <input id="modalInput" ref="modalInput" type="text" class="form-control" v-model="modalValue">
    </div>
  </modal-dialog>
</panel>
</template>

<script>
export default {
  props: {
    customDownloadFunction: {
      type: Function,
      default: null
    },
    customGetFileUrlFunction: {
      type: Function,
      default: null
    },
    registry: Object,
    value: Array,
    readonly: Boolean,
    items: Array,
    record: Object,
    showImageButtons: {
      type: Boolean,
      default: true
    },
    fileDisplayMode: {
      type: String,
      default: ''
    }
  },
  data () {
    return {
      selected: null,
      columns: [
        {
          field: 'filename',
          title: 'Имя',
          type:
          { type: 'link',
            onClick: this.showFrame
          },
          cellClass: this.getCellClass
        },
        {
          field: 'created',
          title: 'Дата создания',
          cellClass: this.getCellClass,
          render: x => {
            return new Intl.DateTimeFormat().format(Date.parse(x))
          }
        },
        {
          field: 'fileSize',
          title: 'Размер, байт',
          cellClass: this.getCellClass,
          displayAs: 'number',
          render: x => {
            return x.toLocaleString()
          }
        },
        {
          field: 'isFinalDocument',
          title: 'Итоговый документ',
          cellClass: this.getCellClass,
          type: 'checkbox'
        },
        {
          field: 'isActual',
          title: 'Актуальный',
          cellClass: this.getCellClass,
          type: 'checkbox'
        }
      ],
      show: false,
      url: '',
      modalOpen: false,
      modalValue: ''
    }
  },
  computed: {
    hasDefaultPreview () {
      return this.value.some(el => el.isDefaultPreview === true)
    },
    displayedColumns () {
      switch (this.fileDisplayMode) {
        case 'develop-document':
          return this.columns

        case 'request-response':
          return this.columns.filter(x => x.field !== 'isActual')

        default:
          return this.columns.filter(x => x.field !== 'isFinalDocument' && x.field !== 'isActual')
      }
    },
    canSelectAll () {
      if (this.fileDisplayMode !== '') {
        return false
      }
    }
  },
  methods: {
    download () {
      if (!this.selected) {
        return
      }
      const fileId = this.selected.id
      if (this.customDownloadFunction) {
        this.customDownloadFunction(fileId)
      } else {
        const registryId = this.registry.id
        const recordId = this.record.id
        this.coreApi.registry.download(registryId, recordId, fileId)
      }
    },
    async remove () {
      if (await this._confirm('Вы уверены, что хотите удалить выбранный файл?')) {
        this.$emit('input', this.value.filter(x => x !== this.selected))
        this.selected = null
      }
    },
    async showFrame (item) {
      this.show = true
      if (this.customGetFileUrlFunction) {
        const fileId = item.id
        this.url = await this.customGetFileUrlFunction(fileId)
      } else {
        this.url = this.coreApi.registry.getFileUrl(this.registry.id, this.record.id, item.id)
      }
    },
    hideFrame () {
      this.show = false
    },
    showModal () {
      this.modalOpen = true
      this.modalValue = this.selected.filename
    },
    renameFile (msg) {
      if (msg === 'ok') {
        this.selected.filename = this.$refs.modalInput.value
        this.$emit('rename', this.selected)
      }
    },
    checkFileName (msg) {
      if (msg !== 'ok') {
        this.modalOpen = false
        return true
      }
      if (this.$refs.modalInput.value.match(/[*"%?/\\[\]:|]/)) {
        this.$error('В имени файла есть недопустимые символы')
        return
      }

      return true
    },
    setMainPreview () {
      this.resetMainPreview()
      this.selected.isDefaultPreview = true
    },
    resetMainPreview () {
      this.value.forEach(element => {
        element.isDefaultPreview = false
      })
    },
    getCellClass (item) {
      if (item.isDefaultPreview) {
        return 'main-graph-file'
      }
    }
  }
}
</script>

<style lang="stylus" scoped>
.files-table
  min-height 250px
.icons-list
  margin 5px 0
.frame-wrap
  position: fixed
  top 0
  bottom 0
  left 0
  right 0
  background-color: rgba(0,0,0,0.47058823529411764);
  height 100vh
  width 100%
  z-index 3
  display flex
  justify-content center
  align-items center
.frame
  width 60%
  height 85%
  cursor pointer
  background-color rgba(49,50,50,0.611764705882353)
.icon_close
    position: absolute;
    right: 10%;
    top: 10%;
    color: white;
    cursor: pointer;
    font-size xx-large
>>> .main-graph-file,
>>> .main-graph-file a
  color green
  font-weight bold
</style>
