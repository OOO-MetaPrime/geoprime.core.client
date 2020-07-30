<template>
<div class="column-form-row" :class="columnsClass" v-if="columnsClass" :style="rowStyle">
  <div class="row">
    <slot />
  </div>
</div>
<div class="row" v-else>
  <slot />
</div>
</template>

<script>

export default {
  props: {
    columns: {
      type: Number,
      default: null
    },
    minWidth: {
      type: String,
      default: null
    }
  },
  computed: {
    rowStyle () {
      if (!this.minWidth) {
        return null
      }

      return {
        'min-width': this.minWidth
      }
    },
    columnsClass () {
      if (this.columns == null) {
        return null
      }
      const colCount = this.columns != null ? this.columns : 12
      const columnClassname = `col-md-${colCount}`
      return {
        [columnClassname]: true
      }
    }
  }
}
</script>