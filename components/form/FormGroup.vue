<template>
<div class="column-form-group" :class="columnsClass" v-if="columnsClass" :style="groupStyle">
  <custom-form-group
    :showEmptyLabel="showEmptyLabel"
    :required="required"
    :hasError="hasError"
    :title="title"
    :htmlTitle="htmlTitle"
    :inputGroup="inputGroup"
    >
    <slot/>
  </custom-form-group>
</div>
<custom-form-group v-else
  :showEmptyLabel="showEmptyLabel"
  :required="required"
  :hasError="hasError"
  :title="title"
  :htmlTitle="htmlTitle"
  :inputGroup="inputGroup"
  >
  <slot/>
</custom-form-group>
</template>


<script>
export default {
  components: {
  },
  props: {
    showEmptyLabel: Boolean,
    required: Boolean,
    columns: {
      type: Number,
      default: 12
    },
    nocolumns: {
      type: Boolean,
      default: false
    },
    inputGroup: {
      type: Boolean,
      default: false
    },
    hasError: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: null
    },
    htmlTitle: {
      type: Boolean,
      default: false
    },
    minWidth: {
      type: String,
      default: null
    }
  },
  computed: {
    groupStyle () {
      if (!this.minWidth) {
        return null
      }

      return {
        'min-width': this.minWidth
      }
    },
    columnsClass () {
      if (this.nocolumns) {
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
