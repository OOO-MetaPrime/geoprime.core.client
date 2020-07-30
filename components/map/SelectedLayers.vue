<template>
  <div class="row">
    <div class="col-md-6 correcter">
      <label><strong> Включенные по умолчанию пространственные слои </strong></label>
      <layers-catalog
        v-model="selectedLayers"
        ref="layersCatalog"
        @selectLayer="selectLayer"
        @deselectLayer="deselectLayer"
      />
    </div>
    <div class="col-md-6 flex-column correcter">
      <label><strong> Выбранные слои </strong></label>
      <ul class="media-list flex-1 layers-catalog">
        <draggable
          v-model="selectedLayersSettingsModel"
          v-bind="draggableOptions"
          @end="changeLayersOrder"
        >
          <li
            class="media-list-item"
            v-for="layer in selectedLayersSettingsModel"
            :key="layer.layerId"
          >
            <span class="flex-1"> {{ layer.name }} </span>
            <slider
              :min="0"
              :max="100"
              :start="layer.opacity * 100"
              @update="changeOpacity($event, layer)"
            />
            <button
              class="btn btn-flat btn-icon"
              title="Видимость"
              @click="changeVisibility(layer)"
            >
              <i v-if="layer.isVisible" class="icon_eye" />
              <i v-else class="icon_eye_blocked"></i>
            </button>
            <button
              class="btn btn-flat btn-icon"
              title="Удалить"
              @click="removeLayer(layer)"
            >
              <i class="icon_cross"></i>
            </button>
          </li>
        </draggable>
      </ul>
    </div>
  </div>
</template>

<script>
import LayersCatalog from './LayersCatalog'
import Draggable from 'vuedraggable'

export default {
  components: {
    LayersCatalog,
    Draggable
  },
  props: {
    selectedLayersSettings: {
      type: Array,
      default: () => []
    },
    initialSelectedlayers: {
      type: Array,
      default: () => []
    }
  },
  data () {
    return {
      selectedLayers: [],
      draggableOptions: {
        // Нажатие на элементы с данными классами не вызывает перетаскивание
        filter: '.slider, .btn',
        // Если слайдер добавлен в фильтер и данная опция = true  - ползунок не перетаскивается
        preventOnFilter: false
      },
      selectedLayersSettingsModel: [...this.selectedLayersSettings]
    }
  },
  watch: {
    initialSelectedlayers: {
      immediate: true,
      handler () {
        this.selectedLayers = this.initialSelectedlayers.map(x => x.layerId)
      }
    },
    selectedLayersSettings (value) {
      this.selectedLayersSettingsModel = [...value]
    }
  },
  methods: {
    removeLayer (layer) {
      const index = this.selectedLayersSettings.indexOf(layer)
      const moduleLayersIndex = this.selectedLayers.indexOf(layer.id)
      this.selectedLayersSettings.splice(index, 1)
      this.selectedLayers.splice(moduleLayersIndex, 1)
    },
    changeOpacity (opacityValue, layer) {
      layer.opacity = opacityValue / 100
    },
    changeVisibility (layer) {
      layer.isVisible = !layer.isVisible
    },
    selectLayer (layer) {
      const layerOptions = {
        opacity: 1,
        isVisible: true,
        sortOrder: this.selectedLayers.length + 1,
        name: layer.name,
        layerId: layer.id
      }
      this.selectedLayersSettings.push(layerOptions)
    },
    deselectLayer (layer) {
      const foundLayer = this.selectedLayersSettingsModel.find(x => x.layerId === layer.id)
      if (!foundLayer) {
        return
      }
      this.removeLayer(foundLayer)
    },
    changeLayersOrder () {
      this.selectedLayersSettingsModel.forEach((x, i) => {
        x.sortOrder = i + 1
      })
      this.$emit('update:selectedLayersSettings', this.selectedLayersSettingsModel)
    }
  }
}
</script>

<style lang="stylus" scoped>
.layers-catalog
  overflow auto
.selected-layer-item
  align-items center
.media-list-item
  display flex
  align-items center
.correcter
  overflow auto
  overflow-x hidden
  height 100%
</style>
