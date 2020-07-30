<template>
  <div>
    <input 
      class="form-control" 
      type="link" 
      v-if="editable"
      :value="value"
      @input="validate($event)"
    />
    <a @click.prevent="openLink" v-else>{{ value }}</a>
  </div>
</template>

<script>

import { checkCorrectEmail, checkCorrectUrl } from '^/helpers/checkCorrectLinkHelper'

export default {
  props: {
    editable: Boolean,
    value: String,
    column: Object
  },
  data () {
    return {
      isValidate: false
    }
  },
  methods: {
    validate (e) {
      const { value } = e.target
      const { isLink, isEmail } = this.column

      if (isLink) {
        this.isValidate = this.validateUrl(value)
      }
      if (isEmail) {
        this.isValidate = this.validateEmail(value)
      }

      if (!this.isValidate) {
        this.$emit('changeDisable', true, value)
        return
      }
      this.$emit('changeDisable', false, value)
    },
    validateUrl (value) {
      return checkCorrectUrl(value)
    },
    validateEmail (value) {
      return checkCorrectEmail(value)
    },
    openLink () {
      const { isLink, isEmail } = this.column

      if (isLink) {
        const checkCorrectUrl = this.validateUrl(this.value)
        if (!checkCorrectUrl) {
          this.$error('Некорректный адрес')
          return
        }
        window.open(`${this.value}`)
      }
      if (isEmail) {
        const checkCorrectEmail = this.validateEmail(this.value)
        if (!checkCorrectEmail) {
          this.$error('Некорректный адрес')
          return
        }
        window.open(`mailto:${this.value}`)
      }
    }
  }
}
</script>

