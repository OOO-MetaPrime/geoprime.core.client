<template>
  <span></span>
</template>

<script>
import { identify } from './identify'
import objectSearch from './objectSearch'

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
  methods: {
    activate () {
      this.map.on('singleclick', this.onClick)
      this.isActive = true
    },
    deactivate () {
      if (!this.isActive) {
        return
      }
      this.map.un('singleclick', this.onClick)
      this.isActive = false
    },
    async onClick (event) {
      this.$closeAllNotifications()
      // Метод identify принимает слои в такой структуре.
      const layers = this.layers
        .map(x => ({
          ...x.layer,
          view: x.mapLayer
        }))
      this.$notice('Получение объектов в точке...', { hide: false, animation: 'none' })
      try {
        const features = await identify(this.map, layers, event.coordinate)

        // Приводим к результатам поиска.
        for (const feature of features) {
          await objectSearch.processFeature(feature)
        }

        this.$emit('changeMode')

        this.$store.dispatch('setSearchResults', features)
        this.$closeAllNotifications()

        if (!features.length) {
          this.$notice('Не найдено ни одного объекта.')
        } else {
          this.$success('Объекты найдены. Для каждого слоя получено до 30 объектов.')
        }
      } catch (error) {
        this.$error('Ошибка идентификации слоев в точке.')
      }
    }
  }
}
</script>

<style scoped>

</style>