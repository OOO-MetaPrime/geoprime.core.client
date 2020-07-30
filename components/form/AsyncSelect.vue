
<template>
  <select style="width: 100%"
    :disabled="disabled" 
  />
</template>

<script>
import $ from 'jquery'
import 'select2'
import language from 'select2/src/js/select2/i18n/ru'

export default {
  props: {
    /**
     * filter -> {
     *  tablename: имя таблицы справочника
        nameField: название колонки для отображения в селекте
     * }
     */
    disabled: {
      type: Boolean,
      default: false
    },
    filter: {
      type: Object,
      required: true
    },
    size: {
      type: Number,
      default: () => {
        return 10
      }
    },
    allowClear: !!this.allowClear
  },
  mounted () {
    this.initSelect2()
  },
  destroyed () {
    $(this.$el).off().select2('destroy')
  },
  methods: {
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
          disabled: x.disabled
        }))
    },
    initSelect2 () {
      const vm = this
      $(this.$el)
      .empty()
      .select2({
        language: language,
        allowClear: !!this.allowClear,
        ajax: {
          delay: 500,
          url: vm.url || this.$url('/api/customdirectory'),
          crossDomain: true,
          dataType: 'json',
          data: params => {
            let query = params.term
            ? {
              size: vm.size,
              page: vm.page || 1,
              tablename: vm.filter.column.filter.tableName,
              nameField: vm.filter.column.filter.nameField,
              keyField: vm.filter.column.filter.keyField,
              search: params.term
            }
            : {
              tablename: vm.filter.column.filter.tableName,
              nameField: vm.filter.column.filter.nameField,
              keyField: vm.filter.column.filter.keyField,
              search: params.term,
              size: vm.size,
              page: params.page || 1
            }
            return query
          },
          processResults: function (data) {
            return {
              results: vm.mapData(data.results),
              pagination: data.pagination
            }
          }
        },
        minimumResultsForSearch: 10,
        tags: !!this.userInput,
        placeholder: { id: null, text: this.placeholder || '' },

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
      .on('select2:selecting', e => {
        let onSelectingHandler = vm.onSelecting
        if (onSelectingHandler) {
          const result = !!onSelectingHandler()
          if (!result) {
            e.preventDefault()
          }
        }
      })
      .on('select2:select', function (e) {
        vm.$emit('input', e.target.value)
      })
      .on('select2:unselect', function (e) {
        let unSelectedHandler = this.unSelected
        if (unSelectedHandler) {
          unSelectedHandler()
        }
      })
      .on('change', function (e) {
        if (e.target.value.length === 0) {
          vm.$emit('input', null)
          return
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
    }
  }
}
</script>