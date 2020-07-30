<template>
  <panel title="Информация">
    <div class="info-container" v-html="html"></div>
  </panel>
</template>

<script>
export default {
  props: ['html']
}
</script>

<style>
.info-container {
  padding: 20px;
  overflow: auto;
}
</style>


