<template>
<div class="territory-input-block">
  <div class="select-territory-block input-group">
    <input
      type="text"
      class="form-control territory-name"
      :title="inputName"
      :value="inputName"
      readonly
    />
    <span class="input-group-btn">
      <button
        type="button"
        class="btn btn-default text-primary"
        @click="onSelectTerritory"
        :disabled="isBaseProfile || readonly"
        v-if="!(isBaseProfile || readonly)"
      >
        {{ btnText }}
      </button>
      <button
        title="Очистить"
        type="button"
        class="btn btn-default text-primary"
        @click="clearValue"
        :disabled="isBaseProfile || readonly"
        v-if="!(isBaseProfile || readonly || !clearBtnVisible)"
      >
        <i class="icon_cross"></i>
      </button>
    </span>
  </div>
  <territory-select-dialog
    ref="territorySelect"
    :showAllOktmos="showAllOktmos"
    :showEmpty="showEmpty"
    :isCheckProfiles="isCheckProfiles"
    :isBaseProfile="isBaseProfile"
    :customItems="customItems"
    @setSaveActive="canSave"
  />
</div>
</template>

<script>
import TerritorySelectDialog from '^/components/TerritorySelectDialog.vue'

export default {
  components: {
    TerritorySelectDialog
  },
  props: {
    isCheckProfiles: {
      type: Boolean,
      default: false
    },
    isBaseProfile: {
      type: Boolean,
      default: false
    },
    customItems: {
      type: Array,
      default: null
    },
    territory: Object,
    showAllOktmos: Boolean,
    showEmpty: Boolean,
    readonly: {
      type: Boolean,
      default: false
    },
    btnText: {
      type: String,
      default: 'Выбрать'
    },
    clearBtnVisible: {
      type: Boolean,
      default: true
    }
  },
  data () {
    return {
      selectedTerritory: {
        id: null,
        code: null,
        name: 'Не выбрана'
      }
    }
  },
  computed: {
    inputName () {
      const selectedTerritoryName = this.selectedTerritory && this.selectedTerritory.name
      return selectedTerritoryName || 'Не выбрано'
    }
  },
  watch: {
    territory (newValue) {
      this.selectedTerritory = newValue
    }
  },
  mounted () {
    this.selectedTerritory = this.territory
  },
  methods: {
    canSave () {
      this.$emit('setSaveActive', true)
    },
    clearValue () {
      this.selectedTerritory = { id: null, name: 'Не выбрано' }
      this.$emit('territorySelected', { id: null, name: 'Не выбрано' })
    },
    onSelectTerritory () {
      this.$refs.territorySelect.showModal(this.territorySelected)
    },
    territorySelected (item) {
      this.selectedTerritory = item
      this.$emit('territorySelected', item)
    }
  }
}
</script>

<style lang="stylus" scoped>
.territory-input-block
  display flex
  align-items center
  width 100%
.select-territory-block
  width 100%
.territory-name
  overflow hidden
  white-space nowrap
  text-overflow ellipsis
</style>