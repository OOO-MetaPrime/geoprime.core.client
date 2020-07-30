<template>
  <record-card
    :item="item"
    :registry="card.registry"
    :mode="card.mode"
    :key="card.id"
    ref="cards"
    :handlers="cardHandlers"
    v-if="item"
    @saved="saved"
    :isChanged="isChanged"
    @onChanged="onChanged"
    @onBack="onBack"
    :rootView="rootView"
    :territoryFilter="territoryFilter"
    :showBack="showBack"
    :modal="isModalView"
    :id="id"
  />
</template>

<script>

import RecordCard from './RecordCard'
import _cloneDeep from 'lodash/cloneDeep'
import mapEventActions from '^/components/map/mapActions'
import mapEventsMixin from '^/mixins/mapEvents'
import { updateFilters } from '^/components/map/map'

export default {
  props: ['id', 'rootView', 'territoryFilter', 'showBack', 'isModalView', 'isSkipLayerAdding'],
  components: {
    RecordCard
  },
  mixins: [mapEventsMixin],
  data () {
    return {
      isChanged: false,
      flag: null,
      isGisIdChanged: false,
      card: _cloneDeep(this.id),
      item: null,
      cardHandlers: {}
    }
  },
  mounted () {
    this.cardHandlers = {
      downloadExcelTemplate: this.downloadExcelTemplate,
      uploadExcel: this.uploadExcel,
      exportRegistry: this.exportRegistry,
      deleteItem: this.deleteItem,
      addItem: this.addItem,
      editItem: this.editItem,
      viewItem: this.id.viewItem,
      addLayerOnMap: this.addLayerOnMap,
      pickObjectOnMap: this.pickObjectOnMap
    }

    this.onBroadcastEventFromMap(mapEventActions.CHANGE_GEOMETRY, this.changeGeometry)
  },
  async activated () {
    const clone = _cloneDeep(this.card.item)
    clone.files = []
    clone.newFiles = []
    this.item = clone
  },
  methods: {
    changeGeometry (payload) {
      const { layer, entityOptions } = payload
      const { field, value, mode, layerFieldValue } = entityOptions

      if (!this.item || !field || mode === 'edit') {
        return
      }

      if (mode === 'delete' && this.item[field] !== layerFieldValue) {
        return
      }

      if (value) {
        this.item[field] = value
        this.isChanged = this.isChanged
        this.flag = this.isChanged
      } else {
        this.item[field] = null
        this.isChanged = this.isChanged
        this.flag = this.isChanged
      }

      if (mode === 'create') {
        this.emitEventToMap(mapEventActions.SHOW_REGISTRY_OBJECT, {
          record: _cloneDeep(this.item)
        })
      }

      if (!('isFiltered' in layer) || !layer.objects) {
        return
      }

      const objIndex = layer.objects.findIndex(x => x.id === this.item.id)

      if (~objIndex) {
        layer.objects[objIndex][field] = value
      } else {
        layer.objects.push(this.item)
      }

      if (layer.isFiltered) {
        updateFilters(layer, layer.view)
      }
    },
    reset () {
      this.card = null
      this.item = null
    },
    saved () {
      const isCreated = this.card.mode === 'create'
      if (isCreated) {
        this.card.mode = 'edit'
      }
      this.$store.dispatch('registries/selectRecord', { ...this.item })
      this.emitEventToMap(mapEventActions.SHOW_REGISTRY_OBJECT, {
        record: this.item,
        isSkipLayerAdding: this.isSkipLayerAdding
      })

      // Обновляем состояние в гриде
      this.$store.dispatch('registries/recordsChanged', false)
    },
    onChanged (value) {
      if (this.flag === null && value === true) {
        this.isChanged = true
      }
      if (this.flag === null && value === false) {
        this.isChanged = false
      }
      if (this.flag === true && value === true) {
        this.isChanged = true
        this.flag = null
      }
      if (this.flag === true && value === false) {
        this.isChanged = false
        this.flag = null
      }
      if (this.flag === false) {
        this.flag = null
        return
      }
    },
    onBack () {
      this.$emit('onBack')
    }
  }
}
</script>
