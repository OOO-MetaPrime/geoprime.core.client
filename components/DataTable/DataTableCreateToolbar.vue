<template>
  <div class="data-table-toolbar-icon-block">
    <button class="btn btn-default btn-icon" :disabled="!isSaveCreateBtnActive" @click="saveCreate" title="Сохранить">
      <i class="icon_floppy_disk"></i>
    </button>
    <button class="btn btn-default btn-icon" @click="cancelCreate" title="Отмена">
      <i class="icon_cross"></i>
    </button>
  </div>
</template>

<script>
export default {
  props: {
    itemForCreate: Object,
    isSaveCreateBtnActive: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      //
    }
  },
  methods: {
    saveCreate () {
      this.$emit('saveCreateGo')
    },
    cancelCreate () {
      this.$emit('cancelCreateGo', this.itemForCreate)
    }
  }
}
</script>

<style lang="stylus" scoped>
.data-table-toolbar-icon-block .btn-icon
  padding-left 4px
  padding-right 4px
  padding-top 4px
  padding-bottom 4px
</style>