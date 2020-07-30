<template lang="pug">
  div.field-container(:class="{'has-error': isNotValidValue(column, item)}")
    text-area(
      v-if="!column.isClassifier && ((column.isText && !column.isHtml) || column.isPrimaryKey) && !column.isLink && !column.isEmail && !column.isRegistryClassifierField"
      :readonly="!editable || column.isNotEditable"
      v-model="item[column.key]"
      @input="changeValueNotification"
      :title="isNotValidValue(column, item) ? getValidationTooltip() : ''"
    )

    link-input(
      v-if="column.isLink || column.isEmail"
      :editable="editable"
      v-model="item[column.key]"
      :column="column"
      @changeDisable="changeDisable"
      :class="{'has-error': isValidate}"
    )

    html-editor.html-editor(v-if="column.isHtml" v-model="item[column.key]" :readonly="!editable")
    number-input(
      v-if="column.isNumeric && ((!column.isLatitude && !column.isLongitude)|| !editable)"
      :readonly="!editable"
      :value="item[column.key]"
      :min="column.minValue"
      :max="column.maxValue"
      :isInteger="column.isInteger"
      :decimalPlaces="this.customDecimalPlaces"
      @input="setNumberValue"
      @onValidate="onValidation"
      :title="isNotValidValue(column, item) ? getValidationTooltip() : ''"
    )
    div.input-group(v-if="column.isLongitude && editable")
      coordinate-input(
        :value="item[column.key]"
        @changed="onCoordinatesChanged"
        :mask="column.coordinateInputMask"
      )

    div.input-group(v-if="column.isLatitude && editable")
      coordinate-input(
        :value="item[column.key]"
        @changed="onCoordinatesChanged"
        :mask="column.coordinateInputMask"
      )
      span.input-group-btn
        button.btn.btn-default.btn-icon(title="Щелкните по карте чтобы получить координаты" @click="getCoordinates")
          i.icon_location
    input.form-control(:title="classifierValue" type="text" v-if="column.isClassifier && !editable && !column.isFkko" readonly="readonly" :value="classifierValue")

    select2(
      v-if="column.isClassifier && editable && !isBigClassifier && !column.isOktmo && !column.isFkko && !column.isRegistryClassifierField"
      :data="classifierValues"
      v-model="item[column.key]"
      :onSelected="select"
      text="title"
      :disabled="column.isNotEditable")
    classifier-select-input(
      v-if="column.isClassifier && !column.isRegistryClassifierField && editable && isBigClassifier && !column.isOktmo && !column.isFkko"
      :items="classifierValues"
      :initialKey="item[column.key]"
      nameField="title"
      :columns="dialogColumns"
      @itemSelected="classifierValueSelected"
      :disabled="column.isNotEditable")

    input.form-control(type="text" v-if="column.isDateTime && !editable" :readonly="!editable" :value="formatDateTime(item[column.key])")
    input.form-control(type="text" v-if="column.isDate && !editable" :readonly="!editable" :value="formatDate(item[column.key])")
    date-time-picker(
      v-if="(column.isDate || column.isDateTime) && editable"
      :enableTime="column.isDateTime"
      v-model="item[column.key]"
      :readonly="column.isNotEditable"
    )
    vue-switch(v-if="column.isBoolean" v-model="item[column.key]" :readonly="column.isNotEditable || !editable" :title="item[column.key] ? 'Включено' : 'Выключено'" @switched="onSwitched")
    many-to-many-field(v-if="column.isManyToMany" v-model="item[column.id]" :column="column" :editable="editable")
    territory-select-input.territory-field(v-if="column.isOktmo && editable" :customItems="customItems" :territory="selectedTerritory" @territorySelected="territorySelected" :readonly="column.isNotEditable")
    fkko-select-input.territory-field(v-if="column.isFkko" :classifierValues="classifierValues" :fkko="selectedFkko" @fkkoSelected="fkkoSelected" :readonly="column.isNotEditable || !editable")
    registry-select-input(
      v-if="column.isRegistryClassifierField && editable"
      :items="classifierValues"
      :classifierRegistry="column.classifierRegistry"
      :registryColumns="column.registryClassifierColumns"
      @itemSelected="classifierValueSelected"
      :initialKey="item[column.key]"
      :disabled="column.isNotEditable")
</template>

<script>
import moment from 'moment'
import CoordinateInput from '^/components/form/CoordinateInput.vue'
import LinkInput from '^/components/form/LinkInput'
import ManyToManyField from './ManyToManyField.vue'
import { mapState } from 'vuex'
import ClassifierSelectInput from '^/components/ClassifierSelectInput.vue'
import RegistrySelectInput from '^/components/RegistrySelectInput.vue'
import {
  getColumnValidators, isValidValue, countDecimals
} from '^/helpers/registryColumnsHelper'

