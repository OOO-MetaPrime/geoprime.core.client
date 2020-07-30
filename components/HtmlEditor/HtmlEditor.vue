<template>
   <!-- Z-index задан - чтобы не перекрывал дропдаун у селекта, так как по умолчанию тут z-index = 1000 -->
  <editor
    @change="updateData"
    :content="content"
    :class="{ readonly: readonly }"
    class="editor"
    ref="editor"
    :z-index="998"
    :height="height"
  >
  </editor>
</template>

<script>
import VueHtml5Editor from 'vue-html5-editor'
import options from './Options'
const Editor = new VueHtml5Editor(options)

export default {
  components: {
    Editor
  },
  props: {
    value: String,
    readonly: Boolean,
    height: {
      type: Number,
      default: 300
    }
  },
  mounted () {
    // Возможность редактирования определяется атрибутом "contenteditable" элемента с классом .content
    this.$refs.editor.$el.children[1].setAttribute('contenteditable', !this.readonly)
  },
  computed: {
    content () {
      return this.value ? this.value : ''
    }
  },
  methods: {
    updateData (newData) {
      this.$emit('input', newData)
    }
  }
}
</script>

<style lang="stylus" scoped>
// Серый цвет фона в режиме просмотра
.readonly >>> .content {
  background: #fafafa
}
.readonly >>> .toolbar
  display none
</style>
