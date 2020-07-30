<template>
  <panel-group>
    <index-info v-if="isVisible" :html="htmlInfo"/>
    <map-component ref="map" :isFullscreen="true"/>
  </panel-group>
</template>

<script>

import MapComponent from '^/components/map'
import IndexInfo from '^/components/IndexInfo'

export default {
  components: {
    MapComponent,
    IndexInfo
  },
  data () {
    return {
      htmlInfo: null
    }
  },
  computed: {
    isVisible () {
      return !!this.htmlInfo
    }
  },
  async mounted () {
    const result = await this.coreApi.loadHtml.loadIndexInfo()
    this.htmlInfo = result.content
    this.$refs.map.updateSize()
  }
}
</script>
