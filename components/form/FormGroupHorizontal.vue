<template>
<div class="horizontal-column-form-group form-horizontal" :class="columnsClass" v-if="columnsClass" :style="groupStyle">
  <custom-horizontal-form-group
    :showEmptyLabel="showEmptyLabel"
    :required="required"
    :hasError="hasError"
    :title="title"
    :htmlTitle="htmlTitle"
    :inputGroup="inputGroup"
    :labelColumns="labelColumns"
    :labelMinWidth="labelMinWidth"
    :contentColumns="contentColumns"
    >
    <slot/>
  </custom-horizontal-form-group>
</div>
<custom-horizontal-form-group v-else
  :showEmptyLabel="showEmptyLabel"
  :required="required"
  :hasError="hasError"
  :title="title"
  :htmlTitle="htmlTitle"
  :inputGroup="inputGroup"
  :labelColumns="labelColumns"
  :labelMinWidth="labelMinWidth"
  :contentColumns="contentColumns"
  >
  <slot/>
</custom-horizontal-form-group>
</template>


<script>
import CustomHorizontalFormGroup from '^/components/form/CustomHorizontalFormGroup'

export default {
  components: {
    CustomHorizontalFormGroup
  },
  props: {
    showEmptyLabel: Boolean,
    required: Boolean,
    columns: {
      type: Number,
      default: 12
    },
    labelColumns: {
      type: Number,
      default: 3
    },
    contentColumns: {
      type: Number,
      default: 9
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
    },
    labelMinWidth: {
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
