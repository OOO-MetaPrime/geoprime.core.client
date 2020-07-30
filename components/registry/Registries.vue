<template>
  <div class="flex-column flex-1">
    <breadcrumb :routes="breadcrumb" @click="onClick">
      <div>
        <a :class="{ active: isLeftPanelVisible }" @click="onLeftPanelToggle">
          <i class="icon_comment_discussion position-left"></i> Реестры
        </a>
      </div>
      <div>
        <a :class="{ active: isRightPanelVisible }" @click="onRightPanelToggle">
          <i class="icon_map position-left"></i> Карта
        </a>
      </div>
    </breadcrumb>

    <keep-alive>
      <component
        :is="rootView"  
        :id="id"
        :groupId="groupId"
        ref="comp"
        :isLeftPanelVisible="isLeftPanelVisible"
        :isRightPanelVisible="isRightPanelVisible"
      >
      </component>
    </keep-alive>

  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex'
import get from 'lodash/get'
import RegistriesRoot from './RegistriesRoot'
import mapEventActions from '^/components/map/mapActions'
import mapEventsMixin from '^/mixins/mapEvents'

const rootView = 'registries-root'

export default {
  components: {
    RegistriesRoot
  },
  props: {
    id: String,
    groupId: String
  },
  mixins: [mapEventsMixin],
  data () {
    return {
      isLeftPanelVisible: true,
      isRightPanelVisible: true
    }
  },
  computed: {
    ...mapState({
      breadcrumb: state => state.breadcrumb,
      rootView: state => state.rootView,
      currentSection: state => state.currentSection
    })
  },
  beforeCreate () {
    // mutations.REGISTRIES_CLEAR
    this.$store.dispatch(`registries/registriesClear`)
  },
  async mounted () {
    this.blockUI(this.$el, true)
    try {
      await this.loadLeftPanelComponent()
    } finally {
      this.blockUI(this.$el, false)
    }
  },
  methods: {
    ...mapActions({
      registriesGo: 'registries/go',
      addressregistryGo: 'addressregistry/go',
      rosreestrGo: 'rosreestr/go',
      rosreestrOksGo: 'rosreestrOks/go',
      registriesNavigate: 'registries/navigate',
      selectRegistry: 'registries/selectRegistry',
      registriesClear: 'registries/registriesClear'
    }),
    async loadLeftPanelComponent () {
      this.selectRegistry(null)

      if (this.id) {
        await this.loadRegistry()
        return
      }
      this.registriesNavigate({
        name: this.groupId ? this.currentSection.resource.name : 'Реестры',
        view: this.view ? this.view : 'registries-list',
        rootView: this.rootView ? this.rootView : rootView,
        root: true,
        selectedRegistry: this.selectedRegistry
      })

      // отправка события карте по EventBus о том что был выбран реестр
      this.emitEventToMap(mapEventActions.ADD_REGISTRY_LAYER, { registry: null })
    },
    async loadRegistry () {
      try {
        const registry = await this.coreApi.registry.getRegistry(this.id)
        this.registriesNavigate({
          id: { id: this.id, name: registry.name },
          name: registry.name,
          rootView,
          view: 'registries-registry',
          root: true,
          selectedRegistry: this.selectedRegistry
        })

        // отправка события карте по EventBus о том что был выбран реестр
        this.emitEventToMap(mapEventActions.ADD_REGISTRY_LAYER, { registry: null })
      } catch (e) {
        if (get(e, 'response.status') === 400) {
          this.$error('Запрашиваемый реестр не найден')
          this.$router.back()
        }
      }
    },
    onClick (item) {
      if (this.$refs.comp) {
        this.$refs.comp.reset()
      }
      if (this.$refs.comp.destroyDisusedComponents) {
        this.$refs.comp.destroyDisusedComponents()
      }

      switch (item.rootView) {
        case 'fns-steads-root':
          this.$store.dispatch('breadcrumbGo', item)
          break
        case rootView:
          this.registriesGo(item)
          break
        case 'address-registry-root':
          this.addressregistryGo(item)
          break
        case 'rosreestr-root':
          this.rosreestrGo(item)
          break
        case 'rosreestr-oks-root':
          this.rosreestrOksGo(item)
          break
        default:
          break
      }
    },
    onLeftPanelToggle () {
      this.isLeftPanelVisible = !this.isLeftPanelVisible
    },
    onRightPanelToggle () {
      this.isRightPanelVisible = !this.isRightPanelVisible
    }
  }
}
</script>

<style lang="stylus" scoped>
</style>
