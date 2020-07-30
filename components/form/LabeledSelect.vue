<template lang="pug">
div.form-group
  label(for="req") {{ caption }} 
    span.text-danger(id="req" v-if="!!required") *
  select2(:class="{ required: !!required }" :data="values" :value="value" @input="value => $emit('input', value)" ref="select2")
</template>

<script>
export default {
  props: ['caption', 'values', 'value', 'required'],
  components: {
  },
  methods: {
    init(id) {
      this.$refs.select2.init(id)
    }
  }
}
</script>
