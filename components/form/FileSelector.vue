<template lang="pug">
div.file-selector-container
  input(type="file" @change="changeFile" ref="fileSelector" :accept="filter")
</template>

<script>
export default {
  name: 'fileselector',
  props: ['filter'],
  data () {
    return {
      metadata: null
    }
  },
  methods: {
    selectFile (metadata) {
      this.metadata = metadata
      this.$refs.fileSelector.click()
    },
    changeFile (event) {
      const file = event.target.files[0]
      this.$refs.fileSelector.value = '' // С непустым значением поля не сработает обработчик changed

      // Поддерживается и v-model и события
      this.$emit('input', file, this.metadata)
      this.$emit('changed', file, this.metadata)
    }
  }
}
</script>

<style lang="stylus" scoped>
.file-selector-container
  display none
</style>