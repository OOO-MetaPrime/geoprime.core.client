<template>
  <panel>
    <div slot="heading-elements">
      <button
        :disabled="canCreate || readonly || isArchive"
        type="button"
        class="btn btn-default btn-icon"
        title="добавить информацию о слое"
        @click="addLayer"
      >
        <i class="icon_bigplus"></i>
      </button>

      <button
        :disabled="readonly || isArchive || !selectedItem"
        type="button"
        class="btn btn-default btn-icon"
        title="Удалить слой"
        @click="removeLayer"
      >
        <i class="icon_bin"></i>
      </button>

      <button type="button" class="btn btn-default btn-icon" title="Экспорт">
        <i class="icon_download"></i>
      </button>
    </div>

    <memory-data-table
      class="flex-1"
      filterable
      sortable
      pagable
      selectable
      :columns="columns"
      :items="value"
      v-model="selectedItem"
    />

    <modal-dialog
      v-model="isModalVisible"
      :title="title"
    >
      <div slot="footer">
        <btn v-show="canUpdate" @click="cancel">Отмена</btn>
        <btn type="primary" @click="acceptChanges">ОК</btn>
      </div>
      <layer-attributes
        :layer="copyLayer"
        ref="geo"
        :readonly="!canUpdate"
        @clearOptions="clearOptions"
      />
    </modal-dialog>
  </panel>
</template>

<script>
import LayerAttributes from '^/components/map/LayerAttributes'
import { getGeometryType } from '^/components/map/map'
import { mapState } from 'vuex'

export default {
  components: {
    LayerAttributes
  },
  props: {
    readonly: Boolean,
    value: Array,
    isArchive: Boolean,
    canUpdateCard: Boolean
  },
  data () {
    return {
      isModalVisible: false,
      selectedItem: null,
      copyLayer: { },
      orderIndex: null
    }
  },
  computed: {
    ...mapState({
      geometryTypes: state => state.enums.public.GeometryTypes,
      layerTypes: state => state.enums.public.LayerTypes,
      resources: state => state.resources,
      actions: state => state.actions
    }),
    columns () {
      return [
        {
          title: 'Слой',
          field: 'name',
          type: { type: 'link', onClick: item => this.openLayer(item) }
        }
      ]
    },
    canCreate () {
      return this.$store.state.user.can(this.resources.layer, this.actions.create) && this.readonly
    },
    canUpdate () {
      return this.$store.state.user.can(this.resources.layer, this.actions.update) && this.canUpdateCard
    },
    isValidated () {
      return this.$refs.geo.requiredOptionList.every(x => this.validateTextValue(this.copyLayer[x]))
    },
    title () {
      return (!this.copyLayer.name) ? 'Добавление слоя' : `Сервис ПД ${this.copyLayer.name}`
    }
  },
  mounted () {
    this.copyLayer = this.getLayerTemplate()
  },
  methods: {
    getLayerTemplate () {
      return {
        name: null,
        layerType: null,
        url: null,
        serviceLayersValue: null,
        tokenUrl: null,
        serviceLogin: null,
        servicePassword: null,
        ignoreGetMapUrl: false,
        created: null,
        id: null,
        geometryType: this.geometryTypes.point
      }
    },
    openLayer (item) {
      this.orderIndex = this.value.indexOf(item)
      this.copyLayer = { ...item, edited: true }
      this.layer = { ...this.copyLayer }
      this.isModalVisible = true
    },

    addLayer () {
      this.isModalVisible = true
      this.copyLayer = { ...this.getLayerTemplate() }
    },

    validateTextValue (value) {
      return value && String(value).trim()
    },

    async acceptChanges () {
      if (!this.isValidated) {
        this.$error('Заполните все обязательные поля')
        return
      }

      await this.getGeometryType()

      if (this.copyLayer.edited) {
        if (this.copyLayer.url) {
          this.copyLayer.url = this.copyLayer.url.trim()
        }
        const newValue = this.value.map((x, i) => {
          if (i === this.orderIndex) {
            return { ...this.layer, ...this.copyLayer }
          }
          return x
        })
        this.$emit('layersUpdated', newValue)
        this.isModalVisible = false
        return
      }

      this.$emit('addLayer', this.copyLayer)
      this.isModalVisible = false
    },

    async getGeometryType () {
      const { url, layerType, serviceLayersValue } = this.copyLayer
      if (layerType !== this.layerTypes.wfs) {
        this.copyLayer.geometryType = this.geometryTypes.point
        return
      }
      this.copyLayer.geometryType = await getGeometryType(url, serviceLayersValue)
    },

    async removeLayer () {
      const { isUse, layersName } = await this.coreApi.pdCards.checkPdCardLayers([this.selectedItem])
      if (isUse) {
        this.$error(`Указанная настройка используется в "Пространственные связи", следующих георесурсов:
        ${layersName}.Изменение недоступно. Сначала выполните изменение настроек георесурсов.`)
        return
      }
      if (!this.selectedItem.id) {
        const elemIndex = this.value.indexOf(this.selectedItem)
        this.value.splice(elemIndex, 1)
        return
      }
      const result = await this.coreApi.pdCards.checkLayers({
        layers: [this.selectedItem],
        isRemoveCard: false
      })

      const confirmMessage = 'Вы уверены, что хотите удалить выбранный слой?' +
        `${result.message !== 'ok' ? ` ${result.message}` : ''}`

      if (!await this._confirm(confirmMessage)) {
        return
      }
      const newValue = this.value.filter(x => this.selectedItem.id !== x.id)
      this.$emit('layersUpdated', newValue)
    },

    clearOptions (layer) {
      const newLayer = { ...this.getLayerTemplate(), ...layer }
      this.copyLayer = newLayer
    },

    cancel () {
      this.isModalVisible = false
    }
  }
}
</script>
