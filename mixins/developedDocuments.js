export default {
  methods: {
    convertRestrictions (zoneRestrictions) {
      return zoneRestrictions.map(x => ({
        kindOfUseId: x.kindOfUseId,
        KindOfUse: x.KindOfUse,
        comments: x.comments,
        prohibited: x.prohibited
      }))
    },
    convertParameters (zoneParameters) {
      return zoneParameters.map(x => ({
        measurementUnitId: x.measurementUnitId,
        Unit: x.Unit,
        parameterId: x.parameterId,
        Parameter: x.Parameter,
        objectType: x.objectType,
        valueType: x.valueType,
        value: x.value,
        comments: x.comment
      }))
    },
    fillFieldsFromZone (zone, zoneItem) {
      zoneItem.objectName = zone.objectName
      zoneItem.approval = zone.approval
      zoneItem.generalRestrictions = zone.generalRestrictions
      zoneItem.comments = zone.comments
      zoneItem.Restrictions = this.convertRestrictions(zone.Restrictions)
      zoneItem.Parameters = this.convertParameters(zone.Parameters)
    }
  }
}
