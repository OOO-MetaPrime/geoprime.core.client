<template lang="pug">
  select(style="width: 100%")
    slot
</template>

<script>
import $ from 'jquery'
import 'select2'
import language from 'select2/src/js/select2/i18n/ru'

// TODO реализовать пробросс классов

/**
 * https://vuejs.org/v2/examples/select2.html
 * <select2 :data="data" v-model="selected">
 *   <option disabled value="0">Select one</option>
 * </select2>
 */
export default {
  props: ['data', 'value', 'id', 'text', 'hideFilter', 'placeholder', 'allowClear', 'onSelecting', 'onSelected', 'unSelected', 'userInput'],
  data () {
    return {
      isNumber: false
    }
  },
  watch: {
    value (value) {
      this.setValue(value)
    },
    data (data) {
      const mappedData = this.mapData(data)
      this.isNumber = mappedData[0] && (typeof mappedData[0].id) === 'number'
      $(this.$el)
        .empty()
        .select2({
          language: language,
          data: mappedData,
          allowClear: !!this.allowClear,
          tags: !!this.userInput,
          placeholder: { id: null, text: this.placeholder || '' },
          minimumResultsForSearch: this.hideFilter ? 'Infinity' : null,
          createTag: function (params) {
            var term = $.trim(params.term)

            if (term === '') {
              return null
            }

            return {
              id: term,
              text: term,
              newTag: true // add additional parameters
            }
          }
        })
        .val(this.value)
        .trigger('change')
    }
  },
  mounted () {
    const vm = this
    const mappedData = this.mapData(this.data)
    this.isNumber = mappedData[0] && (typeof mappedData[0].id) === 'number'
    $(this.$el)
      // init select2
      .select2({
        language: language,
        data: mappedData,
        allowClear: (this.allowClear != null ? this.allowClear : false),
        tags: !!this.userInput,
        placeholder: { id: null, text: this.placeholder || '' },
        minimumResultsForSearch: this.hideFilter ? 'Infinity' : null,
        createTag: function (params) {
          var term = $.trim(params.term)

          if (term === '') {
            return null
          }

          return {
            id: term,
            text: term,
            newTag: true // add additional parameters
          }
        }
      })
      .val(this.value)
      .trigger('change')
      // emit event on change.
      .on('select2:selecting', function (e) {
        vm.canSave()
        let onSelectingHandler = vm.onSelecting
        if (onSelectingHandler) {
          const result = !!onSelectingHandler()
          if (!result) {
            e.preventDefault()
          }
        }
      })
      .on('select2:select', function (e) {
        let onSelectedHandler = vm.onSelected
        if (onSelectedHandler) {
          onSelectedHandler(e.target.value)
        }
      })
      .on('select2:unselect', function (e) {
        let unSelectedHandler = vm.unSelected
        if (unSelectedHandler) {
          unSelectedHandler()
        }
      })
      .on('change', function () {
        if (this.value === undefined || this.value === null || this.value === '') {
          vm.$emit('input', null)
          return
        }
        if (vm.isNumber) {
          vm.$emit('input', parseFloat(this.value))
        } else {
          vm.$emit('input', this.value)
        }
      })
      // WORKAROUND При нажатии на очистить открывается список элементов.
      // https://stackoverflow.com/questions/29618382/disable-dropdown-opening-on-select2-clear
      // https://github.com/select2/select2/issues/3320
      .on('select2:unselecting', function () {
        ('unselecting')
        $(this).data('unselecting', true)
      })
      .on('select2:opening', function (e) {
        if ($(this).data('unselecting')) {
          $(this).removeData('unselecting')
          e.preventDefault()
        }
      })
  },
  destroyed () {
    $(this.$el).off().select2('destroy')
  },
  methods: {
    canSave () {
      this.$emit('setSaveActive', true)
    },
    setValue (value) {
      $(this.$el).val(value).trigger('change.select2')
    },
    mapData (data) {
      if (!data) {
        return []
      }
      return data
        .map(x => ({
          id: x[this.id || 'id'],
          text: x[this.text || 'name'],
          disabled: x.disabled,
          element: `${x.element}`,
          children: x.children
        }))
    }
  }
}
</script>
