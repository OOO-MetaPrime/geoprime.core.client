<template>
  <panel 
    class="map-sidebar"
    :class="{'sidebar-slide-open': isOpenedSideBar}"
    :title="title"
    v-show="$store.state.isMapSidebarVisible"
  >
  <i class="hidden-sm hidden-md hidden-lg sidebar-slide-controller icon_minus_1" @click="toggleSideBar"></i>
    <div slot="heading-elements">
      <ul class="icons-list">
        <li>
          <a @click="closeSideBar">
            <i class="icon_cross btn btn-link"></i>
          </a>
        </li>
      </ul>
    </div>

    <div class="panel-body flex-column flex-1 correcter">
      <tabs class="tabbable flex-1 flex-column" v-model="activeTab">
        <tab title="Поиск">
          <div class="tab-content flex-1 map-search-tab">
            <search class="correcter" :map="map" :layers="layers" @bindToObject="bindToObject" @showdescription="showDescription"/>
          </div>
        </tab>
        <tab title="Слои">
          <div class="tab-content flex-1 map-layers-tab">
            <map-layers-manager
              :map="map"
              :layers="layers"
              @changeLayerFilter="$emit('changeLayerFilter', $event)"
            />
          </div>
        </tab>
        <tab title="Легенда">
          <div class="tab-content flex-1 map-legend-tab">
            <map-legend :layers="layers" />
          </div>
        </tab>
        <tab title="Каталог ПД">
          <div class="tab-content flex-1 map-catalog-tab">
            <layers-catalog 
              :map="map"
              :layers="layers"
            />
          </div>
        </tab>
      </tabs>
    </div>
  </panel>
</template>

<script>
import { mapState } from 'vuex'
import Search from './Search'
import MapLayersManager from './MapLayersManager'
import MapLegend from './MapLegend'
import LayersCatalog from './MapSidebarLayersCatalog'

export default {
  data () {
    return {
      isVisible: false,
      isOpenedSideBar: false,
      activeTab: 0
    }
  },
  props: {
    map: Object,
    layers: Array,
    title: String
  },
  components: {
    Search,
    MapLayersManager,
    MapLegend,
    LayersCatalog
  },
  watch: {
    searchResults () {
      // Отобразить вкладку "Поиск" при установке результатов поиска.
      this.activeTab = 0
    }
  },
  computed: {
    ...mapState([
      'searchResults'
    ])
  },
  methods: {
    bindToObject (feature) {
      this.$emit('bindToObject', feature)
    },
    toggleSideBar () {
      this.isOpenedSideBar = !this.isOpenedSideBar
    },
    closeSideBar () {
      this.isOpenedSideBar = false
      this.$emit('changeMode', null)
      this.$store.commit('MAP_CLOSE_SIDEBAR')
    },
    showDescription (value) {
      this.$emit('showdescription', value)
    }
  }
}
</script>

<style scoped>
.map-sidebar >>> .tab-content {
  display: flex;
  margin-bottom: 10px;
  overflow: auto;
  width: 100%;
}

.map-sidebar >>> .tab-content.map-layers-tab,
.map-sidebar >>> .tab-content.map-legend-tab {
  overflow: auto;
}
.map-sidebar >>> .tab-content.map-search-tab {
  overflow: hidden;
}
.map-sidebar > .custom-panel-heading > .heading-elements {
  flex: 1;
}
@media (min-width: 769px) {
  .map-sidebar {
    max-width: 400px;
  }
}
@media (max-width: 768px) {
  .map-sidebar >>> .nav-tabs {
    display: none;
  }
  >>> .tab-content {
    overflow: auto;
    height: 100%;
  }
  .map-sidebar {
    position: absolute;
    bottom: 0;
    height: max-content;
    /* width: 97%; */
    margin: 0;
    left: 0;
    right: 0;
  }
  .fullscreen-map > .map-sidebar {
    position: absolute;
    bottom: -5px;
    height: max-content;
    left: 0;
    width: 100%;
    margin: 0;
  }
  .sidebar-slide-controller {
    position: absolute;
    right: 50%;
    margin: 5px;
    left: 50%;
  }
  .fullscreen-map > .sidebar-slide-open,
  .sidebar-slide-open {
    height: 70%;
  }
}
.correcter {
  padding: 0 20px;
}
.map-sidebar >>> .tab-content.map-catalog-tab {
  height: 100%;
  overflow: auto;
}
@media print {
  .app {
    height: 100%;
  }
  .panel:not(.map-sidebar),
  .custom-panel-heading,
  .icons-list,
  .sidebar-slide-controller,
  .nav, >>> .nav-tabs {
    display: none !important;
  }
  .panel-hide {
    display: flex;
  }
  .fullscreen-map > .map-sidebar,
  .map-sidebar {
    top: 0;
    min-height: 95%;
    max-width: 100%;
  } 
}
.correcter {
  height: 100%;
  overflow: auto;
}
</style>
