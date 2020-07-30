<template>
  <div class="flex-column">
    <breadcrumb :routes="breadcrumb" @click="navigate">
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

    <panel-group>
      <keep-alive>
        <router-view
          v-show="isLeftPanelVisible"
          :key="breadcrumbLastElement.key"
        />
      </keep-alive>
      <georesources-catalog-map
        :class="{'panel-hide': isMobileDisplay}"
        v-show="isRightPanelVisible"
        ref="map"
      />
    </panel-group>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import * as coreMutations from '^/state/mutations'
import GeoresourcesCatalogMap from '^/components/georesourcesCatalog/GeoresourcesCatalogMap'

export default {
  components: {
    GeoresourcesCatalogMap
  },
  data () {
    return {
      isLeftPanelVisible: true,
      isRightPanelVisible: true
    }
  },
  computed: {
    ...mapState({
      breadcrumb: state => state.breadcrumb,
      breadcrumbLastElement: state => state.breadcrumb.length ? state.breadcrumb[state.breadcrumb.length - 1] : {},
      currentModuleLink: state => state.currentModule.link
    }),
    isMobileDisplay () {
      return this.isLeftPanelVisible && this.isRightPanelVisible
    }
  },
  watch: {
    breadcrumb (newVal) {
      const lastElement = newVal[newVal.length - 1]
      this.$router.push(lastElement.routeParams)
    }
  },
  mounted () {
    this.$store.dispatch('georesourcesCatalog/navigate', {
      name: 'Каталог георесурсов',
      routeParams: {
        name: `${this.currentModuleLink}/georesourcesCatalogList`
      },
      root: true
    })
  },
  methods: {
    navigate (item) {
      this.$store.commit(coreMutations.BREADCRUMB_GO, item)
    },
    onLeftPanelToggle () {
      this.isLeftPanelVisible = !this.isLeftPanelVisible
      this.$refs.map.updateSize()
    },
    onRightPanelToggle () {
      this.isRightPanelVisible = !this.isRightPanelVisible
      this.$refs.map.updateSize()
    }
  }
}
</script>

<style scoped>
</style>
