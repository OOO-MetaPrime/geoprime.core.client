<template>
  <div class="data-table-date-input-container" :class="{'has-warning has-feedback': !value && required}">
    <date-time-picker
      :enableTime="false"
      :value="value"
      :readonly="readonly"
      :displayFormat="displayFormat"
      @input="onInput($event)"
    />
  </div>
</template>

<script>
import moment from 'moment'

export default {
  components: {
  },
  props: {
    value: {
      type: String
    },
    readonly: {
      type: Boolean,
      default: false
    },
    displayFormat: {
      type: String
    },
    required: {
      type: Boolean,
      default () {
        return false
      }
    }
  },
  methods: {
    onInput (input) {
      if (!input || input === '') {
        this.$emit('setNewValue', null)
        return
      }
      const correctedDate = moment(input).format('YYYY-MM-DD')
      if (this.value === correctedDate) {
        return
      }
      this.$emit('setNewValue', correctedDate)
    },
    onClear () {
      this.$emit('setNewValue', null)
    }
  }
}
</script>
<style lang="stylus" scoped>
.data-table-date-picker
  position relative
  >>> .mx-input-append
    height auto
.data-table-date-input-container >>> .form-control
  padding 3px 10px
  height 30px
.data-table-date-input-container >>> .btn
  padding 4px 8px

</style>
