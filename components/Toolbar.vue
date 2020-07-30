<template>
  <div class="navbar navbar-inverse bg-inverse">
    <div class="navbar-header custom-navbar-header">
      <a class="navbar-brand" @click="$router.push('/')">
        {{ title }}
      </a>

      <dropdown class="section-menu nav custom-nav centered">
        <a class="dropdown-toggle" title="Разделы">
          <i class="icon_tree2 visible-xs-block"></i>
          <i class="icon_menu position-left hidden-xs"></i>
          <span class="hidden-xs">Разделы</span>
          <span class="caret hidden-xs"></span>
        </a>
        <template slot="dropdown">
          <div class="dropdown-content-body">
            <div class="row" v-for="(moduleChunk, chunkIndex) of splittedModules" :key="chunkIndex">
              <div class="col-md-2" v-for="module of moduleChunk" :key="module.id">
                <span class="module-name fg-primary">{{ module.resource.name}}</span>
                <ul class="section-list">
                  <li role="separator" class="divider menu-list-item"></li>
                  <li class="menu-list-item"
                    v-for="section of module.sections"
                    :key="section.id"
                    :class="{active: section.moduleSectionLink === currenModuleSectionLink}"
                  >
                    <a @click="navigate(module, section)">{{ section.resource.name }}</a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </template>
      </dropdown>

      <dropdown menu-right class="nav custom-nav right-pull">
        <a class="dropdown-toggle" :title="username">
          <span class="icon_main_user visible-xs-block"></span>
          <span class="hidden-xs">{{ username }} , {{oktmo}}</span>
          <span class="caret hidden-xs"></span>
        </a>
        <template slot="dropdown">
          <li class="menu-list-item"><a><span>{{ username }} , {{oktmo}}</span></a></li>
          <li class="menu-list-item"><a @click="showHelp"><i class="icon_help"></i> Справка</a></li>
          <li class="menu-list-item" v-if="adminMail"><a @click="mailtoAdmin"><i class="icon_envelop"></i> Написать администратору</a></li>
          <li class="menu-list-item"><a @click="logout"><i class="icon_switch"></i> Выйти</a></li>
        </template>
      </dropdown>

    </div>

  </div>
</template>

<script>
import chunk from 'lodash/chunk'
import cloneDeep from 'lodash/cloneDeep'
import { mapState } from 'vuex'

export default {
  computed: {
    ...mapState({
      username: state => state.user.username,
      title: state => state.appSettings.title,
      user: state => state.user,
      oktmo: state => state.user.oktmo.name,
      modules: state => state.modules,
      currenModuleSectionLink: function (state) {
        return this.getModuleSectionLink(state.currentModule, state.currentSection)
      },
      adminMail: state => state.appSettings.adminMail
    }),
    splittedModules () {
      // Добавляем в каждый раздел свойство moduleSectionLink, для удобного сравнения с текущим модулем, разделом из роутера и подстветки выбранного раздела
      const modules = cloneDeep(this.modules)
      modules.forEach(module => {
        module.sections.forEach(section => {
          section.moduleSectionLink = this.getModuleSectionLink(module, section)
        })
      })
      return chunk(modules, 6)
    }
  },
  methods: {
    async navigate (module, section) {
      const { isDeleted, canAccess } = await this.coreApi.modules.checkSection(section.sectionId)
      if (isDeleted) {
        this.$error('Запрашиваемый подраздел не найден. Возможно, он был удален.')
        return
      }
      if (canAccess) {
        this.$router.push({ path: `/${module.link}/${section.link}` })
      } else {
        this.$router.push({ name: 'page403' })
      }
    },
    getModuleSectionLink (module, section) {
      if (!module || !section) {
        return null
      }
      return `/${module.link}/${section.link}`
    },
    showHelp () {
      window.open(this.$url(`/help/index.html?00_00.htm`), '_blank')
    },
    logout () {
      this.$store.dispatch('logout')
    },
    mailtoAdmin () {
      window.location.href = `mailto: ${this.adminMail}`
    }
  }
}
</script>

<style scoped lang="stylus">
.navbar-inverse
  border-bottom-color rgba(255, 255, 255, 0.1)
  color #fff
.icon-links
  padding 15px
.custom-navbar-header
  position relative
  width 100%
  margin-left 0
.custom-nav
  position static
  height 100%
  padding 11px 0
.right-pull
  float right
  margin 0 10px
.custom-nav > a, .icon-links
  color white
.centered
  margin 0 10%
.module-name
  display block
  font-size 12px
  text-transform uppercase
  font-weight 500
  margin-bottom 10px
  padding-top 4px


.section-list
  margin 0 0 20px 0
  list-style none
  padding 0
  overflow-x hidden
  max-height 340px
  overflow-y auto

li.menu-list-item {
  position: relative;
  margin-top: 1px;
}
li.menu-list-item:first-child {
  margin-top: 0;
}
li.menu-list-item > a {
  display: block;
  color: #333333;
  padding: 8px 12px;
  border-radius: 3px;
}
li.menu-list-item > a:hover,
li.menu-list-item > a:focus {
  background-color: #f5f5f5;
}
li.menu-list-item > a > i {
  margin-right: 10px;
}
li.menu-list-item > a > .label {
  float: right;
  margin-left: 7px;
}
li.menu-list-item.active > a,
li.menu-list-item.active > a:hover,
li.menu-list-item.active > a:focus {
  color: #fff;
  background-color: #0766A6;
}
.dropdown-content-body {
  padding: 10px;
}

.section-menu.dropdown >>> .dropdown-menu
  width 100%
  height auto
  max-height 95vh
.dropdown >>> .dropdown-menu-right
  width auto
.dropdown .dropdown-toggle .caret
  transform: rotate(0deg);
  transition: all .25s ease-in-out;
.dropdown.open .dropdown-toggle .caret
  transform: rotate(180deg);
  transition: all .25s ease-in-out;
.section-menu .dropdown-content-body
  overflow auto
  height 100%
  max-height 94vh
@media (max-width: 768px)
  .navbar
    padding-left 0
    padding-right 0
  .module-name.fg-primary
    color white
  .section-list
    max-height none
  .section-list .divider
    background-color: rgba(255,255,255,.5)
  li.menu-list-item > a
    color #fff
  li.menu-list-item > a:hover,
  li.menu-list-item > a:focus {
    background-color: rgba(0, 0, 0, 0.1);
  }
  li.menu-list-item.active > a,
  li.menu-list-item.active > a:hover,
  li.menu-list-item.active > a:focus {
    background-color: rgba(0, 0, 0, 0.1);
  }
  li.menu-list-item.disabled > a,
  li.menu-list-item.disabled > a:hover,
  li.menu-list-item.disabled > a:focus {
    background-color: transparent;
    color: rgba(255, 255, 255, 0.6);
    cursor: not-allowed;
  }
  .dropdown-content-body, .dropdown >>> .dropdown-menu-right
    background-color #5C6BC0
    border-color #5C6BC0
  .dropdown-menu > li > a
    color white
  .right-pull
    right 25px
  .centered
    right 0
  .centered > a
    position: absolute
    right: 60px
  .dropdown >>> .dropdown-menu
    margin 0
    padding 0
    border-width 0 0 1px
    border-radius 0
  .dropdown >>> .dropdown-menu-right
    width 100%
</style>
