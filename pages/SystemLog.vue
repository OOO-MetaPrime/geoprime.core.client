<template>
<div class="flex-column flex-1">
  <div class="content flex-row flex-1">
    <panel title="Системный журнал" class="correcter-table">
      <template slot="heading-elements">
        <button class="btn btn-primary btn-icon heading-btn" @click="showHelp" type="button" title="Справка">
          <i class="icon_help"></i>
        </button>
      </template>
    <data-table
      class="flex-1"
      :columns="columns"
      :items="items"
      :count="count"
      @change="onChange"
      sortable
      filterable
      pagable
    />
    </panel>
  </div>
</div>
</template>

<script>
export default {
  data () {
    return {
      columns: [
        {
          field: 'createdAt',
          title: 'Время',
          filterable: false,
          sortDirection: 'desc'
        },
        { field: 'action', title: 'Операция', filterable: false },
        { field: 'target', title: 'Сущность' },
        { field: 'createdBy', title: 'Пользователь' },
        { field: 'comment', title: 'Примечание' }
      ],
      items: [],
      count: 0,
      params: {
        page: 1,
        size: 10,
        filters: []
      }
    }
  },
  mounted () {
    this.refresh()
  },
  methods: {
    showHelp () {
      window.open(this.$url(`/help/index.html`), '_blank')
    },
    onChange (params) {
      this.params = params
      this.refresh()
    },
    async refresh () {
      const { rows, count } = await this.coreApi.systemLog.getAll(this.params)
      this.items = rows
      this.count = count
    }
  }
}
</script>

<style scoped>
</style>
