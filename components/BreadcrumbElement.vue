<template>
    <div
       class="breadcrumb-item"
       v-if="active">
      <a @click="$emit('click', item)">{{ item.name }}</a>
    </div>
    <div
      v-else
      class="active breadcrumb-item" 
      :class="{'breadcrumb-content-show': isShowBreadcrumbContent}"
    >
      <span class="breadcrumb-content">
        {{ item.name }}
      </span>
    </div>
</template>

<script>
export default {
  props: {
    active: Boolean,
    item: Object
  },
  data () {
    return {
      isShowBreadcrumbContent: false
    }
  },
  methods: {
    slideToggle () {
      this.isShowBreadcrumbContent = !this.isShowBreadcrumbContent
    }
  }
}
</script>

<style scoped>
.breadcrumb-item {
  white-space: nowrap;
}
a {
  color: #333333;
  cursor: pointer;
}
.active {
  display: flex;
  align-items: flex-start;
  flex: 1;
  min-width: 10px;
  color: #1e88e5;
}
.active a {
  cursor: default
}
@media (max-width: 575px) {
  .breadcrumb-mobile-action-slide-toggle {
    display: flex;
    margin: 0 10px;
  }
  .active > span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .breadcrumb-content-show > span {
    white-space: normal;
  }
}
</style>


