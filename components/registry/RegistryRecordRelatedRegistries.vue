<template>
  <data-table :items="registry.relatedRegistries" :columns="columns" class="flex-1"/>
</template>

<script>
import { mapState } from 'vuex'
import mapEventActions from '^/components/map/mapActions'
import mapEventsMixin from '^/mixins/mapEvents'

export default {
  props: {
    registry: Object,
    item: Object,
    rootView: String
  },
  mixins: [mapEventsMixin],
  data () {
    return {
      columns: [
        { width: '300px', field: 'alias', title: 'Наименование', type: { type: 'link', onClick: this.onClick } }
      ]
    }
  },
  computed: {
    ...mapState({
      EntityTypes: state => state.enums.public.EntityTypes
    })
  },
  methods: {
    getPermanentFilters (registry) {
      return [{
        field: registry.field,
        operator: '=',
        value: this.item[registry.registryField]
      }]
    },
    onClick (item) {
      switch (item.linkType) {
        case this.EntityTypes.federalTaxService:
          this.dispatchMutation({
            filters: this.getPermanentFilters(item),
            item,
            rootView: 'fns-steads-root'
          })
          break

        case this.EntityTypes.address:
          this.dispatchMutation({
            filters: this.getPermanentFilters(item),
            item,
            rootView: 'address-registry-root'
          })
          break

        case this.EntityTypes.registry:
          this.$store.dispatch('registries/navigate', {
            id: { id: item.id, name: item.alias, filters: this.getPermanentFilters(item) },
            name: item.alias,
            view: 'registries-registry',
            rootView: this.rootView,
            selectedRegistry: null
          })

          // отправка события карте по EventBus о том что был выбран реестр
          this.emitEventToMap(mapEventActions.ADD_REGISTRY_LAYER, { registry: null })
          break

        case this.EntityTypes.rosreestrStead:
          this.dispatchMutation({
            filters: this.getPermanentFilters(item),
            item,
            rootView: 'rosreestr-root'
          })
          break

        case this.EntityTypes.rosreestrOks:
          this.dispatchMutation({
            filters: this.getPermanentFilters(item),
            item,
            rootView: 'rosreestr-oks-root'
          })
          break

        default:
          break
      }
    },
    dispatchMutation ({ item, rootView, filters }) {
      this.$store.dispatch('setRouteview', {
        filters,
        name: item.alias,
        rootView
      })
    }
  }
}
</script>
