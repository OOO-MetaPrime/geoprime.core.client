<template>
  <v-select :value="value" @input="$emit('input', $event)" :options="items" :label="text" :reduce="getSelectedValue" :clearable="allowClear" class="vue-select-style-chooser"/>
</template>

<script>
// TODO: ждем выхода 4 версии, чтобы стилизовать значки открытия выпадающего списка и очистки выбранного значения
import vSelect from 'vue-select'

export default {
  components: {
    vSelect
  },
  props: {
    items: {
      type: Array,
      required: true
    },
    value: [Object, String, Number],
    id: {
      type: String,
      default: 'id'
    },
    returnObject: {
      type: Boolean,
      default: false
    },
    text: {
      type: String,
      default: 'name'
    },
    hideFilter: {
      type: Boolean,
      default: false
    },
    placeholder: {
      type: String
    },
    allowClear: {
      type: Boolean,
      default: false
    }
  },
  mounted () {
  },
  destroyed () {
  },
  computed: {
  },
  methods: {
    getSelectedValue (item) {
      if (this.returnObject) {
        return item
      }

      return item[this.id]
    }
  }
}
</script>

<style lang="stylus" scoped>

</style>