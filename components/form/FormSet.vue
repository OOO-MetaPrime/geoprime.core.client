<template>
  <fieldset class="form-set">
    <legend class="text-semibold text-primary flex flex-row form-set-legend" v-if="title">
      <div class="legend-title">{{ title }}</div>
      <div class="form-set-buttons">
        <slot name="buttons"/>
      </div>
    </legend>
    <slot />
  </fieldset>
</template>

<script>

export default {
  props: {
    title: {
      type: String,
      default: ''
    }
  }
}
</script>

<style lang="stylus" scoped>
.legend-title
  margin-left 3px
.form-set
  border 1px solid #ddd
  padding 1px
  margin-top 8px
.form-set-legend
  align-items center
  width auto
  margin-left 8px
  padding 0
  margin-bottom 5px
  justify-content space-between
.form-set-buttons
  margin-right 5px
</style>
