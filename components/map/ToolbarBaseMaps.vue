<template lang="pug">
  dropdown
    btn.dropdown-toggle.btn-icon(style="width: 36px" :active="false" v-model="show" title="Топографические основы")
      i.icon_stack
      | &nbsp;
    template(slot="dropdown")
      li(v-for="(basemap, index) in basemaps" :key="index" :class="{ 'active' : basemap === selected }" @click.stop="changeBasemap(basemap)")
        a.basemap-item
          span {{ basemap.name }}
          slider(v-show="basemap === selected" :min="0" :max="100" :start="basemap.opacity" @update="changeOpacity")
</template>

<script>
import cloneDeep from 'lodash/cloneDeep'
import { mapState } from 'vuex'

export default {
  props: {
    map: Object,
    layers: Array
  },
  components: {
  },
  data () {
    return {
      basemaps: [],
      selected: null,
      show: false
    }
  },
  mounted () {
    this.basemaps = cloneDeep(this.settingsProfile.basemaps)
      .map(x => ({
        id: x.card.id,
        name: x.card.name,
        // В методе exchangeBasemaps объекты изменяются
        layers: x.layers,
        opacity: 100
      }))

    // Топооснова по умолчанию
    this.selected = this
      .basemaps
      .find(x => x.id === this.settingsProfile.defaultMapId)
  },
  computed: mapState([
    'settingsProfile'
  ]),
  methods: {
    changeOpacity (opacity) {
      // Необходимо для метода exchangeBasemaps
      this.selected
        .layers
        .forEach(x => (x.opacity = opacity))

      this.layers
        .filter(x => x.layer.isBasemap)
        .forEach(x => x.mapLayer.setOpacity(opacity / 100))
    },
    changeBasemap (basemap) {
      if (basemap === this.selected) {
        return
      }
      this.selected = basemap
      this.$emit('exchangeBasemaps', basemap.layers)
    }
  }
}
</script>

<style lang="stylus" scoped>
.basemap-item > span
  margin-right 15px
  width  100px
  overflow hidden
  text-overflow: ellipsis
.basemap-item
  display flex
  width 250px
  align-items center
  span
    flex 1  
@media (max-width 768px) 
  .basemap-item
    width 100%
</style>