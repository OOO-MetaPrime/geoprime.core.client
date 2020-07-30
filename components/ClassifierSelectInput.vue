<template>
<div class="classifier-input-block">
  <div class="select-classifier-block input-group">
    <input
      type="text"
      class="form-control classifier-name"
      :title="inputName"
      :value="inputName"
      :readonly="true"
    />
    <span class="input-group-btn">
      <button type="button" class="btn btn-default text-primary" @click="onSelectClassifier" :disabled="disabled" v-if="!disabled">
        {{ btnText }}
      </button>
      <button title="Очистить" type="button" class="btn btn-default text-primary" @click="clearValue" :disabled="disabled" v-if="!disabled">
        <i class="icon_cross"></i>
      </button>
    </span>
  </div>
    <modal-dialog
      class="classifier-modal-container"
      size="lg"
      :title="fullTitle"
      v-model="isModalVisible"
      @hide="hide"
      append-to-body
      :before-close="onClassifierSelected"
      ok-text="Выбрать"
    >
      <memory-data-table
        class="flex-1"
        sortable
        selectable
        filterable
        pagable
        :columns="defaultColumns"
        :items="items"
        v-model="selectedItem"
      />

    </modal-dialog>
</div>
</template>

<script>
export default {
  components: {
  },
  props: {
    disabled: {
      type: Boolean,
      default: false
    },
    items: {
      type: Array,
      default: []
    },
    columns: {
      type: Array,
      default: null
    },
    initialKey: {
      type: [String, Number],
      default: null
    },
    title: {
      type: String,
      default: 'значение'
    },
    nameField: {
      type: String,
      default: 'name'
    },
    btnText: {
      type: String,
      default: 'Выбрать'
    }
  },
  data () {
    return {
      defaultColumns: [
      ],
      isModalVisible: false,
      selectedClassifierItem: null,
      selectedItem: {
        id: null,
        name: 'Не выбрано'
      }
    }
  },
  computed: {
    fullTitle () {
      return `Выберите ${this.title}`
    },
    inputName () {
      const selectedClassifierName = this.selectedClassifierItem && this.selectedClassifierItem[this.nameField]
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
    this.defaultColumns = this.columns || [
      { field: this.nameField, title: 'Наименование', sortDirection: 'asc' }
    ]
    this.selectedItem = this.items.find(x => x.id === this.initialKey)
    this.selectedClassifierItem = this.selectedItem
  },
  methods: {
    clearValue () {
      this.selectedClassifierItem = { id: null, name: 'Не выбрано' }
      this.$emit('itemSelected', this.selectedClassifierItem)
    },
    hide () {
      this.isModalVisible = false
    },
    onSelectClassifier () {
      this.isModalVisible = true
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
      this.isModalVisible = false
    }
  }
}
</script>

<style lang="stylus" scoped>
.classifier-modal-container .modal-body .dt-table
  height 400px

@media (min-width: 1025px)
  .classifier-modal-container .modal-body .dt-table
    height 450px
@media (min-width: 1200px)
  .classifier-modal-container .modal-body .dt-table
    height 500px

.classifier-input-block
  display flex
  flex 1
  align-items center
.classifier-name
  overflow hidden
  white-space nowrap
  text-overflow ellipsis
</style>