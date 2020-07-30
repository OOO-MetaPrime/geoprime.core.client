<template>
<div class="lazy-tree">
  <tree
    v-if="items && items.length && showTree"
    :data="asyncData"
    :wholeRow="multiple"
    :showCheckbox="multiple"
    :multiple="multiple"
    :async="asyncTreeLoad"
    noDots
    @item-click="itemSelected"
    @nodeAdded="addNodeToHash"
    klass="styling-nodes"
    :itemClassFunc="itemClassFunc"
  />
</div>
</template>

<script>
import Tree from 'packages/vue-jstree/src/tree.vue'
import cloneDeep from 'lodash/cloneDeep'

export default {
  components: {
    Tree
  },
  props: {
    multiple: {
      type: Boolean,
      default: true
    },
    value: [Array, String],
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
    stylingNodes: {
      type: Boolean,
      default () {
        return false
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
      selected: this.multiple ? [] : null,
      showTree: true,
      asyncData: [],
      itemsWithSelectedProperty: [],
      hash: {},
      treeHash: {}
    }
  },
  watch: {
    value: {
      immediate: true,
      handler (newValue) {
        this.selected = this.multiple ? cloneDeep(newValue) : newValue
      }
    },
    selected (selected) {
      this.setSelected(this.hash)
      this.setSelected(this.treeHash)
    },
    items: {
      deep: true,
      handler () {
        this.showTree = false
        this.resetData()
        this.$nextTick(() => {
          this.showTree = true
        })
      }
    }
  },
  created () {
    this.resetData()
  },
  methods: {
    isSelected (id) {
      return this.multiple ? this.selected.includes(id) : id === this.selected
    },
    resetData () {
      this.hash = {}
      this.treeHash = {}
      this.asyncData = []
      this.itemsWithSelectedProperty = cloneDeep(this.items)
      this.visit(this.itemsWithSelectedProperty, x => {
        if (x.id && this.isSelected(x.id)) {
          x.selected = true
        }
        this.hash[x.id] = x
      })
    },
    setSelected (hash) {
      Object.entries(hash)
        .forEach(([key, value]) => {
          if (this.isSelected(key)) {
            value.selected = true
          } else {
            value.selected = false
          }
        })
    },
    // Для удобного изменения свойства selected снаружи
    addNodeToHash (node) {
      this.treeHash[node.value.id] = node
    },
    visit (rootArray, forEach) {
      rootArray.forEach(root => {
        forEach(root)
        this.visit(root.children, forEach)
      })
    },
    itemSelected (node, item, isCtrlKeyDown) {
      const id = item.value.id
      if (!this.multiple) {
        this.selected = id
        this.$emit('input', id)
        this.$emit('selectItem', this.hash[id])
        this.$emit('clickOnItem', item.value)
        return
      }
      if (item.selected) {
        if (isCtrlKeyDown) {
          this.selected.push(id)
          this.hash[id].selected = true
        } else {
          this.visit([this.hash[id]], x => {
            if (this.selected.indexOf(x.id) === -1) {
              this.selected.push(x.id)
            }
            x.selected = true
          })
        }
        this.$emit('selectItem', this.hash[id])
      } else {
        if (isCtrlKeyDown) {
          const index = this.selected.indexOf(id)
          this.selected.splice(index, 1)
          this.hash[id].selected = false
        } else {
          this.visit([this.hash[id]], x => {
            if (this.selected.indexOf(x.id) !== -1) {
              const index = this.selected.indexOf(x.id)
              this.selected.splice(index, 1)
            }
            x.selected = false
          })
        }
        this.$emit('deselectItem', this.hash[id])
      }
      this.$emit('input', this.selected)
    },
    asyncTreeLoad (oriNode, resolve) {
      let data = []
      if (Array.isArray(oriNode.data)) {
        data = this.itemsWithSelectedProperty
      } else if (oriNode.data.value.children) {
        data = oriNode.data.value.children
      }
      data = data.map(x => {
        return {
          text: this.renderNameFunc(x),
          isDeleted: x.isDeleted || false,
          selected: this.hash[x.id].selected,
          disabled: this.setDisabledParent(x),
          value: {
            disableCheckbox: this.disableCheckboxCondition(x),
            code: x.code,
            codeFieldValue: x.codeField ? x[x.codeField] : null,
            id: x.id,
            children: x.children,
            deleted: x.deleted,
            item: x
          }
        }
      })
      resolve(data)
    }
  }
}
</script>

<style lang="stylus" scoped>
.lazy-tree >>>
  .tree-children
    max-width 100%
  .tree-anchor
    max-width 95%
    white-space normal
    height auto
.lazy-tree
  width auto
  & >>> .tree ul
    padding-left 0px
  & >>> .tree-checkbox:after
    left -1px
    position absolute
>>> .tree-default > .tree-container-ul > .tree-node
  margin-left 0
  margin-right 0
>>> .tree-default .tree-node
  margin-left 20px
  margin-top 7px
.styling-nodes >>> .tree-container-ul > .tree-node
  margin 5px 0
</style>
