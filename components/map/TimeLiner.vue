<template lang="pug">
div.slider(ref="slider" v-show="isActive")
</template>

<script>
import slider from 'nouislider'

function getWithLeadingZero (value) {
  return (value >= 10) ? value.toString() : ('0' + value.toString())
}

// мы не можем пользоваться toLocaleDateString()
// см. http://stackoverflow.com/questions/21413757/tolocaledatestring-changes-in-ie11
function dateToString (date) {
  return `${getWithLeadingZero(date.getDate())}.${getWithLeadingZero(date.getMonth() + 1)}.${date.getFullYear()}`
}

const formatDate = {
  to: function (value) {
    return dateToString(new Date(value))
  },
  from: function (value) {
    return value
  }
}

export default {
  name: 'time-liner',
  props: ['map', 'defaultPeriod', 'isActive'],
  data () {
    return {
      period: { from: '2010-01-01', to: '2011-01-01', min: '2012-01-01', max: '2022-12-31' },
      values: ['', '']
    }
  },
  watch: {
  },
  created () {
  },
  mounted () {
    this.setDefaultPeriod(this.defaultPeriod)
    const container = this.$refs.slider
    slider.create(container, {
      behaviour: 'drag',
      start: [this.timestamp(this.formatDate(this.defaultPeriod.from)), this.timestamp(this.formatDate(this.defaultPeriod.to))],
      connect: true,
      step: 24 * 60 * 60 * 1000,
      tooltips: [formatDate, formatDate],
      range: {
        'min': this.timestamp(this.period.min),
        'max': this.timestamp(this.period.max)
      },
      format: formatDate,
      pips: {
        mode: 'positions',
        values: [0, 50, 100],
        density: 10,
        format: formatDate
      }
    })

    container.noUiSlider.on('change', this.updateSlider)
  },
  methods: {
    setDefaultPeriod (selectedPeriod) {
      const currentDate = new Date(Date.now())
      const startDate = new Date(1990, 0, 1)
      const finishDate = new Date(currentDate.getFullYear() + 5, 11, 31)
      this.period.min = this.formatDate(startDate)
      this.period.max = this.formatDate(finishDate)
      this.period.from = new Date(selectedPeriod.from)
      this.period.to = new Date(selectedPeriod.to)
    },
    timestamp (str) {
      return new Date(str).getTime()
    },
    getPeriod () {
      return this.isActive ? this.period : null
    },
    formatDate (date) {
      var month = '' + (date.getMonth() + 1)
      var day = '' + date.getDate()
      const year = date.getFullYear()

      if (month.length < 2) {
        month = '0' + month
      }
      if (day.length < 2) {
        day = '0' + day
      }
      return [year, month, day].join('-')
    },
    fromDateString (value) {
      const dateParts = value.split('.')
      const date = new Date(parseInt(dateParts[2]), parseInt(dateParts[1]) - 1, parseInt(dateParts[0]))

      return this.formatDate(date)
    },
    setPeriod (values) {
      this.period.from = this.fromDateString(values[0])
      this.period.to = this.fromDateString(values[1])
    },
    updateSlider (values, handle, unencoded, isTap, positions) {
      // при изменении диапазона, а не отдельной границы справа или слева, генерируются два события
      // с одними и тем же значениями, но разными значениями handle, поэтому
      // игнорируем событие, если диапазон не изменился.
      if (values[0] === this.values[0] && values[1] === this.values[1]) {
        return
      }

      this.values = values

      if (values) {
        this.setPeriod(values)
      }
      this.$emit('periodChanged', this.period)
    }
  }
}
</script>

<style lang="stylus" scoped>
.slider
  min-width 50px
.white
  position absolute
  right 10px
  margin 5px
.white, .white:not([disabled]):hover
  background #fff
  margin 5px
</style>