export default {
  props: ['customItems', 'isResetTerritory', 'column', 'item', 'editable', 'handlers', 'dialog', 'dialogColumns', 'classifiers', 'customValidator', 'customValidatorTooltip', 'customDecimalPlaces'],
  components: {
    ManyToManyField,
    LinkInput,
    ClassifierSelectInput,
    CoordinateInput,
    RegistrySelectInput
  },
  data () {
    return {
      classifierValue: null,
      selectedTerritory: {
        id: null,
        code: '',
        name: 'Не задано'
      },
      selectedFkko: {
        id: null,
        code: '',
        name: 'Не задано'
      },
      isValidate: false,
      isValidNumber: true,
      isValidCoordinate: true,
      getCoordinatesModeOn: false
    }
  },
  computed: {
    ...mapState({
      isRecordListActual: state => state.registries.isRecordListActual,
      registryId: state => state.registries.id,
      selectedRecord: state => state.registries.selectedRecord,
      selectedRegistry: state => state.registries.selectedRegistry,
      rootView: state => state.rootView
    }),
    stepValue () {
      if (this.column.isInteger) {
        return 1
      }
      if (this.column.isNumeric && this.customDecimalPlaces) {
        return 1 / Math.pow(10, this.customDecimalPlaces)
      }
      if (this.column.isNumeric) {
        return 'any'
      }
    },
    classifierValues () {
      return this.classifiers[this.column.id] || []
    },
    isBigClassifier () {
      if (this.dialog) {
        return true
      }
      if (!this.classifierValues) {
        return false
      }

      if (!this.classifierValues.length) {
        return false
      }

      return this.classifierValues.length > 30
    },
    validators () {
      if (!this.column) {
        return []
      }
      const columnValidators = getColumnValidators(this.column, this.customValidator)
      if (this.column.isNumeric) {
        columnValidators.push((column, value) => {
          return this.isValidNumber
        })
      }
      if (this.column.isLongitude || this.column.isLatitude) {
        columnValidators.push((column, value) => {
          return this.isValidCoordinate
        })
      }
      return columnValidators
    }
  },
  watch: {
    isResetTerritory (newValue) {
      if (newValue === true) {
        this.selectedTerritory = {
          id: null,
          code: '',
          name: 'Не задано'
        }
      }
    },
    classifiers (newValue) {
      if (!newValue) {
        return
      }
      this.setDefaultValue()
    },
    item (newValue) {
      if (!newValue) {
        return
      }
      this.setDefaultValue()
    }
  },
  mounted () {
    this.setDefaultValue()
  },
  methods: {
    setDefaultValue () {
      const value = this.item[this.column.key]
      const classifierValue = this.classifierValues.find(a => a.id === value)
      this.classifierValue = classifierValue ? classifierValue.title : ''

      if (classifierValue && this.column.isOktmo && this.column.foreignTable === 'public.oktmo') {
        this.selectedTerritory = {
          id: classifierValue.id,
          name: classifierValue.title
        }
      }

      if (classifierValue && this.column.isFkko && this.column.foreignTable === 'register.xmao_catalog_fkko') {
        this.selectedFkko = {
          id: classifierValue.id,
          name: classifierValue.title
        }
      }
    },
    isNotValidValue (column, item) {
      if (!this.isValidNumber && column.isNumeric) {
        return true
      }

      if (!this.isValidCoordinate && (column.isLatitude || column.isLongitude)) {
        return true
      }
      return !isValidValue(this.validators, column, item[column.key])
    },
    onValidation (event) {
      this.isValidNumber = event.isValid
      this.changeValueNotification()
    },
    setNumberValue (newValue) {
      this.item[this.column.key] = newValue
      this.changeValueNotification()
    },
    onCoordinatesChanged (coordinates) {
      this.isValidCoordinate = coordinates.isValid
      this.item[this.column.key] = coordinates.coordinate
      this.changeValueNotification()
    },
    formatDate (date) {
      if (date) {
        return moment(date).format('L')
      }
    },
    formatDateTime (date) {
      if (date) {
        return moment(date).format('L LT')
      }
    },
    territorySelected (territory) {
      this.item[this.column.key] = territory[this.column.foreignTableKeyColumn]
      this.$emit('changeDisable', false)
    },
    onSwitched (newValue) {
      this.$emit('changeDisable', false)
    },
    fkkoSelected (fkko) {
      this.item[this.column.key] = fkko
      this.$emit('changeDisable', false)
    },
    changeDisable (newValueActivity, newValue) {
      this.isValidate = newValueActivity
      this.item[this.column.key] = newValue
      this.$emit('changeDisable', newValueActivity)
    },
    changeValueNotification () {
      this.$emit('changeDisable', this.isNotValidValue(this.column, this.item))
    },
    classifierValueSelected (item) {
      this.item[this.column.key] = item.id
      const classifierValue = this.classifierValues.find(a => a.id === item.id)
      if (this.item[this.column.id]) {
        this.item[this.column.id][this.column.foreignTableDisplayColumn] = classifierValue.title
      }
      this.changeValueNotification()
    },
    select () {
      const classifierValue = this.classifierValues.find(a => a.id === this.item[this.column.key])
      this.item[this.column.id][this.column.foreignTableDisplayColumn] = classifierValue.title
      this.changeValueNotification()
    },
    getCoordinates () {
      this.$emit('getCoordinates')
    },
    turnOffCoordinatedMode () {
      this.getCoordinatesModeOn = false
    },
    getValidationTooltip () {
      if (this.column.isNumeric && !this.isValidNumber) {
        if (this.column.isInteger) {
          return `Введите целое число`
        }
        if (!this.column.isInteger && this.customDecimalPlaces != null) {
          return `Допустимое количество знаков в дробной части - не более ${this.customDecimalPlaces}`
        }
        return null
      }
      if (!this.column.isInteger && this.customDecimalPlaces != null) {
        if (countDecimals(this.item[this.column.key]) > this.customDecimalPlaces) {
          return `Допустимое количество знаков в дробной части - не более ${this.customDecimalPlaces}`
        }
      }
      if (this.column.isNotNull && this.column.key !== 'id' && (this.item[this.column.key] == null || this.item[this.column.key] === '')) {
        return `Не заполнено обязательное поле`
      }
      if (!this.customValidatorTooltip) {
        return this.column.validationTooltip
      }
      return this.customValidatorTooltip(this.column)
    }
  }
}
</script>

<style lang="stylus" scoped>
border-color = #D84315 !important

.field-container.has-error
  border-color border-color
.html-editor >>> .content
  height auto
  max-height 110px
.territory-field
  width 100%
.field-container >>> .select-territory-block
  width 100%
.field-container >>> .select-classifier-block
  width 100%
</style>
