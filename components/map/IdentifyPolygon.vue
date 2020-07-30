<template>
  <button
    type="button"
    class="btn btn-default btn-icon hidden-xs"
    :class="toggleButtonClass(isActive)"
    title="Получить информацию по объектам в определенной области"
    @click="click"
  >
    <i class="icon_select"></i>
  </button>
</template>

<script>
import Draw from 'ol/interaction/draw'
import { identifyRegion } from './identify'
import componentsMixin from '^/mixins/components'

export default {
  props: {
    map: Object,
    layers: Array
  },
  data () {
    return {
      isActive: false
    }
  },
  mixins: [componentsMixin],
  methods: {
    click () {
      this.isActive ? this.deactivate() : this.activate()
      this.$emit('click', this.isActive)
    },
    activate () {
      this.draw = new Draw({ type: 'Polygon' })
      this.draw.on('drawend', this.onDrawEnd)

      this.map.addInteraction(this.draw)

      this.isActive = true
    },
    deactivate () {
      this.map.removeInteraction(this.draw)

      this.isActive = false
    },
    async onDrawEnd (event) {
      this.$closeAllNotifications()

      this.$notice('Получение объектов по выбранной территории...', { hide: false, animation: 'none' })
      try {
        const geometry = event.feature.getGeometry()

        const results = await identifyRegion(this.map, this.layers, geometry)

        this.$closeAllNotifications()

        this.$store.dispatch('setSearchResults', results)
        if (!results.length) {
          this.$notice('Не найдено ни одного объекта.')
        } else {
          this.$success('Объекты найдены. Для каждого слоя получено до 30 объектов.')
        }
      } catch (error) {
        this.$closeAllNotifications()
        throw error
      }
    }
  }
}
</script>
