<template>
  <div class="breadcrumb-container">
    <div class="breadcrumb-main">
      <breadcrumb-element
        class="main-breadcrumb-item"
        v-for="(item, index) of routes"
        :key="index"
        :active="index != routes.length - 1"
        :item="item"
        @click="$emit('click', $event)"
      />
    </div>
    <div class="breadcrumb-right-toolbar">
      <slot/>
    </div>
  </div>
</template>

<script>

import BreadcrumbElement from './BreadcrumbElement'

export default {
  components: {
    BreadcrumbElement
  },
  props: {
    routes: {
      type: Array,
      default: () => []
    }
  },
  computed: {
    prevRoutes () {
      if (this.routes.length > 1) {
        return this.routes[this.routes.length - 2]
      }
      return this.routes[this.routes.length - 1]
    },
    routesLength () {
      return this.routes.length === 1
    }
  }
}
</script>

<style scoped>
.breadcrumb-container {
  display: flex;
  background-color: white;
  flex-wrap: wrap;
}
.breadcrumb-main {
  display: flex;
  flex-wrap: wrap;
  flex: 1;
  padding: 5px;
  padding-left: 0;
  margin-left: 20px;
}
.main-breadcrumb-item + .main-breadcrumb-item {
  padding-left: 5px;
}
.main-breadcrumb-item + .main-breadcrumb-item:before {
  content: '/\A0';
  color: #333;
  padding: 0 5px;
}
.breadcrumb-right-toolbar {
  align-self: flex-end;
  display: flex;
  margin-right: 20px;
  padding: 5px;
}
.breadcrumb-right-toolbar >>> div a {
  padding: 5px;
  color: #333;
}
.breadcrumb-right-toolbar >>> div a.active {
  padding: 5px;
  color: #1e88e5;
}
.breadcrumb-right-toolbar >>> div a i {
  margin-right: 5px;
}
</style>
