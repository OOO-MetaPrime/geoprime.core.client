<template>
  <basic-input-filter
    :filter="filter"
    :hideEmpty="hideEmpty"
    @filter="$emit('filter')"
    :isLastIndex="isLastIndex"
    :isCorrectValidation="isCorrectValidation"
    :class="{ 'border-primary': filter.value }"
    :operators="operators"
  >
    <input
      type="text"
      class="form-control"
      v-model="value"
      @keyup.enter="onFilter"
      :title="title"
      :disabled="isFiltersDisabled"
    >
  </basic-input-filter>
</template>

<script>
import BasicInputFilter from './DataTableBasicInputFilter'

export default {
  props: {
    isFiltersDisabled: Boolean,
    filter: Object,
    operators: Array,
    isLastIndex: Boolean,
    isCorrectValidation: Boolean,
    title: String
  },
  components: {
    BasicInputFilter
  },
  data () {
    return {
      value: this.filter.value || null,
      operator: this.filter.operator || '=',
      hideEmpty: false
    }
  },
  watch: {
    filter: {
      deep: true,
      handler: function (newFilter) {
        this.value = newFilter.value
        this.operator = newFilter.operator
        this.hideEmpty = newFilter.hideEmpty || false
      }
    }
  },
  methods: {
    onFilter () {
      this.filter.operator = this.operator
      this.filter.value = this.value
      this.$emit('filter')
    }
  }
}
</script>

<style scoped>
</style>
