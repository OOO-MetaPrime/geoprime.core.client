<template>
  <panel :title="title" >
    <template slot="body">
      <layer-attributes 
        :layer="layer" 
        :readOnlyLayer="readOnlyLayer"
        :isCardEdit="isCardEdit"
        :title="title"
      />
    </template>
  </panel>
</template>

<script>
import LayerAttributes from './LayerAttributes.vue'

export default {
  components: {
    LayerAttributes
  },
  props: {
    layer: Object,
    readOnlyLayer: {
      type: Boolean,
      defaultvalue: true
    },
    isCardEdit: Boolean
  },
  computed: {
    title () {
      if (!this.layer.name) {
        return 'Добавление слоя'
      }
      return `Сервис ПД ${this.layer.name}`
    }
  }
}
</script>

<style scoped>
.centered {
  align-items: center
}
.form-group {
  margin-bottom: 10px;
}
</style>

