<template lang="pug">
  select(style="width: 100%" multiple :disabled="readonly")
    slot
</template>

<script>
import $ from 'jquery'
import 'select2'
import language from 'select2/src/js/select2/i18n/ru'

/**
 * https://vuejs.org/v2/examples/select2.html
 * <select2 :data="data" v-model="selected">
 *   <option disabled value="0">Select one</option>
 * </select2>
 */
export default {
  props: {
    readonly: {
      type: Boolean,
      default: false
    },
    data: Array,
    value: Array,
    id: String,
    text: String,
    placeholder: String,
    onSelected: Function,
    unSelected: Function,
    nowrapSelected: {
      // добавляет свойвство white-space: nowrap для растягивания выбранных элементов
      type: Boolean,
      default: false
    },
    hideFilter: {
      type: Boolean,
      default: true
    },
    classifiersTable: {
      type: Boolean,
      default: false
    }
  },
  watch: {
    value (value) {
      $(this.$el).val(value).trigger('change')
    },
    data (data) {
      $(this.$el)
        .empty()
        .select2({
          language: language,
          placeholder: this.placeholder,
          data: this.mapData(data),
          templateSelection: this.nowrapSelected ? this.formatState : state => state.text,
          minimumResultsForSearch: this.hideFilter ? 'Infinity' : null,
          scrollAfterSelect: true
        })
        .val(this.value)
        .trigger('change')
    }
  },
  mounted () {
    const vm = this
    $(this.$el)
      // init select2
      .select2({
        language: language,
        data: this.mapData(this.data),
        templateSelection: this.nowrapSelected ? this.formatState : null,
        minimumResultsForSearch: this.hideFilter ? 'Infinity' : null,
        scrollAfterSelect: true
      })
      .val(this.value)
      .trigger('change')
      /*
      .on('select2:select', evt => {
        vm.value.push(evt.params.data.id)
      })
      .on('select2:unselect', evt => {
        vm.value.splice(vm.value.findIndex(valueId => valueId === evt.params.data.id), 1)
      })
      */
      .on('select2:select', evt => {
        let onSelectedHandler = vm.onSelected
        if (onSelectedHandler) {
          onSelectedHandler(evt.target.value)
        }
        vm.value.push(evt.params.data.id)
      })
      .on('select2:unselect', evt => {
        let unSelectedHandler = vm.unSelected
        if (unSelectedHandler) {
          unSelectedHandler(evt.target.value)
        }
        vm.value.splice(vm.value.findIndex(valueId => valueId === evt.params.data.id), 1)
      })
      .on('select2:open', function () {
        let requireHeight = $('.select2-selection').height() + 10
        let m = $('.select2-selection').offset().top + requireHeight + 150
        if ($(window).height() > ($('.select2-selection').offset().top + requireHeight + $('.select2-dropdown').height())) {
          vm.classifiersTable && $('.select2-dropdown').css('margin-top', m + 'px')
        }
          // figure out if we need to make changes
        if ($(window).height() < ($('.select2-selection').offset().top + requireHeight + $('.select2-dropdown').height())) {
          if ($('.select2-selection')[0].scrollHeight >= $(window).height()) {
            vm.classifiersTable && $('.select2-dropdown').css('margin-top', -180 + ($('.select2-selection').height() - $(window).height()) + 'px')
            return
          }
          vm.classifiersTable && $('.select2-dropdown').css('margin-top', $('.select2-selection')[0].scrollHeight - 40 + 'px')
        }
      })
  },
  destroyed () {
    $(this.$el).off().select2('destroy')
  },
  methods: {
    resetSelect () {
      $(this.$el).off().select2('destroy')
      const vm = this
      $(this.$el)
      // init select2
      .select2({
        language: language,
        data: this.mapData(this.data),
        templateSelection: this.nowrapSelected ? this.formatState : null,
        minimumResultsForSearch: this.hideFilter ? 'Infinity' : null,
        scrollAfterSelect: true
      })
      .val(this.value)
      .trigger('change')
      .on('select2:select', evt => {
        let onSelectedHandler = vm.onSelected
        if (onSelectedHandler) {
          onSelectedHandler(evt.target.value)
        }
        vm.value.push(evt.params.data.id)
      })
      .on('select2:unselect', evt => {
        let unSelectedHandler = vm.unSelected
        if (unSelectedHandler) {
          unSelectedHandler(evt.target.value)
        }
        vm.value.splice(vm.value.findIndex(valueId => valueId === evt.params.data.id), 1)
      })
      .on('select2:open', function () {
        let requireHeight = $('.select2-selection').height() + 10
        let m = $('.select2-selection').offset().top + requireHeight + 150
        if ($(window).height() > ($('.select2-selection').offset().top + requireHeight + $('.select2-dropdown').height())) {
          vm.classifiersTable && $('.select2-dropdown').css('margin-top', m + 'px')
        }
          // figure out if we need to make changes
        if ($(window).height() < ($('.select2-selection').offset().top + requireHeight + $('.select2-dropdown').height())) {
          if ($('.select2-selection')[0].scrollHeight >= $(window).height()) {
            vm.classifiersTable && $('.select2-dropdown').css('margin-top', -180 + ($('.select2-selection').height() - $(window).height()) + 'px')
            return
          }
          vm.classifiersTable && $('.select2-dropdown').css('margin-top', $('.select2-selection')[0].scrollHeight - 40 + 'px')
        }
      })
    },
    mapData (data) {
      if (!data) {
        return []
      }
      return data
        .map(x => ({
          id: x[this.id || 'id'],
          text: x[this.text || 'name']
        }))
    },
    formatState (state, container) {
      if (!state.id) {
        return state.text
      }
      $(container).css('width', '100%')
      const styledState = $(`
        <span style="white-space: normal;">${state.text}</span>
      `)
      return styledState
    }
  }
}
</script>
