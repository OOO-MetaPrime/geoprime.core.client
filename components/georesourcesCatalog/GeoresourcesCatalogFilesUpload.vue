<template>
 <vue-upload
   :value="value"
   @input="$emit('input', $event)"
 />
</template>

<script>
import VueUpload from '^/components/form/VueUpload'

export default {
  components: {
    VueUpload
  },
  props: {
    value: Array
  }
}
</script>
