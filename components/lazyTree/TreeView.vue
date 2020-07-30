<template>
<div class="async-tree">
  <liquor-tree
    v-if="items && items.length"
    :data="asyncData"
    :options="options"
    @node:checked="onNodeChecked"
    @node:selected="onNodeSelected"
  />
</div>
</template>

<script>
import LiquorTree from 'liquor-tree'
import cloneDeep from 'lodash/cloneDeep'

export default {
  components: {
    LiquorTree
  },
  props: {
    multiple: {
      type: Boolean,
      default: true
    },
    value: [Array, Object],
    items: Array,
    // Вызывается для каждого элемента дерева
    // если возвращает true - чекбокс у элемента не показывается
    disableCheckboxCondition: {
      type: Function,
      default () {
        return !this.multiple
      }
    },
    renderNameFunc: {
      type: Function,
      default: item => {
        return item.name
      }
    },
    itemClassFunc: {
      type: Function,
      default: item => {
        return {}
      }
    },
    setDisabledParent: {
      type: Function,
      default (x) {
        return x.disabled != null ? x.disabled : false
      }
    }
  },
  data () {
    return {
      options: {
        checkbox: this.multiple,
        multiple: this.multiple,
        fetchData: this.asyncTreeLoad,
        autoCheckChildren: false,
        nodeIndent: 5
      },
      asyncData: []
    }
  },
  watch: {
    items: {
      deep: true,
      handler () {
        this.resetData()
      }
    }
  },
  created () {
    this.resetData()
  },
  methods: {
    resetData () {
      const asyncData = cloneDeep(this.items)
      this.asyncData = asyncData.map(x => this.mapItemToNode(x))
    },
    visit (rootArray, forEach) {
      rootArray.forEach(root => {
        forEach(root)
        this.visit(root.children, forEach)
      })
    },
    onNodeChecked (node) {
      const selectedNodes = this.$refs.tree.checked()
      this.$emit('input', selectedNodes.map(x => x.data))
    },
    onNodeSelected (node) {
      if (this.multiple) {
        return
      }
      const selectedNodes = this.$refs.tree.selected()
      if (!selectedNodes.length) {
        this.$emit('input', null)
        return
      }
      this.$emit('input', selectedNodes[0].data)
    },
    mapItemToNode (item) {
      return {
        id: item.id,
        text: this.renderNameFunc(item),
        data: item,
        // children: item.children,
        isBatch: !!item.children.length,
        state: {
          selected: this.multiple ? !!this.value.find(s => s.id === item.id) : (this.value && this.value.id === item.id),
          disabled: this.setDisabledParent(item)
        }
      }
    },
    async asyncTreeLoad (node) {
      const children = node.data.children.map(x => {
        return this.mapItemToNode(x)
      })
      return children
    }
  }
}
</script>

<style lang="stylus" scoped>
.async-tree >>> .tree-checkbox.checked:after
  border-color #455a64
  height 9px
  width 5px
  left 4px
  top 0
.async-tree >>> .tree-arrow
  width 16px
  height 16px
  margin-left 0
  margin-right 2px
.async-tree >>> .tree-arrow.has-child
  height 16px
  margin-right 2px
.async-tree >>> .tree-arrow.has-child:after
  top 46%
  left 5px
.async-tree >>> .tree-checkbox
  border-width 2px
  border-color #607D8B
  height 18px
  width 18px
  margin-top 0
  margin-right 0px
.async-tree >>> .tree-checkbox.checked
  border-color #607D8B
  background-color inherit
</style>
