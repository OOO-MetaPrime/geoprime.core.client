<template>
  <input class="form-control" readonly="readonly" v-model="date" />
</template>

<script>
import moment from 'moment'

export default {
  props: {
    value: [String, Object, Date],
    showTime: Boolean
  },
  data () {
    return {
      date: null
    }
  },
  watch: {
    value: {
      immediate: true,
      handler (newValue) {
        const newDate = moment(newValue)
        this.date = newDate.isValid()
          ? newDate.format(this.showTime ? 'L LT' : 'L')
          : null
      }
    }
  }
}
</script>
