<template>
  <universal-select-input
    :readonly="readonly"
    :title="title"
    :modalTitle="modalTitle"
    :btnTitle="btnTitle"
    :clearBtnTitle="clearBtnTitle"
    :isClearBtnVisible="isClearBtnVisible"
    :clearFunction="clearFunction"
    :value="value"
    :apiFunction="apiFunction"
    :method="method"
    :options="options"
    :url="url"
    :columns="columns"
    :required="required"
    :placeholder="placeholder"
    @itemSelected="itemSelected"
  />
</template>

<script>
import UniversalSelectInput from '^/components/form/UniversalSelectInput'
export default {
  components: {
    UniversalSelectInput
  },
  props: {
    readonly: Boolean,
    title: String,
    modalTitle: String,
    btnTitle: String,
    clearBtnTitle: String,
    isClearBtnVisible: Boolean,
    clearFunction: Function,
    value: String,
    apiFunction: Function,
    method: String,
    options: Object,
    url: String,
    columns: Array,
    required: Boolean,
    placeholder: String
  },
  methods: {
    itemSelected (item) {
      this.$emit('itemSelected', item)
    }
  }
}
</script>