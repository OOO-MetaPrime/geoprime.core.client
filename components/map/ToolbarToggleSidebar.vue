<template>
  <button
    type="button"
    class="btn btn-icon hidden-xs"
    title="Управление картой"
    @click="$store.commit('MAP_TOGGLE_SIDEBAR')"
    :class="toggleButtonClass(isMapSidebarVisible)"
  >
    <i class="icon_gear"></i>
  </button>
</template>

<script>
import { mapState } from 'vuex'
import componentsMixin from '^/mixins/components'

export default {
  mixins: [componentsMixin],
  computed: {
    ...mapState({
      isMapSidebarVisible: state => state.isMapSidebarVisible
    })
  }
}
</script>
