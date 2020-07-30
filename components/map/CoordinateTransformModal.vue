<template>
  <modal-dialog v-model="isShown" title="Координаты объекта (json)" size="sm" append-to-body>
    <select2
      title="Выбранная система координат"
      text="title"
      class="form-control"
      :data="sridList"
      v-model="selectedSrid"
    />
    <div slot="footer">
      <button
        class="btn btn-default btn-icon"
        type="button"
        :disabled="!selectedSrid"
        @click="downloadJson"
      >
        <i class=" icon_file_download" title="Сохранить в файл"></i>
      </button>
      <button
        class="btn btn-default bth-icon"
        :disabled="!selectedSrid"
        type="button"
        @click="copyJson"
      >
        <i class="icon_copy" title="Копировать"></i>
      </button>
      <button
        class="btn btn-default btn-icon"
        type="button"
        @click="closeModal"
      >
        <i class="icon_close" title="Закрыть"></i>
      </button>
    </div>
  </modal-dialog>
</template>

<script>
import WKT from 'ol/format/wkt'
import { mapState } from 'vuex'

export default {
  components: {
  },
  props: {
    geometry: {
      required: true
    },
    featureSrid: String
  },
  watch: {
    featureSrid: {
      handler: async function (newValue) {
        if (!newValue) {
          return
        }
        const code = newValue.match(/\d*$/) || []
        this.featureCode = code.length ? parseInt(code[0], 10) : null

        this.sridList = await this.coreApi.pdCards.getCoordinateSystems()
        this.selectedSrid = this.findSridId(this.settingsProfile.coordinateSystem) || this.findSridId(this.featureCode)
      }
    }
  },
  computed: {
    wkt () {
      return new WKT()
    },
    ...mapState({
      settingsProfile: state => state.settingsProfile
    })
  },
  data () {
    return {
      sridList: [],
      selectedSrid: null,
      featureCode: null,
      transformedGeometry: null,
      isShown: false,
      isCopySuccess: null
    }
  },
  methods: {
    closeModal () {
      this.isShown = false
    },
    openModal () {
      this.isShown = true
    },

    async transform () {
      const encodedGeometry = this.transformToGeometryString()
      if (!encodedGeometry || !this.selectedSrid) {
        this.$error('Не удалось получить геометрию')
        return
      }
      this.blockUI(this.$el, true)
      const wkid = this.sridList.find(el => el.id === this.selectedSrid) || null
      if (!wkid || !wkid.wkid) {
        this.$error('Ошибка трансформации геометрии')
        return
      }
      try {
        const trGeometry = await this.coreApi.pdCards.getTransformGeometry(encodedGeometry, this.featureCode, wkid.wkid)
        this.transformedGeometry = this.addCrsToShape(JSON.parse(trGeometry), wkid.wkid)
      } catch (err) {
        this.transformedGeometry = null
        this.$error('Ошибка трансформации геометрии')
        console.error(err)
      } finally {
        this.blockUI(this.$el, false)
      }
    },
    addCrsToShape (shape, srid) {
      shape.crs = {
        type: 'name',
        properties: {
          name: `EPSG:${srid}`
        }
      }
      return JSON.stringify(shape)
    },
    transformToGeometryString () {
      return this.wkt.writeGeometry(this.geometry)
    },
    async copyJson () {
      await this.transform()
      if (!this.transformedGeometry) {
        return
      }
      navigator.clipboard.writeText(this.transformedGeometry)
      .then(() => this.$success('Скопированно в буфер'))
      .catch(err => {
        this.$error('Ошибка копирования в буфер')
        console.error(err)
      })
    },
    async downloadJson () {
      await this.transform()
      if (!this.transformedGeometry) {
        return
      }
      const url = window.URL.createObjectURL(new Blob([this.transformedGeometry]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'coordinates.json')
      document.body.appendChild(link)
      link.click()
    },
    findSridId (srid) {
      const item = this.sridList.find(el => el.wkid === srid)
      return item ? item.id : null
    }
  }
}
</script>