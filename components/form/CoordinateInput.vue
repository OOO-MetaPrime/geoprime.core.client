<template >
  <mask-input
    :value="rawValue"
    :mask="valueMask"
    :readonly="readonly"
    ref="maskinput"
    @input="setMaskedValue"
    :title="validationTitle"
    v-if="!isNumberCoordinates && valueMask"
  />
  <number-input :value="value" @input="setNumberValue" :readonly="readonly" v-else/>
</template>

<script>
import { parseCoordinateMask, toCoordinatesString } from '^/helpers/coordinateHelper'
const degreesValueRegex = new RegExp('^_*([\\d]+\\.[\\d]*)_*°$')
const degreesMinutesValueRegex = new RegExp('^_*([\\d]+)°_*([\\d]+\\.[\\d]*)_*\'$')
const degreesMinutesSecondsValueRegex = new RegExp('^_*([\\d]+)°_*([\\d]*)\'_*([\\d]*)"$')
const degreesMinutesSecondsMillisecondsValueRegex = new RegExp('^_*([\\d]+)°_*([\\d]*)\'_*([\\d]+\\.[\\d]*)_*"$')

export default {
  components: {
  },
  props: {
    value: {
      type: [Number, String]
    },
    mask: {
      type: String,
      default: 'n'
    },
    readonly: {
      type: Boolean,
      default: false
    } },
  data () {
    return {
      validationMessage: '',
      valueMask: '',
      maskType: 'n',
      rawValue: '',
      digits: null,
      isInputChange: false,
      maskInfo: {
        mask: null,
        type: null,
        digits: {}
      }
    }
  },
  watch: {
    value (newValue) {
      if (this.isInputChange) {
        this.isInputChange = false
        return
      }
      this.transformValue()
    }
  },
  computed: {
    isNumberCoordinates () {
      return this.mask === 'n'
    },
    validationTitle () {
      if (this.validationMessage) {
        return this.validationMessage
      }

      return this.title
    }
  },
  mounted () {
    this.maskInfo = parseCoordinateMask(this.mask)
    this.valueMask = this.maskInfo.mask
    this.maskType = this.maskInfo.type
    this.digits = this.maskInfo.digits
    this.transformValue()
  },
  methods: {
    transformValue () {
      if (this.value == null) {
        if (this.$refs.maskinput) {
          this.rawValue = this.$refs.maskinput.getEmptyMask()
        }

        return
      }
      const parsedValue = parseFloat(this.value)
      if (this.mask) {
        this.rawValue = toCoordinatesString(parsedValue, this.maskInfo)
      }
    },
    transfromDegreesAndMinutes (degrees, minutes) {
      const value = degrees + (minutes == null ? 0 : minutes) / 60.0
      return parseFloat(value.toFixed(16))
    },
    transformDegreesMinutesSeconds (degrees, minutes, seconds) {
      const value = degrees + (minutes == null ? 0 : minutes) / 60.0 + (seconds == null ? 0 : seconds) / 3600.0
      return parseFloat(value.toFixed(16))
    },
    getCheckedValue (value) {
      if (value === '') {
        return null
      }

      return parseFloat(value)
    },
    transformValueBack () {
      if (this.rawValue === '') {
        return {
          value: null,
          isValid: true
        }
      }
      switch (this.maskType) {
        case 'n':
          return {
            value: this.rawValue,
            isValid: true
          }
        case 'd':
          const dMatch = this.rawValue.match(degreesValueRegex)
          if (dMatch) {
            return {
              value: this.getCheckedValue(dMatch[1]),
              isValid: true
            }
          }
          return {
            value: null,
            isValid: false
          }
        case 'dm':
          const dmMatch = this.rawValue.match(degreesMinutesValueRegex)
          if (dmMatch) {
            return {
              value: this.transfromDegreesAndMinutes(this.getCheckedValue(dmMatch[1]), this.getCheckedValue(dmMatch[2])),
              isValid: true
            }
          }
          return {
            value: null,
            isValid: false
          }
        case 'dms':
          const dmsMatch = this.rawValue.match(degreesMinutesSecondsValueRegex)
          if (dmsMatch) {
            return {
              value: this.transformDegreesMinutesSeconds(this.getCheckedValue(dmsMatch[1]), this.getCheckedValue(dmsMatch[2]), this.getCheckedValue(dmsMatch[3])),
              isValid: true
            }
          }
          return {
            value: null,
            isValid: false
          }
        case 'dmss':
          const dmssMatch = this.rawValue.match(degreesMinutesSecondsMillisecondsValueRegex)
          if (dmssMatch) {
            return {
              value: this.transformDegreesMinutesSeconds(this.getCheckedValue(dmssMatch[1]), this.getCheckedValue(dmssMatch[2]), this.getCheckedValue(dmssMatch[3])),
              isValid: true
            }
          }
          return {
            value: null,
            isValid: false
          }
      }
      return this.rawValue
    },
    setMaskedValue (newValue) {
      this.rawValue = newValue
      const convertedValue = this.transformValueBack()
      this.validationMessage = convertedValue.isValid ? '' : 'Введите корректное значение'
      this.isInputChange = true
      this.$emit('changed', {
        coordinate: convertedValue.value,
        isValid: convertedValue.isValid,
        rawValue: this.rawValue
      })
    },
    setNumberValue (newValue) {
      this.$emit('changed', {
        coordinate: newValue,
        isValid: true,
        rawValue: newValue
      })
    }
  }
}
</script>