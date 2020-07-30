import mapEventBus from './mapEventBus'

export default {
  data () {
    return {
      eventComponentId: Symbol('componentId')
    }
  },
  methods: {
    emitEventToMap (event, context) {
      mapEventBus.$emit(event, { senderId: this.eventComponentId, context })
    },
    emitEventFromMap (event, receiverId, context) {
      mapEventBus.$emit(event, { receiverId, context })
    },
    onEventFromMap (event, callback) {
      mapEventBus.$on(event, payload => {
        if (payload.receiverId && this.eventComponentId === payload.receiverId) {
          callback(payload.context)
        }
      })
    },
    onEventFromComponent (event, callback) {
      if (mapEventBus._events && mapEventBus._events[event]) {
        delete mapEventBus._events[event]
      }

      mapEventBus.$on(event, payload => {
        callback(payload)
      })
    },
    unEventFromComponent (event, callback) {
      mapEventBus.$off(event, callback)
    },
    onBroadcastEventFromMap (event, callback) {
      mapEventBus.$on(event, payload => {
        callback(payload.context)
      })
    },
    emitBroadcastEventFromMap (event, context) {
      mapEventBus.$emit(event, { context })
    }
  }
}
