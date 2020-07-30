import Vue from 'vue'
import { url } from '^/utils/url'

Vue.mixin({
  methods: {
    $url (relativeUrl) {
      return url(relativeUrl)
    }
  }
})
