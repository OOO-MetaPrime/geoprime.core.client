<template>
  <div class="input-group" :title="title" :class="pickerClass">
    <flat-pickr
      :config="config"
      v-bind="$attrs"
      :value="value"
      :disabled="readonly"
      @input="onInput($event)"
      @blur="onBlur($event)"
    />
    <div class="input-group-btn" :class="pickerButtonClass">
      <button
        class="btn btn-default text-primary"
        type="button"
        title="Выбрать дату"
        data-toggle
        :disabled="readonly"
      >
        <i class="icon_calendar">
        </i>
      </button>
    </div>
  </div>
</template>

<script>
import moment from 'moment'
import flatPickr from 'vue-flatpickr-component'
import 'flatpickr/dist/flatpickr.css'
import { Russian } from 'flatpickr/dist/l10n/ru'

export default {
  inheritAttrs: false,
  components: {
    flatPickr
  },
  props: {
    value: [String, Object, Date],
    enableTime: Boolean,
    readonly: Boolean,
    noCalendar: Boolean,
    noInput: {
      type: Boolean,
      default: false
    },
    minTime: {
      type: String,
      default: null
    },
    maxTime: {
      type: String,
      default: null
    },
    title: {
      type: String,
      default: null
    },
    displayFormat: {
      type: String,
      default: 'd.m.Y'
    }
  },
  watch: {
    // Из-за того что компонент флэтпикера состоит из двух инпутов некорректно работает :disabled,
    // так как при его изменении он прокидывается только на первый инпут(начальное значение задается корректно), а должен быть на обоих
    // поэтому вотчим проп и выставляем атрибут вручную
    readonly (newValue) {
      if (!this.$el) {
        return
      }
      const elements = this.$el.getElementsByClassName('flatpickr-input')
      for (const element of elements) {
        if (this.readonly) {
          element.setAttribute('disabled', 'disabled')
        } else {
          element.removeAttribute('disabled')
        }
      }
    }
  },
  data () {
    return {
      config: {
        allowInput: true,
        time_24hr: true,
        enableTime: this.enableTime,
        wrap: true,
        altFormat: (this.noCalendar ? '' : this.displayFormat) + (this.enableTime ? ' H:i' : ''),
        altInput: true,
        dateFormat: this.enableTime ? 'Z' : 'Y-m-d',
        locale: Russian,
        noCalendar: this.noCalendar,
        minTime: this.minTime,
        maxTime: this.maxTime
      }
    }
  },
  computed: {
    pickerClass () {
      return {
        'no-input-date-time-picker': !!this.noInput
      }
    },
    pickerButtonClass () {
      return {
        'no-input-date-time-picker-button': !!this.noInput
      }
    }
  },
  mounted () {
    const elements = this.$el.getElementsByClassName('flatpickr-input')
    for (const element of elements) {
      if (this.noInput) {
        element.style.width = '0px'
      }
    }
  },
  methods: {
    onInput (event) {
      if (!event && !this.value) {
        return
      }
      if (this.isSameDateTime(event, this.value)) {
        return
      }
      this.$emit('input', this.fixEmptyDate(event))
    },
    isSameDateTime (date1, date2) {
      if (this.enableTime) {
        const parsedTime1 = moment(date1, ['DD.MM.YYYY HH:mm:SS', 'YYYY-MM-DD HH:mm:SS'])
        const parsedTime2 = moment(date2, ['DD.MM.YYYY HH:mm:SS', 'YYYY-MM-DD HH:mm:SS'])
        return parsedTime1.isSame(parsedTime2)
      }
      const parsedDate1 = moment(date1, ['DD.MM.YYYY', 'YYYY-MM-DD'])
      const parsedDate2 = moment(date2, ['DD.MM.YYYY', 'YYYY-MM-DD'])
      return parsedDate1.isSame(parsedDate2)
    },
    formatRawDate (date) {
      if (!date) {
        return null
      }

      if (this.enableTime) {
        return moment(date, 'DD.MM.YYYY HH:mm:SS').toISOString()
      }
      return moment(date, ['DD.MM.YYYY', 'YYYY-MM-DD']).format('YYYY-MM-DD')
    },
    onBlur (event) {
      const convertedValue = this.formatRawDate(this.fixEmptyDate(this.value))
      if (convertedValue === this.value) {
        return
      }
      this.$emit('input', convertedValue)
    },
    fixEmptyDate (date) {
    // flat-picker превращает на входе null в пустую строку, поэтому возвращаем на выход как было
    // flat-picker в IE превращает на входе null в строку "Выберите дату", поэтому возвращаем на выход как было
      if (date === '' || date === 'Выберите дату') {
        return null
      }
      return date
    }
  }
}
</script>
<style lang="stylus" scoped>
.no-input-date-time-picker >>> input.flatpickr-input.input.form-control
  padding-right 0
  padding-left 0
  border none
.no-input-date-time-picker-button
  width auto
</style>