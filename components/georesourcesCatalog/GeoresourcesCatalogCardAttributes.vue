<template>
  <fieldset class="flex-1">
    <div class="row">
      <div class="col-md-6">
        <div class="form-group" :class="!value.name ? 'has-error' : ''">
          <label> Название
            <span class="text-danger"> * </span>
          </label>
          <input
            class="form-control"
            type="text"
            v-model="value.name"
            :disabled="readonly || isArchive || isRfpd"
          >
        </div>
      </div>
      <div class="col-md-6">
        <div class="form-group">
          <label>Описание</label>
          <input class="form-control"
            v-model="value.description"
            type="text"
            :disabled="readonly || isArchive || isRfpd"
          >
        </div>
      </div>
    </div>
    <div class="row">
      <div class="col-md-6">
        <div class="form-group" :class="!value.ownerId ? 'has-error' : ''">
          <label> Правообладатель
            <span class="text-danger"> * </span>
          </label>
          <select2
            class="form-control"
            v-model="value.ownerId"
            :data="urbanPlanningObjects"
            :disabled="readonly || isArchive || isRfpd"
          />
        </div>
      </div>
      <div class="col-md-6">
        <div class="form-group" :class="!value.registrarOrganizationId ? 'has-error' : ''">
          <label> Регистратор
            <span class="text-danger"> * </span>
          </label>
          <select2
            :data="urbanPlanningObjects"
            :value="value.registrarOrganizationId"
            class="form-control"
            disabled="true"
          />
        </div>
      </div>
    </div>
    <div class="row">
      <div class="col-md-6">
        <div class="form-group" :class="!value.thematicSectionId ? 'has-error' : ''">
          <label> Тематический раздел
            <span class="text-danger"> * </span>
          </label>
          <select2
            v-model="value.thematicSectionId"
            :data="thematicSections"
            class="form-control"
            :disabled="readonly || isArchive || isRfpd"
          />
        </div>
      </div>
      <div class="col-md-6">
        <div class="form-group">
          <label>Основание</label>
          <textarea
            v-model="value.reason"
            class="form-control"
            type="text"
            :disabled="readonly || isArchive || isRfpd"
          />
        </div>
      </div>
    </div>
    <div class="row">
      <div class="col-md-6">
        <div class="form-group">
          <label>Масштаб</label>
          <select2
            v-model="value.scaleId"
            :data="scales"
            :disabled="readonly || isArchive || isRfpd"
            class="form-control"
          />
        </div>
      </div>
      <div class="col-md-6">
        <div class="form-group" :class="!value.accessRestriction ? 'has-error' : ''">
          <label> Ограничение по доступу
            <span class="text-danger"> * </span>
          </label>
          <select2
            v-model="value.accessRestriction"
            :data="allAccessRestrictions"
            :disabled="readonly || isArchive || isRfpd"
            class="form-control"
          />
        </div>
      </div>
    </div>
    <div class="row">
      <div class="col-md-6">
        <div class="form-group">
          <label>Вид ПД или материалов</label>
          <input
            v-model="value.pdType"
            class="form-control"
            type="text"
            :disabled="readonly || isArchive || isRfpd"
          >
        </div>
      </div>
      <div class="col-md-6">
        <div class="form-group">
          <label>Система координат</label>
          <select2
            v-model="value.coordinateProjectionId"
            :data="coordinateSystems"
            text="title"
            class="form-control"
            :disabled="readonly || isArchive || isRfpd"
          />
        </div>
      </div>
    </div>
    <div class="row">
      <div class="col-md-6">
        <div class="form-group">
          <label>Точность</label>
          <input
            v-model="value.accuracy"
            class="form-control"
            type="text"
            :disabled="readonly || isArchive || isRfpd"
          >
        </div>
      </div>
      <div class="col-md-6">
        <div class="form-group">
          <label>Организация-изготовитель</label>
          <input
            v-model="value.manufacturer"
            class="form-control"
            type="text"
            :disabled="readonly || isArchive || isRfpd"
          >
        </div>
      </div>
    </div>
    <div class="row">
      <div class="col-md-6">
        <div class="form-group">
          <label>Год соответствия</label>
          <input
            v-model="value.yearCorrespondence"
            type="number"
            class="form-control"
            :disabled="readonly || isArchive || isRfpd"
          >
        </div>
      </div>
      <div class="col-md-6">
        <div class="form-group">
          <label>Условия доступа, приобретения и использования</label>
          <input
            v-model='value.accessPurchaseAndUseTerms'
            class="form-control"
            type="text"
            :disabled="readonly || isArchive || isRfpd"
          >
        </div>
      </div>
    </div>
    <div class="row">
      <div class="col-md-6">
        <div class="form-group">
          <label>Дополнительные характеристики</label>
          <input
            v-model="value.characteristics"
            class="form-control"
            type="text"
            :disabled="readonly || isArchive || isRfpd"
          >
        </div>
      </div>
      <div class="col-md-6">
        <div class="form-group" :class="!value.status ? 'has-error' : ''">
          <label> Статус
            <span class="text-danger"> * </span>
          </label>
          <select2
            v-model="value.status"
            :data="spatialDataPdStatusTypes"
            class="form-control"
            :disabled="readonly || isArchive || isRfpd"
          />
        </div>
      </div>
    </div>
  </fieldset>
</template>

<script>
import { mapState } from 'vuex'

export default {
  props: {
    value: Object,
    readonly: Boolean,
    isArchive: Boolean,
    isRfpd: Boolean
  },
  components: {
  },
  data () {
    return {
      thematicSections: [],
      coordinateSystems: [],
      scales: []
    }
  },
  watch: {
    value: {
      immediate: true,
      handler (newValue) {
        this.value = newValue
      }
    },
    'value.name' () {
      this.$emit('change', false)
    },
    'value.description' () {
      this.$emit('change', false)
    },
    'value.ownerId' () {
      this.$emit('change', false)
    },
    'value.thematicSectionId' () {
      this.$emit('change', false)
    },
    'value.reason' () {
      this.$emit('change', false)
    },
    'value.scaleId' () {
      this.$emit('change', false)
    },
    'value.accessRestriction' () {
      this.$emit('change', false)
    },
    'value.pdType' () {
      this.$emit('change', false)
    },
    'value.coordinateProjectionId' () {
      this.$emit('change', false)
    },
    'value.accuracy' () {
      this.$emit('change', false)
    },
    'value.manufacturer' () {
      this.$emit('change', false)
    },
    'value.yearCorrespondence' () {
      this.$emit('change', false)
    },
    'value.accessPurchaseAndUseTerms' () {
      this.$emit('change', false)
    },
    'value.characteristics' () {
      this.$emit('change', false)
    },
    'value.status' () {
      this.$emit('change', false)
    }
  },
  computed: {
    ...mapState({
      urbanPlanningObjects: state => state.urbanPlanningObjects,
      user: state => state.user,
      accessRestrictions: state => state.enums.public.AccessRestrictions.toArray(),
      spatialDataPdStatusTypes: state => state.enums.public.SpatialDataPdStatusTypes.toArray()
    }),
    allAccessRestrictions () {
      const restrictions = this.accessRestrictions

      return [{
        id: null,
        name: '<не задано>'
      }, ...restrictions]
    }
  },
  async mounted () {
    this.thematicSections = await this.coreApi.pdCards.getThematicSections()
    this.coordinateSystems = await this.coreApi.pdCards.getCoordinateSystems()
    this.scales = await this.coreApi.pdCards.getScales()
  }
}
</script>
