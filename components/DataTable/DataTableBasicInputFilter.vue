<template>
  <div class="">
    <div class="basic-input-filter-container input-group col-lg-12" :class="{'has-error': !isCorrectValidation}">
      <slot />
      <span class="input-group-btn filter-group">
        <dropdown ref="dropdown" :menu-right="isLastIndex" append-to-body :not-close-elements="ele" v-model="isDropdownOpened">
          <button type="button" class="btn btn-default dropdown-toggle" :class="{ 'icon_filter_on': hideEmpty, 'fg-primary': hideEmpty, 'icon_filter_off': !hideEmpty }"/>
          <template slot="dropdown">
            <li>
              <checkbox class="stretch" title="скрыть пустые значения" :value="hideEmpty" @input="hideEmptyChanged($event)"/>
              <div v-if="operators && operators.length" class="operators-option">
                <span class="operators-option-label">Оператор</span>
                <div class="operator-selection">
                  <select2 v-model="filterOperator" :data="operators" :onSelected="onSelected" :hideFilter="true"/>
                </div>
              </div>
              <slot name="dropdown-items" />
            </li>
          </template>
        </dropdown>
      </span>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    filter: Object,
    hideEmpty: Boolean,
    isLastIndex: Boolean,
    isCorrectValidation: Boolean,
    filters: Array,
    operators: Array
  },
  data () {
    return {
      filterOperator: this.filter.operator || '=',
      ele: [],
      isDropdownOpened: false
    }
  },
  components: {
  },
  watch: {
    isCorrectValidation () {
      return this.isCorrectValidation
    }
  },
  mounted () {
    this.ele.push(this.$refs.dropdown.$el)
  },
  methods: {
    onSelected () {
      this.filter.operator = this.filterOperator
      this.$emit('filter')
      this.isDropdownOpened = false
    },
    hideEmptyChanged (newValue) {
      this.filter.hideEmpty = newValue
      this.$emit('filter')
    }
  }
}
</script>

<style scoped lang="stylus">
.filter-group
  border 1px solid transparent
  border-left none
  z-index 0
.operators-option
  display flex
  align-items center
  margin 5px
  justify-content space-between
.operators-option-label
  margin-left 3px
  margin-right 3px
.stretch
  width 100%
  padding-left 10px
  margin-bottom 0
.basic-input-filter-container .form-control
  padding 3px 10px
  height 30px
.basic-input-filter-container .btn
  padding 4px 8px
.operator-selection
  width 80px
</style>
