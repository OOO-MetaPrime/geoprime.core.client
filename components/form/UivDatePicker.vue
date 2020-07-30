<template>
  <dropdown>
    <div class="input-group datepickery">
      <input class="form-control" disabled :value="displayDate">
      <div class="input-group-btn">
        <btn class="dropdown-toggle"><i class="icon_calendar"></i></btn>
      </div>
    </div>
    <template slot="dropdown">
      <li>
        <date-picker
          v-model="inputDate"
          v-bind="uivProps"
         />
      </li>
    </template>
  </dropdown>
</template>

<script>
import moment from 'moment'

export default {
  props: {
    value: String,
    displayFormat: {
      type: String,
      default: 'L'
    },
    // https://uiv.wxsm.space/date-picker/#api-reference
    uivProps: {
      type: Object,
      default: () => ({
        'clear-btn': false
      })
    }
  },
  data () {
    return {
      inputDate: null
    }
  },
  computed: {
    displayDate () {
      if (!this.inputDate) {
        return null
      }
      return moment(this.inputDate).format(this.displayFormat)
    }
  },
  watch: {
    value: {
      immediate: true,
      handler (newValue) {
        this.inputDate = newValue
      }
    },
    inputDate (newDate) {
      this.$emit('input', newDate)
    }
  }
}
</script>

<style scoped lang="stylus">
.datepickery
  max-width 150px
  min-width 100px
</style>
