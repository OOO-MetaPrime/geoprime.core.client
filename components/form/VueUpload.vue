<template>
<panel class="example-full flex-column flex-1" bodyClass="flex-column flex-1" title="Загрузить файлы" :autoSize="autoSize">
  <div slot="heading-elements">
    <icon-button
      primary
      title="Добавить файлы"
      text="Добавить файлы"
      @click="addFiles"
      icon="icon_bigplus"
      :disabled="!canUpload"
    />
  </div>
  <div class="upload">
    <div class="table-responsive">
      <table class="table table-hover">
        <thead>
          <tr>
            <th class="orderNumber">#</th>
            <th class="name">Имя</th>
            <th class="size">Размер</th>
            <th class="delete">Удалить</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!files.length" class="upload-row" :class="{ 'drop-active': $refs.upload && $refs.upload.dropActive }" >
            <td colspan="7" @click="addFiles" class="pointer">
              <div class="text-center p-5">
                <h4>
                  Перетащите файлы сюда
                  или <br/>
                  нажмите, чтобы выбрать
                </h4>
              </div>
            </td>
          </tr>
          <tr v-for="(file, index) in files" :key="file.id" :class="rowClasses(file)">
            <td>{{++index}}</td>
            <td>
              <div class="filename">
                {{file.name}}
              </div>
            </td>
            <td>{{file.size.toLocaleString()}}</td>
            <td>
              <div class="btn-group">
                <button class="btn btn-flat btn-icon"  @click.prevent="deleteFile(file)" type="button">
                  <i class="icon_bin"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <file-upload
      v-show="false"
      v-bind="options"
      @input-filter="inputFilter"
      @input-file="onChangeFiles"
      v-model="files"
      ref="upload"
    >
    </file-upload>

    </div>
  </panel>
</template>

<script>
// TODO переверстать
// https://lian-yue.github.io/vue-upload-component/#/en/
import FileUpload from 'vue-upload-component'
export default {
  props: {
    value: Array,
    canUpload: {
      type: Boolean,
      default: true
    },
    isFileDuplicate: Function,
    autoSize: {
      type: Boolean,
      default: false
    }
  },
  components: {
    FileUpload
  },
  data () {
    return {
      files: [],
      maxFileSize: null,
      filesStore: null,
      options: {
        multiple: true,
        drop: true,
        dropDirectory: false
      }
    }
  },
  watch: {
    // После того как файлы были загружены на сервер обнуляем список
    value: {
      handler: function (newValue) {
        if (!newValue || !newValue.length) {
          this.files = []
        } else {
          this.files = newValue
        }
      },
      deep: true,
      immediate: true
    }
  },
  methods: {
    rowClasses (file) {
      return {
        'file-duplicate': this.isFileDuplicate ? this.isFileDuplicate(file) : false
      }
    },
    addFiles () {
      this.$refs.upload.$el.querySelector('input').click()
    },
    deleteFile (file) {
      this.$refs.upload.remove(file)
    },
    // Вызывается перед загрузкой/удалением
    inputFilter (addedFile, removedFile, prevent) {
      if (addedFile) {
        const defaultMaxFileSize = 10 * 1024 * 1024
        this.maxFileSize = this.$store.state.systemParameters.maxFileSize * (1024 * 1024) || defaultMaxFileSize
        this.filesStore = this.$store.state.systemParameters.filesStore
        if (addedFile.size > this.maxFileSize && !this.filesStore) {
          this.$error(`Размер файла не должен превышать ${this.maxFileSize / (1024 * 1024)} МБ`)
          return prevent()
        }
      }
      if (!addedFile || (removedFile && addedFile.file === removedFile.file)) {
        return
      }
      const URL = window.URL || window.webkitURL
      if (addedFile.type.substr(0, 6) === 'image/' && URL && URL.createObjectURL && addedFile.file) {
        addedFile.thumb = URL.createObjectURL(addedFile.file)
      }
    },
    // Вызывается после загрузки/удаления
    onChangeFiles () {
      const files = this.files.map(x => ({ file: x.file || x, id: x.id }))
      for (const file of files) {
        file.file.id = file.id
      }
      this.$emit('input', files.map(x => x.file))
      this.$emit('changed')
    },
    add (file) {
      this.$refs.upload.add(file)
    },
    clear () {
      this.$refs.upload.clear()
    }
  }
}
</script>

<style scoped>
.drop-active {
  background-color: #f8f8f8;
}
.pointer {
  cursor: pointer;
}
.example-full {
  margin: 0;
  padding: 0;
}

.example-full .filename {
  margin-bottom: 0.3rem;
  overflow: auto;
}

.example-full .btn-is-option {
  margin-top: 0.25rem;
}

.example-full .footer-status {
  padding-top: 0.4rem;
}

.upload-row {
  border-bottom: 1px solid #ddd;
  height: 100%;
}
.upload,
.table-responsive,
.table {
  height: 100%;
}
.upload {
  min-height: 160px;
}
/* tbody {
  display: block;
  overflow: auto;
} */
thead,
th.orderNumber {
  width: 5%
}
th.name {
  width: 75%
}
th.size {
  width: 10%
}
th.delete {
  width: 10%
}
/* tbody tr { */
  /* display: table; */
  /* width: 100%; */
  /* table-layout: fixed; */ /* even columns width , fix width of table too*/
/* } */
.icons-list {
  margin: 5px 0;
}
.navbar {
  border-bottom: 1px solid #ddd;
}
tr.file-duplicate {
  color: red
}
</style>
