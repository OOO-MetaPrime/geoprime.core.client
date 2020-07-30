import Vue from 'vue'
import Router from 'vue-router'
import Index from '^/pages/Index'
import { base } from '^/utils/url'
import Page403 from '^/pages/Page403.vue'

Vue.use(Router)

const router = new Router({
  mode: 'history',
  base,
  routes: [
    {
      path: '/',
      name: 'index',
      component: Index
    },
    {
      path: '/page403',
      name: 'page403',
      component: Page403,
      props: true
    }
  ]
})

export default router
