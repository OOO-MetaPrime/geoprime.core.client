<template lang="pug">
textarea.form-control(
  :value="value"
  :rows="rows"
  :cols="cols"
  :readonly="readonly"
  :title="title"
  :placeholder="placeholder"
  @input="$emit('input', $event.target.value)"
  )
</template>

<script>

export default {
  props: ['placeholder', 'value', 'readonly', 'cols', 'rows', 'title']
}
</script>