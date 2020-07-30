<template>
  <button
    type="button"
    class="btn btn-default btn-icon hidden-xs"
    :class="toggleButtonClass(isActive)"
    title="Выделить прямоугольником область карты - сделать скриншот"
    @click="click"
    :disabled="innerDisabled"
  >
    <i class="icon_copy"></i>
  </button>
</template>

<script>
import { mapState, mapActions } from 'vuex'
import componentsMixin from '^/mixins/components'
import Select from 'ol/interaction/select'
import DragBox from 'ol/interaction/dragbox'

export default {
  props: {
    map: Object,
    disabled: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      isActive: false,
      innerDisabled: this.disabled
    }
  },
  mixins: [componentsMixin],
  computed: {
    ...mapState({
      isSelectAreaButtonActive: state => state.developedDocuments.isSelectAreaButtonActive,
      breadcrumb: state => state.breadcrumb
    })
  },
  watch: {
    'isSelectAreaButtonActive': function (newState) {
      if (newState === true) {
        this.innerDisabled = false
        this.activate()
      } else {
        this.innerDisabled = true
        this.deactivate()
      }
    },
    'breadcrumb': function () {
      this.innerDisabled = true
      this.deactivate()
    }
  },
  methods: {
    ...mapActions({
      setImageBlob: 'developedDocuments/setImageBlob',
      setSelectAreaButtonActive: 'developedDocuments/setSelectAreaButtonActive'
    }),
    click () {
      this.isActive ? this.deactivate() : this.activate()
      this.$emit('click', this.isActive)
    },
    activate () {
      // The Select interaction to handle click
      this.select = new Select()
      this.map.addInteraction(this.select)

      // The DragBox interaction used to select features by drawing box
      this.dragBox = new DragBox()
      this.map.addInteraction(this.dragBox)

      this.dragBox.on('boxend', () => {
        // Convert geometry to pixels (extent doesn't gives correct bounds when view is rotated)
        var left = Infinity
        var top = Infinity
        var bottom = -Infinity
        var right = -Infinity

        this.dragBox.getGeometry().getCoordinates()[0].forEach(coord => {
          var pixel = this.map.getPixelFromCoordinate(coord)
          left = Math.min(left, pixel[0])
          right = Math.max(right, pixel[0])
          top = Math.min(top, pixel[1])
          bottom = Math.max(bottom, pixel[1])
        })

        this.map.once('postcompose', event => {
          var image = event.context.canvas
          var canvas = document.createElement('canvas')
          canvas.width = right - left
          canvas.height = bottom - top
          var ctx = canvas.getContext('2d')
          ctx.drawImage(image, left, top, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height)

          if (navigator.msSaveBlob) {
            navigator.msSaveBlob(canvas.msToBlob(), 'map.png')
          } else {
            canvas.toBlob(blob => {
              this.setImageBlob(blob)
              // this.getScale()
            })
          }
        })
        this.map.renderSync()
      })

      this.setSelectAreaButtonActive(true)
      this.isActive = true
    },
    deactivate () {
      this.map.removeInteraction(this.select)
      this.map.removeInteraction(this.dragBox)

      const interactions = this.map.getInteractions().array_
      for (let interaction of interactions) {
        if (interaction.constructor.name === '_ol_interaction_Select_' || interaction.constructor.name === '_ol_interaction_DragBox_') {
          const index = interactions.indexOf(interaction)
          if (index > -1) {
            interactions.splice(index, 1)
          }
        }
      }

      this.setSelectAreaButtonActive(false)
      this.isActive = false
    }
  }
}
</script>
