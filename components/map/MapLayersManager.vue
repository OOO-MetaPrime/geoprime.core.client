<template>
  <ul class="media-list flex-1">
    <draggable 
      v-model="publishedLayers"
      v-bind="draggableOptions"  
      @end="changeLayersOrder" 
    >
      <li 
        class="layer-item flex-row" 
        v-for="(layer, layerIndex) in publishedLayers" 
        :key="layerIndex"
      >
        <span class="flex-1 layer-name"> {{ layer.layer.name }} </span>
        <slider 
          :min="0" 
          :max="100" 
          :start="layer.mapLayer.values_.opacity * 100" 
          @update="changeOpacity($event, layer)" 
        />
        <button 
          class="btn btn-flat btn-icon"
          title="Видимость" 
          @click="changeVisibility(layer)" 
        >
          <i v-if="layer.mapLayer.values_.visible" class="icon_eye"></i>
          <i v-else class="icon_eye_blocked"></i>
        </button>
        <button 
          class="btn btn-flat btn-icon"
          title="Приблизить к слою" 
          @click="zoomToLayer(layer)" 
        >
          <i class="icon_zoomin"></i>
        </button>
        <icon-button 
          v-if="layer.layer.isShowFilterIcon"
          class="layer-object-filter" 
          :link="true"
          :primary="layer.layer.isFiltered"
          icon="icon_filter_off"
          primaryIcon="icon_filter_on"
          @click="$emit('changeLayerFilter', layer)"
        />
        <button 
          class="btn btn-flat btn-icon"
          title="Удалить слой с карты" 
          :disabled="layer.layer.disableRemove"
          @click="removeLayer(layer)" 
        >
          <i class="icon_cross"></i>
        </button>
      </li>
    </draggable>
  </ul>
</template>

<script>
import Draggable from 'vuedraggable'
import { setLayerExtent } from './map'
import removeLayerHelper from './removeLayerHelper'

export default {
  props: {
    map: Object,
    layers: Array
  },
  components: {
    Draggable
  },
  data () {
    return {
      draggableOptions: {
        // Нажажите на элементы с данными классами не вызывает перетаскивание
        filter: '.slider, .btn',
        // Если слайдер добавлен в фильтер и данная опция = true  - ползунок не перетаскивается
        preventOnFilter: false
      },
      publishedLayers: []
    }
  },
  watch: {
    layers (layers) {
      // Используем все добавленные на карту слои, кроме подложек
      this.publishedLayers = layers.filter(x => !x.layer.isBasemap)
      this.changeLayersOrder()
    }
  },
  methods: {
    removeLayer (layer) {
      removeLayerHelper({ layer, layers: this.layers, map: this.map })
    },
    changeOpacity (opacityValue, layer) {
      layer.mapLayer.setOpacity(opacityValue / 100)
    },
    changeVisibility (layer) {
      const isVisible = layer.mapLayer.values_.visible
      layer.mapLayer.setVisible(!isVisible)
    },
    zoomToLayer ({ layer, mapLayer }) {
      setLayerExtent(this.map, { layer, mapLayer })
    },
    changeLayersOrder () {
      const length = this.publishedLayers.length
      this.publishedLayers.forEach((x, i) => {
        // Самый первый слой в массиве получает самый большой индекс и отображается поверх всех и т.д.
        x.mapLayer.setZIndex(length - i)
      })
    }
  }
}
</script>

<style lang="stylus" scoped>
.layer-object-filter
  margin-right 10px
.layer-item
  border-bottom-style solid 
  border-color  #ddd
  border-width 1px
  align-items center
  margin-bottom  5px
  padding-bottom 5px
  cursor: move
>>> .slider {
  margin-right 5px
}
.layer-name
  margin-right: 5px
</style>
