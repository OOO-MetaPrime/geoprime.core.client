<template lang="pug">
input.form-control(
  :value="value"
  type="text"
  :readonly="readonly"
  :disabled="disabled"
  :placeholder="placeholder"
  @input="$emit('input', $event.target.value)"
  @blur="$emit('blur', $event)"
  @change="$emit('change', $event)"
  @keyup="$emit('keyup', $event)"
  )
</template>

<script>

export default {
  props: ['placeholder', 'value', 'readonly', 'disabled']
}
</script>