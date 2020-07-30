<template>
  <div class="searchable-laze-tree-container flex flex-column">
    <tree-search
      class="tree-search"
      :tree="items"
      :placeholder="placeholder"
      @search="setFilteredItems"
      @clearSearch="clearSearch"
      @filter="getFilter"
    />
    <div class="lazy-container">
      <lazy-tree
        v-bind="$attrs"
        :value="value"
        :items="filteredItems"
        @input="$emit('input', $event)"
        @selectItem="selectItem"
        @deselectItem="deselectItem"
        :stylingNodes="stylingNodes"
      />
    </div>
  </div>
</template>

<script>
// Сбрасывать селектед если его нет в отфильтрованом после поиска

export default {
  components: {
  },
  inheritAttrs: false,
  props: {
    value: [Array, String],
    items: Array,
    stylingNodes: Boolean,
    placeholder: String
  },
  data () {
    return {
      filteredItems: this.items
    }
  },
  watch: {
    items (newItems) {
      this.filteredItems = newItems
    }
  },
  methods: {
    setFilteredItems (searchResult) {
      this.filteredItems = searchResult
      this.$emit('foundItems', this.filteredItems)
    },
    getFilter (filter) {
      this.$emit('filter', filter)
    },
    clearSearch () {
      this.filteredItems = this.items
      // Эмитим событие в компонент выше для очистки фильтров
      this.$emit('clearSearch')
    },
    selectItem (e) {
      this.$emit('selectItem', e)
    },
    deselectItem (e) {
      this.$emit('deselectItem', e)
    }
  }
}
</script>

<style scoped lang="stylus">
.lazy-container
  overflow auto
</style>

