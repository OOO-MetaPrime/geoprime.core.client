<template>
  <div class="number-filter-group" :class="{ 'border-primary': filter.value }">
    <span class="number-filter-operator">{{ filter.operator }}</span>
    <basic-input-filter
      :filter="filter"
      :hideEmpty="hideEmpty"
      @filter="$emit('filter')"
      :operators="operators"
      :isCorrectValidation="isCorrectValidation"
    >
      <input
        type="number"
        :step="stepValue"
        class="form-control"
        v-model.number="value"
        @keyup.enter="onFilter"
        :disabled="isFiltersDisabled"
      >
    </basic-input-filter>
  </div>
</template>

<script>
import BasicInputFilter from './DataTableBasicInputFilter'

export default {
  props: {
    isFiltersDisabled: Boolean,
    filter: Object,
    isCorrectValidation: Boolean
  },
  components: {
    BasicInputFilter
  },
  data () {
    return {
      value: this.filter.value || null,
      operator: this.filter.operator || '=',
      operators: [{
        id: '=',
        name: '='
      }, {
        id: '>',
        name: '>'
      }, {
        id: '>=',
        name: '>='
      }, {
        id: '<',
        name: '<'
      }, {
        id: '<=',
        name: '<='
      }],
      hideEmpty: false
    }
  },
  computed: {
    stepValue () {
      if (this.filter.isInteger) {
        return 1
      }
      return 'any'
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
.number-filter-group {
  display: flex;
  align-items: center;
}
.number-filter-operator {
  margin: 5px;
}

/* Hide HTML5 Up and Down arrows. */
input[type="number"]::-webkit-outer-spin-button, input[type="number"]::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
}
 
input[type="number"] {
    -moz-appearance: textfield;
}
</style>