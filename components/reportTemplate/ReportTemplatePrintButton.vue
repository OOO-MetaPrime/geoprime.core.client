<template>
<div class="report-template-button">
  <icon-button
    title="Печать"
    :disabled="!templates.length || disabled"
    @click="selectPrintTemplate"
    icon="icon_printer"
  />

  <modal-dialog
    class="uiv-modal"
    v-model="showPrintTemplateSelect"
    title="Выберите печатную форму"
    okText="Печать"
    @hide="onTemplateSelectHide"
  >
    <select2
      class="form-control"
      :data="templates"
      v-model="selectedTemplateId"
    />
  </modal-dialog>
</div>
</template>

<script>
export default {
  components: {
  },
  props: {
    disabled: Boolean,
    templateResource: Number,
    printParams: Object
  },
  data () {
    return {
      templates: [],
      showPrintTemplateSelect: false,
      selectedTemplateId: null
    }
  },
  watch: {
    templateResource: 'loadTemplates'
  },
  mounted () {
    this.loadTemplates()
  },
  methods: {
    async loadTemplates () {
      if (!this.templateResource) {
        return
      }
      this.templates = await this.coreApi.reportTemplates.getTemplates(this.templateResource)
    },
    async selectPrintTemplate () {
      if (!this.templates || !this.templates.length) {
        return
      }
      if (this.templates.length === 1) {
        this.selectedTemplateId = this.templates[0].id
        this.print()
      } else {
        this.showPrintTemplateSelect = true
      }
    },
    onTemplateSelectHide (resultMessage) {
      if (resultMessage === 'ok') {
        this.print()
      }
    },
    print () {
      if (!this.selectedTemplateId) {
        return
      }
      this.coreApi.reportTemplates.printTemplate(this.selectedTemplateId, this.printParams)
    }
  }
}
</script>
<style lang="stylus" scoped>
.report-template-button
  margin-left 1px
  margin-right 1px
.report-template-button .btn-icon
  margin-left 0
  margin-right 0
</style>