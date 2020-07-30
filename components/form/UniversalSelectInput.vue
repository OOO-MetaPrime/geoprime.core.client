<template>
<div class="universal-input-block">
  <div class="select-universal-block input-group" :class="{'has-warning has-feedback': value == null && required}">
    <input
      type="text"
      :title="title"
      class="form-control universal-name"
      :value="value || placeholder || 'Не выбрано'"
      readonly
    />
    <span class="input-group-btn">
      <button
        :title="btnTitle"
        type="button"
        class="btn btn-default text-primary"
        :disabled="readonly"
        @click="selectItem"
      >
        {{btnTitle}}
      </button>
      <button
        v-if="isClearBtnVisible"
        :title="clearBtnTitle"
        type="button"
        class="btn btn-default text-primary"
        @click="clear"
        :disabled="readonly || !value"
      >
        {{clearBtnTitle}}
      </button>
    </span>
    <universal-select-dialog
      ref="universalSelectDialog"
      :url="url"
      :apiFunction="apiFunction"
      :method="method"
      :columns="columns"
      :modalTitle="modalTitle"
      @itemSelected="itemSelected"
      :options="options"

    />
  </div>
</div>
</template>

<script>
import UniversalSelectDialog from '^/components/form/UniversalSelectDialog'

export default {
  components: {
    UniversalSelectDialog
  },
  props: {
    required: {
      type: Boolean,
      default: false
    },
    readonly: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: ''
    },
    modalTitle: {
      type: String,
      default: ''
    },
    btnTitle: {
      type: String,
      default: ''
    },
    clearBtnTitle: {
      type: String,
      default: ''
    },
    isClearBtnVisible: {
      type: Boolean,
      default: false
    },
    clearFunction: {
      type: Function,
      default: function () {}
    },
    value: {
      type: String,
      default: null
    },
    apiFunction: Function,
    method: String,
    options: Object,
    url: String,
    columns: {
      type: Array,
      default: function () {
        return []
      }
    },
    placeholder: {
      type: String,
      default: ''
    }
  },
  data () {
    return {
    }
  },
  methods: {
    clear () {
      this.clearFunction()
    },
    selectItem () {
      this.$refs.universalSelectDialog.open()
    },
    itemSelected (item) {
      this.$emit('itemSelected', item)
    }
  }
}
</script>

<style lang="stylus" scoped>
.universal-input-block
  display flex
  align-items center
  width 100%
.select-universal-block
  width 100%
.universal-name
  overflow hidden
  white-space nowrap
  text-overflow ellipsis
</style>