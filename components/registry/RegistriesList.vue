<template>
  <panel :title="panelTitle">
    <template slot="heading-elements">
      <button class="btn btn-default btn-icon" @click="refresh" title="Обновить">
        <i class="icon_sync"></i>
      </button>
      <button class="btn btn-primary btn-icon" @click="showHelp" type="button" title="Справка">
        <i class="icon_help"></i>
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
import mapEventActions from '^/components/map/mapActions'
import mapEventsMixin from '^/mixins/mapEvents'

export default {
  props: {
    groupId: String
  },
  mixins: [mapEventsMixin],
  data () {
    return {
      columns: [
        {
          field: 'name',
          title: 'Название',
          type: { type: 'link', onClick: this.onClick },
          sortDirection: 'asc',
          filter: this.getDefaultFilter()
        }
      ],
      params: {
        page: 1,
        size: 10,
        filters: [],
        sorting: [ { field: 'name', direction: 'asc' } ]
      },
      items: [],
      count: 0,
      selectedItem: null,
      title: null
    }
  },
  computed: {
    ...mapState({
      currentSection: state => state.currentSection
    }),
    panelTitle () {
      return this.groupId ? this.currentSection.resource.name : 'Реестры'
    }
  },
  mounted () {
    this.$refs.dataTable.refresh()
  },
  activated () {
    this.$store.dispatch('registries/selectRegistry', null)
    // отправка события карте по EventBus о том что был выбран реестр
    this.emitEventToMap(mapEventActions.ADD_REGISTRY_LAYER, { registry: null })
  },
  methods: {
    showHelp () {
      window.open(this.$url(`/help/index.html?rpd_00.htm`), '_blank')
    },
    /**
     * Возвращает фильтр колонки из параметра "filter".
     * Используется внешним приложением "Экологический мониторинг".
     */
    getDefaultFilter () {
      const filter = this.$route.query.filter

      if (filter) {
        return {
          value: filter,
          operator: 'ilike'
        }
      }
    },
    onClick (item, column) {
      this.$store.dispatch('registries/navigate', {
        id: { id: item.id, name: item.name },
        name: item.name,
        view: 'registries-registry',
        rootView: 'registries-root',
        selectedRegistry: item
      })
    },
    async refresh () {
      const { items, count } = await this.coreApi.registries.search(this.params, this.groupId)
      this.items = items
      this.count = count
    },
    onChange (params) {
      this.params = params
      this.refresh()
    }
  }
}
</script>

<style scoped lang="stylus">
@media (max-width 425px)
  .content > .panel
    height 92%
</style>
