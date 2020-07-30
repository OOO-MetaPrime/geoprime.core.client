<template>
  <div class="lookup-filter-container" :class="{ 'border-primary': filter.value }">
    <select2
      class="form-control"
      :data="source"
      :value="value"
      @input="onFilter"
      :allowClear="true"
      :hideFilter="hideSearch"
      :disabled="isFiltersDisabled"
    />
  </div>
</template>

<script>
export default {
  props: {
    isFiltersDisabled: Boolean,
    filter: Object
  },
  components: {
  },
  data () {
    return {
      value: this.filter.value || null,
      source: this.filter.source,
      hideSearch: this.filter.hideFilterSearch || false
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
