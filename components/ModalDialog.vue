<template>
  <modal
    class="custom-modal-dialog"
    v-bind="$attrs"
    v-on="$listeners"
    append-to-body
    :backdrop="false"
    :transition-duration="0"
  >
    <slot v-for="(_, name) in $slots" :name="name" :slot="name" />
  </modal>
</template>

<script>

export default {
  name: 'ModalDialog',
  inheritAttrs: false
}
</script>

<style lang="stylus" scoped>
</style>