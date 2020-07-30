<template>
  <div class="lookup-filter-container" :class="{ 'border-primary': filter.value }">
    <async-select
      :filter="filter"
      :allowClear="true"
      class="form-control"
      @input="onFilter"
      :disabled="isFiltersDisabled"
    />
  </div>
</template>

<script>
import AsyncSelect from '^/components/form/AsyncSelect'

export default {
  props: {
    isFiltersDisabled: Boolean,
    filter: Object
  },
  components: {
    AsyncSelect
  },
  data () {
    return {
      value: this.filter.value || null,
      source: this.filter.source
    }
  },
  methods: {
    onFilter (value) {
      this.filter.value = value
      this.$emit('filter')
    }
  }
}
</script>

<style scoped>
.lookup-filter-container {
  margin-bottom: 0;
}
.lookup-filter-container .form-control {
  padding: 3px 10px;
  height: 30px
}
.lookup-filter-container >>> .select2-selection--single {
  height: 30px;
  padding-top: 4px;
  padding-bottom: 4px;
}
.lookup-filter-container .btn {
  padding: 4px 8px
}
</style>
