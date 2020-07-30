<template lang="pug">
div.text-center.content-group
  h1.error-title 403
  h5 {{ errorMessage || 'У Вас недостаточный набор прав для просмотра данного раздела.' }}
</template>
<script>
export default {
  props: ['errorMessage']
}
</script>

<style lang="stylus" scoped>

</style>