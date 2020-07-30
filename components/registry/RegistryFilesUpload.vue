<template>
  <vue-upload
    :value="value"
    @input="$emit('input', $event)"
    @changed="$emit('changed')"
    ref="upload"
    :canUpload="canCreate"
  />
</template>

<script>
import VueUpload from '^/components/form/VueUpload'

export default {
  components: {
    VueUpload
  },
  props: {
    value: Array,
    canCreate: {
      type: Boolean,
      default: true
    }
  },
  methods: {
    add (file) {
      this.$refs.upload.add(file)
    },
    clear () {
      this.$refs.upload.clear()
    }
  }
}
</script>
