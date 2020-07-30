<template lang="pug">
div.form-group
  label(for="req") {{ caption }} 
    span.text-danger(id="req" v-if="!!required")  *
  input.form-control(
    :class="{ required: !!required }" 
    :value="value" 
    :placeholder="placeholder" 
    ref="textinput" 
    @input="$emit('input', $event.target.value)"
    data-msg="Пожалуйста, заполните это поле")
</template>

<script>

export default {
  name: 'labeled-text-input',
  props: ['caption', 'placeholder', 'required', 'value']
}
</script>