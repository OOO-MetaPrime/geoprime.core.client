<template>
  <div
    class="data-table-date-input-container"
    :class="{'has-warning has-feedback': !value && required}"
  >
    <coordinate-input
      :value="value"
      @changed="onCoordinatesChanged"
      :mask="mask"
      :readonly="readonly"
    />
  </div>
</template>

<script>
import CoordinateInput from '^/components/form/CoordinateInput.vue'
export default {
  components: {
    CoordinateInput
  },
  props: {
    value: {
      type: String
    },
    readonly: {
      type: Boolean,
      default: false
    },
    mask: String,
    required: {
      type: Boolean,
      default () {
        return false
      }
    }
  },
  methods: {
    onCoordinatesChanged (value) {
      this.$emit('setNewValue', value.rawValue)
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