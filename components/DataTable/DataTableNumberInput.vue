<template>
  <div class="data-table-number-input-container" :class="{'has-error': isNotValidValue()}">
    <number-input
      :value="value"
      class="form-control"
      :readonly="readonly"
      @input="onInput"
      @onValidate="onValidation"
      :placeholder="required ? 'Заполните поле' : ''"
      :title="title"
      :isNotNegative="isNotNegative"
      :decimalPlaces="decimalPlaces"
    />
  </div>
</template>

<script>
export default {
  components: {
  },
  props: {
    value: {
      type: [Number, String]
    },
    readonly: {
      type: Boolean,
      default: false
    },
    required: {
      type: Boolean,
      default () {
        return false
      }
    },
    isNotNegative: {
      type: Boolean,
      default: false
    },
    decimalPlaces: {
      type: Number,
      default: null
    },
    title: String
  },
  data () {
    return {
      isValidNumber: true
    }
  },
  methods: {
    onValidation (event) {
      this.isValidNumber = event.isValid
    },
    isNotValidValue () {
      return (this.value == null && this.required) || !this.isValidNumber
    },
    onInput (value) {
      this.$emit('setNewValue', value)
    }
  }
}
</script>
<style scoped lang="stylus">
.data-table-number-input-container .form-control
  padding 3px 10px
  height 30px

</style>
