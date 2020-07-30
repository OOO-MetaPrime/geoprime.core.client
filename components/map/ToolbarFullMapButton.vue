<template>
  <button
    type="button"
    class="btn btn-default btn-icon"
    v-if="map && defaultExtent"
    @click="onClick"
    title="Показать карту целиком"
  >
    <i class="icon_enlarge"></i>
  </button>
</template>

<script>
import { mapGetters } from 'vuex'
import { transformExtent } from '^/components/map/map.js'

export default {
  props: {
    map: Object
  },
  methods: {
    onClick () {
      const extent = transformExtent(this.defaultExtent)
      this.map.getView().fit(extent)
    }
  },
  computed: mapGetters([
    'defaultExtent'
  ])
}
</script>
