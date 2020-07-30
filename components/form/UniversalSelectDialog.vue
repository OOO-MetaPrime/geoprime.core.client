<template>
  <modal-dialog v-model="visible" :title="modalTitle" size="lg" append-to-body>
    <data-table
      class="flex-1"
      :columns="columns"
      :items="items"
      :count="count"
      @change="onChange"
      v-model="selectedItem"
      sortable
      filterable
      pagable
      selectable
    />
    <div slot="footer">
      <button class="btn btn-link" type="button" @click="onBeforeClose('cancel')">Отмена</button>
      <button
        class="btn btn-primary"
        :disabled="!selectedItem"
        @click="onBeforeClose('ok')"
        type="button"
      >Выбрать</button>
    </div>
  </modal-dialog>
</template>

<script>
export default {
  props: {
    options: Object,
    url: String,
    apiFunction: Function,
    method: String,
    columns: Array,
    modalTitle: {
      type: String,
      default: ''
    }
  },
  data () {
    return {
      visible: false,
      selectedItem: null,
      count: 0,
      params: {
        page: 1,
        size: 10,
        filters: [],
        sorting: []
      },
      items: []
    }
  },
  methods: {
    onChange (params) {
      this.params = params
      this.refresh()
    },
    async refresh () {
      this.blockUI(this.$el, true)
      try {
        const result = await this.apiFunction({
          url: this.url,
          method: this.method,
          body: {
            params: this.params,
            options: this.options
          }
        })

        this.items = result.rows
        this.count = result.count
      } catch (err) {
        console.error(err)
        this.$error(`Ошибка получения данных`)
      } finally {
        this.blockUI(this.$el, false)
      }
    },
    open () {
      this.visible = true
      this.refresh()
    },
    clearSelectedItem () {
      this.selectedItem = null
      this.visible = false
    },
    onBeforeClose (message) {
      if (message === 'ok') {
        this.$emit('itemSelected', this.selectedItem)
        this.clearSelectedItem()
      } else if (message === 'cancel') {
        this.clearSelectedItem()
      }
    }
  }
}
</script>