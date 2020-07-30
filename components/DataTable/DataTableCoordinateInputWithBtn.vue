<template>
  <div
    class="data-table-date-input-container"
    :class="{'has-warning has-feedback': !value && required}"
  >
    <div class="input-group">
      <coordinate-input
        :value="value"
        @changed="onCoordinatesChanged"
        :mask="mask"
        :readonly="readonly"
      />
      <span class="input-group-btn">
        <button
          :disabled="readonly"
          class="btn btn-default btn-icon"
          title="Щелкните по карте чтобы получить координаты"
          @click="getCoordinates"
        >
          <i class="icon_location"></i>
        </button>
      </span>
    </div>
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
    },
    getCoordinates () {
      this.$emit('getCoordinates')
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