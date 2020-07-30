<template>
  <div class="panel panel-white flex-column flex-1">
    <div class="panel-heading custom-panel-heading" :class="customHeadingClass" v-if="showTitle">
      <h6
        class="panel-title fg-primary custom-styles-panel-title"
        :style="{ color: colorTitle }"
        v-if="title"
        :title="title">
        {{ title }}
      </h6>
      <slot name="custom-panel-heading" />
      <a
        class="heading-elements-toggle custom-heading-elements-toggle"
        v-if="toolbarMenu"
        @click="dropDownToggle"
      >
        <i class="icon_menu fg-primary btn btn-link"></i>
      </a>
      <div
        class="heading-elements"
        v-bind:class="{
          'dropdown-open':isOpen,
          'turn-on': isButtonsHidden
        }"
        v-if="$slots['heading-elements'] || collapsible"
       >
        <ul class="icons-list" v-if="collapsible">
          <li>
            <a @click="isCollapsed = !isCollapsed">
              <i :class="{ 'icon_arrow_down': isCollapsed, 'icon_arrow_up': !isCollapsed }"></i>
             </a>
          </li>
        </ul>
        <slot name="heading-elements"/>
      </div>
    </div>
    <div v-show="!isCollapsed || !collapsible" class="panel-body" :class="customBodyClass" v-if="$slots['body']">
      <slot name="body" />
    </div>
    <slot v-show="!isCollapsed || !collapsible" />
  </div>
</template>

<script>
export default {
  name: 'Panel',
  props: {
    bodyClass: String,
    headingClass: String,
    title: String,
    collapsible: Boolean,
    openSideBar: String,
    iscollapsed: {
      type: Boolean,
      default: true
    },
    toolbarMenu: {
      type: Boolean,
      default: false
    },
    showTitle: {
      type: Boolean,
      default: true
    },
    autoSize: {
      type: Boolean,
      default: false
    },
    colorTitle: {
      type: String,
      default: ''
    }
  },
  computed: {
    isButtonsHidden () {
      return this.toolbarMenu && !this.isOpen
    },
    customHeadingClass () {
      const classes = {}

      if (this.headingClass) {
        classes[this.headingClass] = true
      }

      return classes
    },
    customBodyClass () {
      const classes = {
        'flex-1': !this.autoSize,
        'flex-auto': this.autoSize
      }
      if (this.bodyClass) {
        classes[this.bodyClass] = true
      }

      return classes
    }
  },
  data () {
    return {
      isCollapsed: this.iscollapsed,
      isOpen: false
    }
  },
  methods: {
    dropDownToggle () {
      this.isOpen = !this.isOpen
    }
  }
}
</script>

<style lang="stylus" scoped>
.content > .panel
  margin-right 0
  margin-left 0
  margin-bottom 0
.custom-panel-group > .panel
  margin 0
  min-width 0
  height 100%

.gorizontal > .panel
  margin 0
  min-height 0
.gorizontal > .panel + .panel
  margin-top 5px

.custom-panel-heading
  position relative
  display flex
  flex-shrink 0
  justify-content space-between
  align-items center
.custom-styles-panel-title
  white-space nowrap
  overflow hidden
  text-overflow ellipsis
  width auto
  min-width 75px
  display block
  position relative
  margin 7px 10px 6px 0px
  flex 1 1 auto
  -ms-flex-preferred-size auto
  -ms-flex-negative 0

.heading-elements
  flex 2 1 50%
  position relative
  top auto
  right auto
  height auto
  margin-top 0
  display flex
  flex-wrap wrap
  justify-content flex-end
  align-items center
.heading-elements .icons-list
  display flex
  margin-top 0
.custom-heading-btn
  float none
  display flex
  justify-content flex-end
.custom-heading-btn > button
  margin 0 1px
.heading-elements.dropdown-open
  justify-content flex-start
@media (min-width 769px)
  .heading-elements.dropdown-open
    padding 0
    position static
    justify-content flex-end
@media (max-width 1366px)
  .icons-list
    margin 0
@media (max-width 768px)
  .custom-styles-panel-title
    width auto
    padding-right 16px
    height auto
  .turn-on.heading-elements
    display none
  .heading-elements
    height 36px
    flex 1 1 40px
.dropdown-open
  display flex
  right 0
  padding 15px
  background #fff
  width 100%
  position absolute
  top 70%
  height auto
  z-index 2
.custom-heading-elements-toggle
  position relative
  margin-top 0
  right 0
  top 5%
.custom-heading-elements-toggle > i
  font-size 16px
.modal-dialog .modal-body .panel
  -ms-flex-preferred-size auto  
.panel-body
  -ms-flex-preferred-size auto  
</style>
