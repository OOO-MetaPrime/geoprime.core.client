<template>
 <panel-group v-if="isDestroyDisusedComponents" ref="panelGroup">
    <keep-alive>
      <component
        v-show="isLeftPanelVisible"
        v-bind="leftPanelComponentProps"
        :is="view"
        :id="selectedRegistry"
        :key="key"
        :rootView="rootView"
        :showAllRecords="false"
        stateModule="registries"
        ref="comp"
      />
    </keep-alive>

    <registries-map
      class="registries-map-container"
      :class="{'panel-hide': isMobileDisplay}"
      v-show="isRightPanelVisible"
      ref="map"
    />
  </panel-group>
</template>

<script>

import { mapState } from 'vuex'
import RegistriesList from './RegistriesList'
import RegistriesRegistry from './RegistriesRegistry'
import RegistriesRecord from './RegistriesRecord'
import RegistriesMap from './RegistriesMap'
import componentsMixin from '^/mixins/components'

export default {
  components: {
    RegistriesList,
    RegistriesRegistry,
    RegistriesRecord,
    RegistriesMap
  },
  mixins: [componentsMixin],
  props: {
    id: String,
    groupId: String,
    isLeftPanelVisible: Boolean,
    isRightPanelVisible: Boolean
  },
  data () {
    return {
      rootView: 'registries-root'
    }
  },
  watch: {
    isLeftPanelVisible () {
      this.$refs.map.updateSize()
    },
    isRightPanelVisible () {
      this.$refs.map.updateSize()
    }
  },
  computed: {
    ...mapState({
      views: state => state.views,
      selectedRegistry: state => state.registries.id,
      key: state => state.key,
      currentSection: state => state.currentSection,
      breadcrumb: state => state.breadcrumb
    }),
    view () {
      return this.views[this.rootView]
    },
    isMobileDisplay () {
      return this.isLeftPanelVisible && this.isRightPanelVisible
    },
    leftPanelComponentProps () {
      switch (this.view) {
        // Для списка реестров передаем groupId (приходит как пропс, берется из query маршрута)
        // groupId ограничивает список показываемых в списке реестров
        case 'RegistriesList':
        case 'registries-list':
          return { groupId: this.groupId }
        default: return {}
      }
    },
    isDestroyDisusedComponents () {
      return this.canDestroyComponent('registries-root')
    }
  },
  methods: {
    reset () {
      if (this.$refs.comp.reset) {
        this.$refs.comp.reset()
      }
    },
    destroyDisusedComponents () {
      this.destroyUnusedChildComponents(this.$refs.panelGroup, this.breadcrumb)
    }
  }
}
</script>
<style lang="stylus" scoped>
.registries-map-container
  height 100%
  border: 1px solid transparent;
</style>
