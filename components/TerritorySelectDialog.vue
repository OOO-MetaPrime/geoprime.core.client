<template lang="pug">
modal-dialog(v-model="isShown" title="Выбор территории" class="address-registry-modal")
  div.row.form-group
    div.col-md-6
      div.input-group
        input.form-control(type="text" v-on:keydown.enter.prevent="searchItems" v-model="searchString" autofocus ref="searchInput")
        span.input-group-btn
          button.btn.btn-default(type="button" @click="searchItems") Поиск
  div.row(ref="oktmotree")
    tree.oktmo-tree.form-group(v-if="isShown" no-dots valueFieldName="code" :textFieldName="nameField" :data="filteredItems" show-checkbox whole-row @item-click="itemClick")
  div(slot="footer")
    button.btn.btn-link(type="button" @click="onCancelSelect") Закрыть
    button.btn.btn-primary(type="button" @click="onConfirmSelect" :disabled="!selectedItem") Выбрать
</template>

<script>
import _cloneDeep from 'lodash/cloneDeep'
import Tree from 'packages/vue-jstree/src/tree.vue'
import { mapState } from 'vuex'

export default {
  props: {
    showEmpty: {},
    showAllOktmos: Boolean,
    isCheckProfiles: Boolean,
    customItems: {
      type: Array,
      default: null
    }
  },
  components: {
    Tree
  },
  data () {
    return {
      items: [],
      selectedItem: null,
      selectItemHandler: () => {},
      isShown: false,
      valueField: 'id',
      nameField: 'name',
      searchString: '',
      filter: ''
    }
  },
  computed: {
    filteredItems () {
      return this.filter ? this.getFilteredItems(this.filter) : this.items
    },
    isTerritorySelected () {
      return this.items.some(item => item.selected)
    },
    ...mapState({
      allowedOktmos: state => state.user.allowedOktmoTree,
      allOktmos: state => state.user.allowedOktmoTree
    })
  },
  methods: {
    showModal (selectItemHandler) {
      if (selectItemHandler) {
        this.selectItemHandler = selectItemHandler
      }

      this.isShown = true
      if (this.customItems) {
        this.items = this.customItems
      } else {
        const items = this.showEmpty ? [{ id: '0', code: null, name: 'Не заполнено ОКТМО', children: [] }] : []
        this.items = items.concat(_cloneDeep(this.showAllOktmos ? this.allOktmos : this.allowedOktmos))
      }
      this.$nextTick(() => {
        this.$refs.searchInput.focus()
      })
    },
    hideModal () {
      this.isShown = false
    },
    onCancelSelect () {
      this.hideModal()
    },
    onConfirmSelect () {
      this.hideModal()
      this.selectItemHandler(this.selectedItem)
    },
    async itemClick (caller, item) {
      this.$emit('setSaveActive', true)
      if (this.isCheckProfiles) {
        const profiles = await this.coreApi.settingsProfiles.search()
        let profilesOktmoIds = []
        for (const profile of profiles) {
          profilesOktmoIds.push(profile.oktmoId)
        }
        if (profilesOktmoIds.includes(item.id)) {
          this.$error(`Профиль для ${item.name} уже существует`)
          this.selectedItem = null
          return
        }
      }
      this.selectedItem = item
    },
    searchItems () {
      this.filter = this.searchString.toLowerCase()
    },
    getFilteredItems (filter) {
      this.blockUI(this.$refs.oktmotree, true)
      const result = []

      const itemsForSearch = this.items.filter(x => x.code)
      const itemsCopy = itemsForSearch.length === 1 ? _cloneDeep(itemsForSearch[0].children) : _cloneDeep(itemsForSearch)
      for (const item of itemsCopy) {
        const found = this.recursiveSearch(item, result, filter)
        if (found) {
          result.push(item)
        }
      }

      this.blockUI(this.$refs.oktmotree, false)
      return result
    },
    recursiveSearch (item, result, searchString) {
      const name = item.name.toLowerCase()
      let itemsFound = false
      const foundItems = []
      if (item.children) {
        for (const child of item.children) {
          const childFound = this.recursiveSearch(child, result, searchString)
          if (childFound) {
            foundItems.push(child)
          }
          itemsFound |= childFound
        }
      }
      if (name.indexOf(searchString) !== -1 || itemsFound) {
        item.children = foundItems
        return true
      }

      return false
    }
  }
}
</script>

<style lang="stylus" scoped>
.address-registry-modal >>> .modal-body
   width 585px
   overflow auto
   .tree-node
     max-width 575px
     .tree-anchor
       white-space normal
       min-width 24px
       min-height 24px
       height auto
.oktmo-tree
  height 250px
.select-content
  background-color white
.oktmo-tree >>> i.tree-icon.tree-themeicon
  display none
.oktmo-tree >>> .tree-node
  margin-top 5px
  margin-left 0
.oktmo-tree >>> .tree-children
  margin-left 0px
@media (min-width: 769px)
  .oktmo-tree
    height 300px
@media (min-width: 1200px)
  .oktmo-tree
    height 500px
</style>
