<template lang="pug">
  input.form-control(
    :value="value"
    :readonly="readonly"
    ref="maskinput"
    @input="setMaskedValue"
    :title="title")
</template>

<script>
import Inputmask from 'inputmask'

export default {
  props: ['value', 'title', 'mask', 'readonly'],
  data () {
    return {
    }
  },
  watch: {
    mask (newValue) {
      if (this.$refs.maskinput.inputmask) {
        this.$refs.maskinput.inputmask.remove()
      }
      const im = new Inputmask(this.mask)
      im.mask(this.$refs.maskinput)
    }
  },
  mounted () {
    const im = new Inputmask(this.mask)
    im.mask(this.$refs.maskinput)
  },
  methods: {
    getEmptyMask () {
      return this.$refs.maskinput.inputmask.getemptymask()
    },
    setMaskedValue (event) {
      const newValue = event.srcElement.value
      this.$emit('input', newValue)
    }
  }
}
</script>