export default {
  methods: {
    toggleButtonClass (isActive) {
      return isActive ? ['btn-primary', 'active'] : ['btn-default']
    },
    canDestroyComponent (rootView) {
      return !!this.$store.state.breadcrumb.find(x => x.rootView === rootView)
    },
    destroyUnusedChildComponents (rootComponent, breadcrumb) {
      this.$nextTick(() => {
        if (!breadcrumb) {
          return
        }
        const inactiveChildren = rootComponent.$children.filter(child => child._inactive)
        inactiveChildren.forEach(component => {
          const componentKey = component.$vnode.key
          const isComponentInBreadcrumb = breadcrumb.find(x => x.key === componentKey)
          if (!isComponentInBreadcrumb) {
            component.$destroy()
          }
        })
      })
    }

  }
}
