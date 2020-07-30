<template>
<div class="flex-column flex-1">
  <div class="navbar">
    <ul class="nav navbar-nav navbar-right icons-list">
      <li>
        <button
          class="btn btn-default btn-icon"
          @click="showModal"
          :disabled="!selected || readonlyFiles"
          title="Переименовать"
        >
          <i class="icon_edit"></i>
        </button>
      </li>
      <li>
        <button
          class="btn btn-default btn-icon"
          @click="download"
          :disabled="!selected || readonlyFiles"
          title="Скачать"
        >
          <i class="icon_file_download"></i>
        </button>
      </li>
      <li>
        <button
          class="btn btn-default btn-icon"
          @click="remove"
          :disabled="!selected || readonlyFiles"
          title="Удалить"
        >
          <i class="icon_bin"></i>
        </button>
      </li>
    </ul>
  </div>
  <data-table
    :items="value"
    :columns="columns"
    v-model="selected"
    class="flex-1"
    selectable
  />
  <div @click='hideFrame' v-if="isShowFrame" class="frame-wrap">
    <i @click='hideFrame' class="icon_close" aria-hidden="true" />
    <iframe class="frame" :src="this.url" frameborder="0" />
  </div>
  <modal-dialog size="md" v-model="modalOpen" title="Переименование файла" @hide="renameFile">
    <div>
      <label for="modalInput" class="control-label">Имя файла</label>
      <input id="modalInput" ref="modalInput" type="text" class="form-control" v-model="modalValue">
    </div>
  </modal-dialog>
</div>

</template>
<script>
export default {
  props: {
    value: Array,
    id: String,
    readonlyFiles: Boolean
  },
  data () {
    return {
      selected: null,
      columns: [
        { width: '250px', field: 'name', title: 'Имя', type: { type: 'link', onClick: this.showFrame }, cellClass: this.getCellClass },
        { width: '140px', field: 'created', title: 'Дата создания', cellClass: this.getCellClass },
        {
          width: '140px',
          displayField: 'File',
          displayValue: 'fileSize',
          title: 'Размер, байт',
          cellClass: this.getCellClass,
          displayAs: 'number',
          render: x => {
            return x.toLocaleString()
          } }
      ],
      isShowFrame: false,
      modalOpen: false,
      modalValue: '',
      url: ''
    }
  },
  methods: {
    download () {
      if (!this.selected) {
        return
      }
      const fileId = this.selected.id
      this.coreApi.pdCards.getFile(this.id, fileId)
    },
    async remove () {
      if (await this._confirm('Вы уверены, что хотите удалить выбранный файл?')) {
        this.$emit('input', this.value.filter(x => x !== this.selected))
        this.selected = null
        this.$emit('change', false)
      }
    },
    showModal () {
      this.modalOpen = true
      this.modalValue = this.selected.name
    },
    showFrame (item) {
      this.isShowFrame = true
      this.url = this.coreApi.pdCards.getFileUrl(this.id, item.id)
    },
    hideFrame () {
      this.isShowFrame = false
    },
    renameFile (msg) {
      if (msg === 'ok') {
        this.selected.name = this.$refs.modalInput.value
        this.$emit('change', false)
      }
    }
  }
}
</script>

<style lang="stylus" scoped>
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
