<template>
  <div class="layers-catalog">
    <searchable-lazy-tree
      v-if="layersTree.length"
      :items="layersTree" 
      :value="value"
      @input="$emit('input', $event)"
      @selectItem="selectLayer"
      @deselectItem="deselectLayer"
      :disableCheckboxCondition="(item) => !item.id"
    />
  </div>
</template>

<script>
export default {
  components: {
  },
  props: {
    value: {
      type: Array,
      default () {
        return []
      }
    }
  },
  data () {
    return {
      layersTree: [],
      layersHash: {},
      selectedModel: []
    }
  },
  watch: {
    value: {
      deep: true,
      handler: 'emitSelectedInfo'
    },
    selectedModel: {
      deep: true,
      handler: 'emitSelectedInfo'
    }
  },
  async created () {
    this.layersTree = await this.coreApi.layers.getLayersTree()
    this.visit(this.layersTree, x => {
      if (x.id) {
        this.layersHash[x.id] = x
      }
    })
    this.emitSelectedInfo()
  },
  methods: {
    emitSelectedInfo () {
      const layersInfo = []
      for (const layerId of this.value) {
        const layer = this.layersHash[layerId]
        if (layer) {
          layersInfo.push(layer)
        }
      }
      this.$emit('selectedInfoChanged', layersInfo)
    },
    visit (rootArray, forEach) {
      rootArray.forEach(root => {
        forEach(root)
        this.visit(root.children, forEach)
      })
    },
    getLayer (layerId) {
      return this.layersHash[layerId]
    },
    selectLayer (e) {
      this.$emit('selectLayer', this.getLayer(e.id))
    },
    deselectLayer (e) {
      this.$emit('deselectLayer', this.getLayer(e.id))
    }
  }
}
</script>

<style lang="stylus" scoped>
@media (max-width 768px) 
  .search-pd-catalog
    margin 10px 0 0 0
</style>


