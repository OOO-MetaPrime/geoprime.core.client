<template>
  <div v-if="item && registry" class="flex flex-column full-height">
    <div class="file-list-group loaded-files-container">
      <div v-if="isShowSystemCoordinates">
        <select2 :data="systemCoordinates" v-model="selectedSystemCoordinate" style="width:50%;"/>
      </div>
        <registry-file-list
          :registry="registry"
          :record="item"
          v-model="item.files"
          :readonly="!editable"
          @listChanged="reloadFiles"
          @rename="rename"
          @input="remove"
          :showImageButtons="showImageButtons"
        />
    </div>
    <div class="file-list-group">
      <div v-if="isShowSystemCoordinates">
        <select2 :data="systemCoordinates" v-model="selectedSystemCoordinate" style="width:50%;"/>
      </div>
      <registry-files-upload
        v-if="editable"
        ref="uploader"
        @uploaded="reloadFiles"
        :value="value"
        @input="input"
        @changed="$emit('changed')"
      />
    </div>
  </div>
</template>

<script>
import RegistryFileList from './RegistryFileList.vue'
import RegistryFilesUpload from './RegistryFilesUpload.vue'
import { mapState } from 'vuex'

export default {
  props: {
    registry: Object,
    item: Object,
    mode: String,
    editable: Boolean,
    value: Array,
    isShowSystemCoordinates: Boolean,
    showImageButtons: {
      type: Boolean,
      default: true
    }
  },
  components: {
    RegistryFileList,
    RegistryFilesUpload
  },
  data () {
    return {
      isFileAdded: false,
      systemCoordinates: [{
        id: '4326',
        name: 'EPSG: 4326 WGS 84'
      }, {
        id: '3857',
        name: 'EPSG:3857 WEB-MERKATOR'
      }, {
        id: '900711',
        name: 'EPSG:90711 Тульская (Местная)'
      }],
      selectedSystemCoordinate: '4326',
      busy: false
    }
  },
  computed: {
    ...mapState({
      newGeometry: state => state.events.newGeometry
    })
  },
  methods: {
    async reloadFiles () {
      const files = await this.coreApi.registry.getItemFiles(this.item[this.registry.primaryKeyColumn.key], this.registry.id)
      this.item.files = files
      this.isFileAdded = false
    },
    getCurrentProjection () {
      return parseInt(this.selectedSystemCoordinate)
    },
    uploadNotUploadedFiles () {
      if (this.isFileAdded) {
        this.$refs.uploader.uploadNotUploadedFiles()
      }
    },
    add (file) {
      this.$refs.uploader.add(file)
    },
    clear () {
      this.$refs.uploader.clear()
    },
    input (event) {
      this.$emit('input', event)
    },
    rename () {
      this.$emit('rename')
    },
    remove () {
      this.$emit('remove')
    }
  }
}
</script>

<style lang="stylus" scoped>
.file-list-group
  min-height 200px
  overflow auto
  flex 1
.loaded-files-container
  flex 2
  margin-bottom 5px
</style>
