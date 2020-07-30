<template>
  <div class="data-table-toolbar-icon-block">
    <button class="btn btn-default btn-icon" :disabled="disabled || isEditBtnDisabled" @click="edit" title="Редактировать">
      <i class="icon_edit"></i>
    </button>
    <button class="btn btn-default btn-icon" :disabled="disabled || isRemoveBtnDisabled" @click="deleteItem" title="Удалить">
      <i class="icon_bin"></i>
    </button>
    <button class="btn btn-default btn-icon" :disabled="disabled || !isSaveEditBtnActive" @click="save" title="Сохранить">
      <i class="icon_floppy_disk"></i>
    </button>
    <button class="btn btn-default btn-icon" :disabled="disabled || isCancelBtnDisabled" @click="cancelEdit" title="Отмена">
      <i class="icon_cross"></i>
    </button>
  </div>
</template>

<script>
export default {
  props: {
    disabled: {
      type: Boolean,
      default: false
    },
    isSaveEditBtnActive: {
      type: Boolean,
      default: false
    },
    isRemoveBtnDisabled: {
      type: Boolean,
      default: false
    },
    isEditBtnDisabled: {
      type: Boolean,
      default: false
    },
    isCancelBtnDisabled: {
      type: Boolean,
      default: false
    },
    item: Object
  },
  data () {
    return {
      //
    }
  },
  methods: {
    edit () {
      this.$emit('editItemGo', this.item)
    },
    save () {
      this.$emit('saveEditItemGo', this.item)
    },
    cancelEdit () {
      this.$emit('cancelEditGo', this.item)
    },
    deleteItem () {
      this.$emit('deleteItemGo', this.item)
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