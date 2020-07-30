<template lang="pug">
  div.modal.fade(tabindex="-1" role="dialog")
    div.modal-dialog(role="document")
      div.modal-content
        div.modal-header
          h4.modal-title Выберите шаблон для печати
        div.modal-body
          div.form-group
            label Шаблон
            select2(:data="templates" v-model="template")
        div.modal-footer
          button.btn.btn-default(type="button" data-dismiss="modal") Отмена
          button.btn.btn-primary(type="button" data-dismiss="modal" @click="$emit('select', template)") Выбрать
</template>

<script>
import $ from 'jquery'

export default {
  components: {
  },
  data () {
    return {
      templates: [],
      template: null
    }
  },
  methods: {
    show (templates) {
      this.templates = templates
      if (templates[0]) {
        this.template = templates[0].id
      }
      $(this.$el).modal('show')
    }
  }
}
</script>
