<template>
  <div class="field-container form-group">
    <label>{{ title }}
      <span class="text-danger" v-if="required">*</span>
    </label>
    <div class="input-group">
      <input
        class="form-control"
        disabled
        :value="value"
        :title="tooltip"
      />
      <span class="input-group-btn">
        <button
          class="btn btn-default text-primary"
          @click="openModal"
          :disabled="disabled"
        >
        Выбрать
        </button>
        <button title="Сброс выбора ПД" v-if="isVisibleClearIcon" @click="clear" type="button" class="btn btn-default text-primary">
          <i class="icon_cross"/>
        </button>
      </span>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    isVisibleClearIcon: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: ''
    },
    value: {
      type: String,
      default: ''
    },
    disabled: {
      type: Boolean,
      default: false
    },
    required: {
      type: Boolean,
      default: false
    },
    tooltip: {
      type: String,
      default: ''
    }
  },
  methods: {
    openModal () {
      this.$emit('openModal')
    },
    clear () {
      this.$emit('clear')
    }
  }
}
</script>
