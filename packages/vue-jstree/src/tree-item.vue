<template>
    <li role="treeitem"
        :class="classes"
        :draggable="draggable"
        @dragstart.stop="onItemDragStart($event, _self, _self.model)"
        @dragend.stop.prevent="onItemDragEnd($event, _self, _self.model)"
        @dragover.stop.prevent="() => false"
        @dragenter.stop.prevent="isDragEnter = true"
        @dragleave.stop.prevent="isDragEnter = false"
        @drop.stop.prevent="handleItemDrop($event, _self, _self.model)">
        <div role="presentation" :class="wholeRowClasses" v-if="isWholeRow">&nbsp;</div>
        <i class="tree-icon tree-ocl" 
           role="presentation" 
           @click="handleItemToggle" 
           :class="{ invisible: hideExpandCaret }"
         > 
        </i>
        <div :class="getItemClasses(model)" @click="handleItemClick($event)" @mouseover="isHover=true" @mouseout="isHover=false">
            <i class="tree-icon tree-checkbox" role="presentation" v-if="showCheckbox && !model.loading && (!data.value || !data.value.disableCheckbox)"></i>
            <span :class="spanclasses" :title="model[textFieldName]">{{model[textFieldName]}}</span>
        </div>
        <ul role="group" ref="group" class="tree-children" v-if="isFolder">
            <tree-item v-for="(child, index) in model.children"
                       :async="async"
                       :key="index"
                       :data="child"
                       :whole-row="wholeRow"
                       :show-checkbox="showCheckbox"
                       :height= "height"
                       :parent-item="model.children"
                       :textFieldName="textFieldName"
                       :draggable="draggable"
                       :itemClassFunc="itemClassFunc"
                       :on-item-click="onItemClick"
                       :on-item-toggle="onItemToggle"
                       :on-item-drag-start="onItemDragStart"
                       :on-item-drag-end="onItemDragEnd"
                       :on-item-drop="onItemDrop">
            </tree-item>
        </ul>
    </li>
</template>
<script>

export default {
  name: 'TreeItem',
  props: {
    async: { type: Function },
    data: { type: Object, required: true },
    wholeRow: { type: Boolean, default: false },
    showCheckbox: { type: Boolean, default: false },
    height: { type: Number, default: 24 },
    parentItem: { type: Array },
    textFieldName: { type: String, default: 'text' },
    draggable: { type: Boolean, default: false },
    onItemClick: {
      type: Function, default: () => false
    },
    onItemToggle: {
      type: Function, default: () => false
    },
    onItemDragStart: {
      type: Function, default: () => false
    },
    onItemDragEnd: {
      type: Function, default: () => false
    },
    onItemDrop: {
      type: Function, default: () => false
    },
    itemClassFunc: {
      type: Function, default: () => {}
    },
    klass: String
  },
  data () {
    return {
      isHover: false,
      isDragEnter: false,
      model: this.data
    }
  },
  watch: {
    isDragEnter (newValue) {
      if (newValue) {
        this.$el.style.backgroundColor = "#C9FDC9"
      } else {
        this.$el.style.backgroundColor = "inherit"
      }
    },
    data (newValue) {
      this.model = newValue
    },
    'model.opened': {
      handler: function (val, oldVal) {
        this.onItemToggle(this, this.model)
        this.handleSetGroupMaxHeight()
      },
      deep: true
    }
  },
  computed: {
    // Свойство, отвечающее за отображение каретки раскрытия при асинхронной загрузке дерева,
    // так как в этом случае children'ы лежат в data.value.children, а не в data.children
    hideExpandCaret () {
      return this.async && this.data.value.children && !this.data.value.children.length
    },
    isFolder () {
      return this.model.children && this.model.children.length
    },
    classes () {
      return [
        { 'tree-node': true },
        { 'tree-open': this.model.opened },
        { 'tree-closed': !this.model.opened },
        { 'tree-leaf': !this.isFolder },
        { 'tree-loading': !!this.model.loading },
        { 'tree-drag-enter': this.isDragEnter },
        { [this.klass]: !!this.klass }
      ]
    },
    anchorClasses () {
      return {
        'tree-anchor': true,
        'tree-disabled': this.model.disabled,
        'tree-selected': this.model.selected,
        'tree-hovered': this.isHover
      }
    },
    spanclasses () {
      return [
        { 'deleted-item': this.model.isDeleted }
      ]
    },
    wholeRowClasses () {
      return [
        { 'tree-wholerow': true },
        { 'tree-wholerow-clicked': this.model.selected },
        { 'tree-wholerow-hovered': this.isHover }
      ]
    },
    themeIconClasses () {
      return [
        { 'tree-icon': true },
        { 'tree-themeicon': true },
        { [this.model.icon]: !!this.model.icon },
        { 'tree-themeicon-custom': !!this.model.icon }
      ]
    },
    isWholeRow () {
      if (this.wholeRow) {
        if (this.$parent.model === undefined) {
          return true
        } else if (this.$parent.model.opened === true) {
          return true
        } else {
          return false
        }
      }
    }
  },
  methods: {
    getItemClasses (item) {
      const classes = this.anchorClasses
      const itemClasses = this.itemClassFunc(item)
      return Object.assign({}, classes, itemClasses)
    },
    handleRecursionNodeParents (node, func) {
      if (node.$parent) {
        func(node.$parent)
        this.handleRecursionNodeParents(node.$parent, func)
      }
    },
    handleItemToggle () {
      if (this.isFolder) {
        this.model.opened = !this.model.opened
        this.onItemToggle(this, this.model)
        this.handleSetGroupMaxHeight()
      }
    },
    handleGroupMaxHeight () {
      let length = 0
      let childHeight = 0
      if (this.model.opened) {
        length = this.$children.length
        for (let children of this.$children) {
          childHeight += children.handleGroupMaxHeight()
        }
      }
      return length * this.height + childHeight
    },
    setHeight (node) {
      if (node.$refs.group) {
        if (node.handleGroupMaxHeight() !== 0) {
          node.$refs.group.style.maxHeight = 'none'
          node.$refs.group.style.height = 'auto'
        } else {
          node.$refs.group.style.maxHeight = node.handleGroupMaxHeight() + 'px'
        }
      }
    },
    handleSetGroupMaxHeight () {
      this.setHeight(this)
      var self = this
      this.$nextTick(() => {
        this.handleRecursionNodeParents(self, node => {
          self.setHeight(node)
        })
      })
    },
    handleItemClick (event) {
      if (this.model.disabled || (this.data.value && this.data.value.disableCheckbox)) return
      this.model.selected = !this.model.selected
      // event.ctrlKey - Boolean значение определяющее была ли нажата клавиша Ctrl при клике
      // если нажат Ctrl - при мультивыборе выделяем только выбранный элемент, дочерние не трогаем
      this.onItemClick(this, this.model, event.ctrlKey)
    },
    handleItemDrop (e, oriNode, oriItem) {
      this.$el.style.backgroundColor = "inherit"
      this.onItemDrop(e, oriNode, oriItem)
    }
  },
  mounted () {
    this.handleSetGroupMaxHeight()
  }
}
</script>