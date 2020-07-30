<template>
  <div>
    <form-group-input
      :readonly="readonly"
      title="Название"
      v-model="layer.name"
      required
    />

    <div class="row flex-row aligning">
      <div class="form-group col-md-8">
        <label>Тип сервиса
          <span
            class="text-danger"
            required
          >
            *
          </span>
        </label>
        <select2
          :disabled="readonly"
          class="form-control"
          v-model="layer.layerType"
          :data="layerTypeArray"
          @input="clearOptions"
        />
      </div>

      <div class="form-group col-md-4" v-show="!readonly">
        <label class="checkbox-inline checkbox-right">
          <input type="checkbox" class="correcter" :disabled="checkDisabled('ignoreGetMapUrl')" v-model="layer.ignoreGetMapUrl" />
          Игнорировать URI запросов GetMap
        </label>

      </div>
    </div>

    <form-group-input
      :readonly="readonly || checkDisabled('url')"
      title="URL"
      v-model="layer.url"
      :required="checkRequired('url')"
    />

    <div class="field-container form-group">
      <label>Слой сервиса
        <span
          class="text-danger"
          v-show="checkRequired('serviceLayersValue')"
        >
          *
        </span>
      </label>
      <div class="input-group">
        <input
          class="form-control"
          :value="layer.serviceLayersValue"
          @input="($event.target.value)"
          :required="checkRequired('serviceLayersValue')"
          disabled
        />
        <span class="input-group-btn">
          <button
            class="btn btn-default text-primary"
            :disabled="readonly || checkDisabled('serviceLayersValue')"
            @click="getLayers"
          >
          ...
          </button>
        </span>
      </div>
    </div>

    <form-group-input
      :readonly="readonly || checkDisabled('tokenUrl')"
      title="Token URL"
      v-model="layer.tokenUrl"
      v-show="!readonly"
    />

    <div class="row" v-show="!readonly">
      <form-group-input
        :readonly="readonly || checkDisabled('serviceLogin')"
        title="Логин"
        v-model="layer.serviceLogin"
        class="col-md-6"
      />
      <form-group-input
        v-show="!readonly"
        :readonly="readonly || checkDisabled('servicePassword')"
        title="Пароль"
        v-model="layer.servicePassword"
        class="col-md-6"
      />
    </div>

    <div class="row">
      <form-group-input
        :readonly="readonly || checkDisabled('schema')"
        title="Схема БГД"
        v-model="layer.schema"
        class="col-md-6"
      />

      <form-group-input
        :readonly="readonly || checkDisabled('featureClass')"
        title="Таблица БГД"
        v-model="layer.featureClass"
        class="col-md-6"
      />
    </div>

    <div class="form-group" v-show="readonly">
      <label> Дата создания</label>
      <date-input v-model="layer.created" />
    </div>

    <modal-dialog
      title="Выберите слой сервиса"
      v-model="isModalVisible"
      @hide="hide"
      append-to-body
      :before-close="checkSelectedLayer"
    >
      <memory-data-table
        class="flex-1"
        filterable
        sortable
        selectable
        pagable
        :columns="columns"
        :items="layerService"
        v-model="selectedItem"
      />

    </modal-dialog>
  </div>

</template>

<script>
import { mapState } from 'vuex'
import DateInput from '^/components/form/DateInput'
import { getLayersInfo } from '^/components/map/map'

export default {
  components: {
    DateInput
  },
  props: {
    layer: Object,
    readonly: {
      type: Boolean,
      defaultvalue: true
    }
  },
  data () {
    return {
      layerService: [],
      isModalVisible: false,
      selectedItem: null
    }
  },
  computed: {
    ...mapState({
      layerTypes: state => state.enums.public.LayerTypes,
      layerTypeArray: state => state.enums.public.LayerTypes.toArray()
    }),
    columns () {
      return [
        {
          title: 'id',
          field: 'id',
          filter: { operator: '=' }
        },
        {
          title: 'name',
          field: 'name'
        }
      ]
    },
    requiredOptionList () {
      const { layerType } = this.layer
      const requiredOptions = ['name', 'layerType']
      switch (layerType) {
        case null:
        case this.layerTypes.bing:
        case this.layerTypes.om:
        case this.layerTypes.otm:
        case this.layerTypes.yandexSchema:
        case this.layerTypes.yandexSatellite:
          return requiredOptions
        case this.layerTypes.arcGisDynamic:
        case this.layerTypes.arcGisTiled:
        case this.layerTypes.arcGisVector:
          return [...requiredOptions, 'url']
        default: return [...requiredOptions, 'url', 'serviceLayersValue']
      }
    },
    enabledOptionList () {
      const { layerType } = this.layer
      const enabledOptions = ['name', 'layerType']
      switch (layerType) {
        case null:
        case this.layerTypes.bing:
        case this.layerTypes.om:
        case this.layerTypes.otm:
        case this.layerTypes.yandexSchema:
        case this.layerTypes.yandexSatellite: return enabledOptions
        case this.layerTypes.wfs:
          return [...enabledOptions, 'url', 'serviceLayersValue',
            'tokenUrl', 'serviceLogin', 'servicePassword']
        case this.layerTypes.arcGisDynamic:
        case this.layerTypes.arcGisTiled:
        case this.layerTypes.arcGisVector:
          return [...enabledOptions, 'url', 'serviceLogin', 'servicePassword']
        default:
          return [...enabledOptions, 'ignoreGetMapUrl', 'url', 'serviceLayersValue',
            'tokenUrl', 'serviceLogin', 'servicePassword', 'schema', 'featureClass']
      }
    }
  },
  methods: {
    checkRequired (option) {
      return this.requiredOptionList.includes(option)
    },
    checkDisabled (option) {
      return !this.enabledOptionList.includes(option)
    },
    async getLayers () {
      const { layerType, url, serviceLogin, servicePassword } = this.layer

      if (serviceLogin && servicePassword) {
        this.layer.authorizationString = this.getBasicAuthorization(serviceLogin, servicePassword)
      }

      const urlReg = /^(http|https):\/\/[^ "]+$/
      const isUrlValid = urlReg.test(url)

      if (!url || !layerType || !isUrlValid) {
        this.$error('Ошибка чтения данных сервиса. Проверьте правильность указания URL')
        return
      }

      this.blockUI(this.$el, true)
      try {
        this.layerService = await getLayersInfo(this.layer, url)
        this.isModalVisible = true
      } catch (error) {
        this.$error('Невозможно получить данные')
      } finally {
        this.blockUI(this.$el, false)
      }
    },
    hide () {
      this.isModalVisible = false
    },
    getBasicAuthorization (login, password) {
      return btoa(`${login}:${(password || '')}`)
    },
    checkSelectedLayer (msg) {
      if (msg !== 'ok') {
        this.isModalVisible = false
        return
      }
      if (!this.selectedItem) {
        this.$error('Выберите слой')
        return
      }
      this.layer.serviceLayersValue = this.selectedItem.id
      this.isModalVisible = false
    },
    clearOptions () {
      const layer = {
        name: this.layer.name,
        layerType: this.layer.layerType,
        id: this.layer.id,
        edited: this.layer.edited
      }
      this.$emit('clearOptions', layer)
    }
  }
}
</script>

<style lang="stylus" scoped>
.aligning
  align-items flex-end
.checkbox-right
  .correcter
    right 40px
.form-group
  margin-bottom 10px
</style>
