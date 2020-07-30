<template>
  <div class="input-group">
    <div class="uploader">
      <input type="file" :title="title" class="file-styled form-control" :id="id" :name="name" :value="dataSelectedFileName" :disabled="readonly" :multiple="multiple" :accept="accept" @change="onFileSelected" ref="fileInput" />
      <span class="filename">{{ filename }}</span>
      <span v-if="!readonly" class="action btn btn-default btn-icon"><i class="icon_bigplus"></i></span>
    </div>
    <span v-if="!readonly" class="input-group-btn">
      <button class="btn btn-default btn-icon" @click="deleteFile"><i class="icon_cross"></i></button>
    </span>
  </div>
</template>

<script>
export default {
  props: {
    value: String,
    id: String,
    name: String,
    disabled: Boolean,
    required: Boolean,
    placeholder: String,
    accept: String,
    multiple: Boolean,
    editable: Boolean,
    autoOpen: Boolean,
    readonly: Boolean,
    deleteFile: Function
  },
  data () {
    return {
      maxFileSize: null,
      filesStore: null,
      filename: this.value,
      dataSelectedFileName: null
    }
  },
  computed: {
    title () {
      return this.filename ? ' ' : 'Файл не выбран'
    }
  },
  watch: {
    value () {
      if (!this.value) {
        this.dataSelectedFileName = ''
      }
      this.filename = this.value
    },
    filename (value) {
      this.$emit('input', value)
    }
  },
  mounted () {
    if (this.autoOpen) {
      this.openPicker()
    }
  },
  methods: {
    getMultipleName (files) {
      let names = [];

      [...files].forEach((file) => {
        names.push(file.name)
      })

      return names.join(', ')
    },
    openPicker () {
      if (!this.disabled) {
        this.$refs.fileInput.click()
        this.$refs.textInput.$el.focus()
      }
    },
    onFileSelected ($event) {
      const files = $event.target.files || $event.dataTransfer.files
      const defaultMaxFileSize = 10 * 1024 * 1024
      this.maxFileSize = this.$store.state.systemParameters.maxFileSize * (1024 * 1024) || defaultMaxFileSize
      this.filesStore = this.$store.state.systemParameters.filesStore
      if (files[0].size > this.maxFileSize && this.filesStore) {
        this.$error(`Размер файла не должен превышать ${this.maxFileSize / (1024 * 1024)} МБ`)
        return
      }
      if (files[0].size > this.maxFileSize && !this.filesStore) {
        this.$error(`Размер файла не должен превышать ${this.maxFileSize / (1024 * 1024)} МБ`)
        return
      }
      if (files) {
        if (files.length > 1) {
          this.filename = this.getMultipleName(files)
        } else if (files.length === 1) {
          this.filename = files[0].name
        } else {
          this.filename = null
        }
      } else {
        this.filename = $event.target.value.split('\\').pop()
      }

      this.$emit('selected', files || $event.target.value)
      this.$emit('input', this.filename)
    }
  }
}
</script>
