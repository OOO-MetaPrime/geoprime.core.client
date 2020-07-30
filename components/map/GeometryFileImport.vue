<template>
<div class="file-import-container">
  <div class="coordinates">
    <div class="list-container">
      <select2 class="form-control" :data="sridList" v-model="selectedSrid" />
      <form-row>
        <form-group title="" inputGroup>
          <text-input
            :readonly="true"
            :value="selectedFileName"
            :title="selectedFileName"
          />
          <input-group-text-button title="Выбрать" tooltip="Выбрать файл" @click="selectFile" />
        </form-group>
      </form-row>
      <div class="wrapper">
        <vue-switch v-model="isChangeCoords" :readonly="ext !== 'csv'"></vue-switch>
        <label>переворот координат</label>
      </div>
      <file-selector ref="fileSelector" @changed="onFileSelected" :filter="'.shp, .csv, .mif, .xml'" />
    </div>
  </div>
  <div class="file-import-buttons">
    <!-- <div class="file-stats">
      <span></span>
    </div> -->
    <text-button @click="importGeometries" :disabled="!selectedFile" title="Загрузить"/>
    <text-button @click="cancel" title="Отмена"/>
  </div>
</div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  components: {
  },
  data () {
    return {
      sridList: [],
      selectedSrid: null,
      selectedFile: null,
      isChangeCoords: true,
      ext: null
    }
  },
  computed: {
    ...mapState({
      profile: state => state.settingsProfile
    }),
    selectedFileName () {
      if (!this.selectedFile) {
        return 'Не выбран'
      }

      return this.selectedFile.name
    },
    selectedCoordinateProjection () {
      if (!this.selectedSrid) {
        return null
      }

      return this.sridList.find(x => x.id === this.selectedSrid)
    }
  },
  async mounted () {
    const coordinateProjections = await this.coreApi.classifier.getCoordinateProjectionList()
    this.sridList = coordinateProjections
    this.setDefaultSrid()
  },
  methods: {
    selectFile () {
      this.$refs.fileSelector.selectFile()
    },
    onFileSelected (file) {
      this.selectedFile = file
      this.ext = file.name.split('.').pop()
    },
    async importGeometries () {
      try {
        this.blockUI(this.$el, true)
        const result = await this.coreApi.map.importGeometryFromFile({
          file: this.selectedFile,
          isChangeCoords: this.isChangeCoords
        })
        if (result.error) {
          this.$error(result.error)
          return
        }

        this.$success('Геометрии успешно загружены')
        this.$emit('featuresLoaded', { features: result, wkid: this.selectedCoordinateProjection.wkid })
      } catch (err) {
        console.error(err)
        this.$success('Ошибка загрузки геометрий')
      } finally {
        this.blockUI(this.$el, false)
      }
    },
    cancel () {
      this.$emit('cancel')
    },
    getCoordinateSystem (srid) {
      return this.sridList.find(x => x.wkid === srid)
    },
    setDefaultSrid () {
      const profileCoordinateSystem = this.profile.coordinateSystem ? this.getCoordinateSystem(this.profile.coordinateSystem) : this.getCoordinateSystem(3857)
      if (profileCoordinateSystem) {
        this.selectedSrid = profileCoordinateSystem.id
      }
    }
  }
}
</script>

<style lang="stylus" scoped>
.row
  margin-top 5px
  margin-bottom 5px
.file-import-container
  background #fff
  display flex
  flex-direction column
.file-import-buttons
  display flex
  justify-content flex-end
  .text-button
    margin-right 5px
.file-stats
  align-self center
  flex 1
  margin-left 5px
  margin-right 5px
.wrapper
  display flex
  align-items center
  justify-content space-between
  padding 0 3%
  label 
    font-size 15px
</style>