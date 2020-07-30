<template>
  <div class="app flex-column">
    <toolbar v-if="routerVisible"/>
    <router-view v-if="routerVisible" class="flex-1"/>
  </div>
</template>

<script>
import * as coreMutations from '^/state/mutations'
import Toolbar from '^/components/Toolbar'
import 'font-awesome/css/font-awesome.css'

export default {
  data () {
    return {
      routerVisible: false
    }
  },
  components: {
    Toolbar
  },
  async created () {
    try {
      // TODO вынести в actions и вызывать коммиты в них
      const enums = await this.coreApi.enums.getEnums()
      this.$store.commit(coreMutations.ENUMS, enums)

      const resourcesAndActions = await this.coreApi.security.getResourcesAndActions()
      this.$store.commit(coreMutations.RESOURCES_AND_ACTIONS, resourcesAndActions)

      const user = await this.coreApi.auth.getUserData()
      const [settingsProfile, systemParameters, appSettings, urbanPlanningObjects] = await Promise.all([
        this.coreApi.common.getSettingsProfile(),
        this.coreApi.systemParameters.getOptions(),
        this.coreApi.common.getApplicationSettings(),
        this.coreApi.urbanPlanningObjects.getUrbanPlanningObjects()
      ])

      const territoriesTree = this.coreApi.territories.getTerritoriesTree(user.territories)
      this.$store.commit(coreMutations.USER_DATA, user)
      this.$store.commit(coreMutations.PROFILE_DATA, settingsProfile)
      this.$store.commit(coreMutations.SYSTEM_PARAMETERS, systemParameters)
      this.$store.commit(coreMutations.APP_SETTINGS, appSettings)
      this.$store.commit(coreMutations.SET_TERRITORIES_TREE, territoriesTree)
      this.$store.commit(coreMutations.SET_TERRITORIES, user.territories)
      this.$store.commit(coreMutations.URBAN_PLANNING_OBJECTS, urbanPlanningObjects)
      this.routerVisible = true
      this.setTitle()
    } catch (error) {
      console.error(error)
      const user = await Promise.resolve(this.coreApi.auth.getUserData())

      this.$store.commit(coreMutations.USER_DATA, user)

      this.routerVisible = true
      this.$router.push({ name: `page403` })
    }
  },
  mounted () {
  },
  methods: {
    setTitle () {
      document.title = this.$store.state.appSettings.title
    }
  }
}
</script>

<style lang="stylus">
.form-group
  margin-bottom: 5px
ul.dropdown-menu
  z-index 1500
legend
  border: 0
  margin-bottom: 0
.panel-title
  font-weight: 500
.panel .panel .panel-title
  font-weight: 400
.content
  padding 5px
  padding-top 2px
.panel
  margin 5px
  min-width 100px
.tablet-grid > .panel
  margin 5px
  // Запрещает растягивание содержимого по ширине
  min-width 0
body
  overflow-y hidden
.app
  height 100%
.flex-row
  display flex
  flex-direction row
  min-height 0
.flex-column
  display flex
  flex-direction column
  min-height 0
.flex-1
  flex: 1 1 0
.flex-auto
  flex: 1 0 auto
.full-height
  height 100%
section .tab-content .tab-pane
  height 100%
section .tab-content
  flex 1
section .tab-content .tab-pane.active
  display flex
  flex-direction column
.modal-dialog .modal-body
  min-height 200px
.modal-dialog.modal-lg .modal-body
  min-height 400px
@media (min-height: 700px)
  .modal-dialog.modal-lg .modal-body
    min-height 500px
@media (min-height: 800px)
  .modal-dialog.modal-lg .modal-body
    min-height 600px
@media (min-height: 900px)
  .modal-dialog.modal-lg .modal-body
    min-height 700px

.modal-dialog.modal-sm .modal-body
  min-height auto
.confirmation-dialog.modal.in .modal-dialog, .confirmation-dialog.modal.fade .modal-dialog
  margin: 0
  top: 40%
  transform translateY(-50%)
  -ms-transform: translateY(-50%)
  margin-right auto
  margin-left auto

.ol-box
  border-color #e91e63
.mx-datepicker
  .mx-calendar-icon text
    fill #0766A6
  .mx-calendar-icon line
    stroke #0766A6
  .mx-calendar-icon rect
    stroke #0766A6
.mx-datepicker.disabled
  .mx-calendar-icon text
    fill gray
  .mx-calendar-icon line
    stroke gray
  .mx-calendar-icon rect
    stroke gray
scale-line-color = #888

.ol-scale-line.ol-unselectable
  left 5px
  bottom 8px
  background none
  .ol-scale-line-inner
    color scale-line-color
    border-color scale-line-color

.nav-tabs:before
  margin 0
.heading-elements > button
  margin 0 1px
@media (max-width 1366px)
  .content
    flex-wrap wrap
@media (min-width: 769px)
  .content-wrapper-relative
    position relative
@media (max-width 1024px)
  .correcter-table
    height 92vh
@media (max-width: 769px)
  .panel-hide
    display none
  .heading-elements .heading-btn
    margin-bottom 0
  .panel, .content > .panel
    margin 5px
    margin-bottom -3px
  .tablet-grid
    height 92vh
  .tablet-grid > .panel
    margin-bottom -10px
@media (max-width 425px)
  .content
    height 92vh
  .content > .panel
    width 98%
    height 98%
    overflow auto
</style>

<style lang="less">
// Стили для нотификейшенов из uiv
@import "../node_modules/bootstrap/less/variables.less";
@import "../node_modules/bootstrap/less/mixins/alerts.less";
@import "../node_modules/bootstrap/less/alerts.less";
body > .alert {
  z-index: 2000;
}
</style>
