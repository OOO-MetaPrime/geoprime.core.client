<template lang="pug">
  input.form-control(
    :value="value"
    :readonly="readonly"
    ref="numberinput"
    @input="setNumberValue"
    @keyup="onKeyUp"
    @keypress="onKeyPress"
    :maxlength="maxLength"
    :title="validationTitle")
</template>

<script>

export default {
  props: ['value', 'title', 'min', 'max', 'decimalPlaces', 'isInteger', 'readonly', 'isNotNegative'],
  data () {
    return {
      validationMessage: ''
    }
  },
  computed: {
    validationTitle () {
      if (this.validationMessage) {
        return this.validationMessage
      }

      return this.title
    },
    maxLength () {
        // максимальная длина мантиссы в Number от 15 до 17,
        // берем 15, чтобы гарантировано не потерять значение при преобразовании строки в число
      if (this.isInteger) {
        return 15
      } else {
        return 16
      }
    }
  },
  methods: {
    isValid (parsedValue, rawValue) {
      if (isNaN(parsedValue)) {
        this.validationMessage = 'Введите корректное число'
        return false
      }
      if (this.isInteger && !Number.isInteger(parsedValue)) {
        this.validationMessage = 'Введите целое число'
        return false
      }
      if (this.isInteger && rawValue.indexOf('.') !== -1) {
        this.validationMessage = 'Введите целое число'
        return false
      }
      if (this.min != null) {
        if (parsedValue < this.min) {
          this.validationMessage = `Значение ${parsedValue} меньше, чем ${this.min}`
          return false
        }
      }
      if (this.max != null) {
        if (parsedValue > this.max) {
          this.validationMessage = `Значение ${parsedValue} больше, чем ${this.max}`
          return false
        }
      }
      if (!this.isInteger) {
        const length = rawValue.length
        const maxLength = rawValue.indexOf('.') !== -1 ? this.maxLength : this.maxLength - 1
        if (length > maxLength) {
          this.validationMessage = `Допустимое количество знаков не больше, чем ${maxLength}`
          return false
        }
      }
      if (this.decimalPlaces != null) {
        const isValidDecimalPlacesCount = this.countDecimals(parsedValue) <= this.decimalPlaces
        this.validationMessage = isValidDecimalPlacesCount ? '' : `Допустимое количество знаков в дробной части не больше, чем ${this.decimalPlaces}`
        return isValidDecimalPlacesCount
      }
      this.validationMessage = ''
      return true
    },
    countDecimals (value) {
      if (Math.floor(value) === value) {
        return 0
      }
      return value.toString().split('.')[1].length || 0
    },
    getValidationNumber (number) {
      return parseInt(Math.round(number * Math.pow(10, this.decimalPlaces)))
    },
    getFixedValidationNumber (number) {
      return parseInt(Math.round(number.toFixed(this.decimalPlaces) * Math.pow(10, this.decimalPlaces)))
    },
    onKeyPress (event) {
      let symbol = event.key
      if (event.key === ',') {
        symbol = '.'
      }
      const strValue = this.value != null ? this.value.toString() : this.value
      if ((symbol === '.' || symbol === '-' || symbol === ',') && strValue && strValue.includes(symbol)) {
        event.preventDefault()
      }
      if (this.decimalPlaces && strValue && (strValue.toString().includes('.') || strValue.includes(','))) {
        const currentValue = strValue.replace(',', '.')
        const dicimalPart = currentValue.split('.')[1]
        if (dicimalPart && dicimalPart.length === parseInt(this.decimalPlaces)) {
          event.preventDefault()
          return
        }
      }
      const res = this.isNotNegative ? /[0-9.,]/g.test(event.key) : /[0-9.,-]/g.test(event.key)
      if (!res) {
        event.preventDefault()
      }
    },
    onKeyUp (event) {
      if (event.code === 'Enter') {
        this.$emit('keyup', event)
        event.preventDefault()
        return
      }
      let symbol = event.key
      if (event.key === ',') {
        symbol = '.'
      }
      if ((symbol === '.' || symbol === '-' || symbol === ',') && this.value && this.value.includes(symbol)) {
        event.preventDefault()
      }
      if (this.decimalPlaces && this.value && (this.value.toString().includes('.') || this.value.toString().includes(','))) {
        const currentValue = this.value.toString().replace(',', '.')
        const dicimalPart = currentValue.split('.')[1]
        if (dicimalPart && dicimalPart.length === parseInt(this.decimalPlaces)) {
          event.preventDefault()
          return
        }
      }
      const res = this.isNotNegative ? /[0-9.,]/g.test(event.key) : /[0-9.,-]/g.test(event.key)
      if (!res) {
        event.preventDefault()
        return
      }
      this.$emit('keyup', event)
    },
    setNumberValue (event) {
      this.$emit('setSaveActive', true)
      const newValue = event.srcElement.value.replace(',', '.')
      if (newValue === '') {
        this.$emit('onValidate', {
          parsedValue: null,
          value: null,
          isValid: true
        })
        this.validationMessage = null
        this.$emit('input', null)
        return
      }
      const parsedValue = Number(newValue)

      const isValid = this.isValid(parsedValue, newValue)
      this.$emit('onValidate', {
        parsedValue,
        value: newValue,
        isValid
      })

      this.$emit('input', newValue)
    }
  }
}
</script>