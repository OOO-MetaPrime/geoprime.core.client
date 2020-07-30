<template>
  <div class="tree-search">
    <div class="input-group">
      <input type="text" class="form-control"
        v-model="filter"
        @keydown.enter="search"
        :placeholder="placeholder"
      >
      <div class="input-group-btn">
        <button type="button" class="btn btn-default"  @click="search">
          <i class="icon_search"/>
        </button>
        <button type="button" class="btn btn-default" @click="clearSearch">
          <i class="icon_cross"/>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import cloneDeep from 'lodash/cloneDeep'

export default {
  props: {
    tree: Array,
    maxFilterableSize: Number,
    displayAllTree: Boolean,
    placeholder: String
  },
  data () {
    return {
      filter: ''
    }
  },
  methods: {
    clearSearch () {
      this.filter = ''
      this.$emit('clearSearch')
    },
    searchInTree () {
      const filteredTree = []
      cloneDeep(this.tree).forEach(treeItem => {
        const filteredItem = this.checkTreeItems(treeItem, false)
        if (filteredItem) {
          filteredTree.push(filteredItem)
        }
      })
      return filteredTree
    },
    getFilteredTreeItems () {
      if (!this.tree || !this.tree.length) {
        return []
      }

      if (this.filter === '') {
        if (this.maxFilterableSize) {
          return this.tree.slice(0, this.maxFilterableSize)
        }
        return this.tree
      }
      return this.searchInTree(this.tree)
    },
    async search () {
      if (this.filter.length > 0 && this.filter.length < 3) {
        return
      }
      const filteredItems = this.getFilteredTreeItems()
      this.$emit('search', filteredItems)
      this.$emit('filter', this.filter)
    },
    checkTreeItems (node, isParentFiltered) {
      if (isParentFiltered) {
        return node
      }
      const isNodeFiltered = node.name.toLowerCase().includes(this.filter.toLowerCase())
      const filteredChildren = []
      for (const child of node.children) {
        const filteredChild = this.checkTreeItems(child, isNodeFiltered || isParentFiltered)
        if (filteredChild) {
          filteredChildren.push(filteredChild)
        }
      }
      if (!isNodeFiltered && !isParentFiltered && !filteredChildren.length) {
        return null
      }
      node.children = filteredChildren
      return node
    }
  }
}
</script>

<style lang="stylus" scoped>
.tree-search
  margin-bottom 10px
</style>
