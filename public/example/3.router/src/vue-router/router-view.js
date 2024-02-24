import { computed, h, inject, provide } from 'vue'

export const RouterView = {
  setup(props, { slots }) {
    let currentLocation = inject('location')
    let depth = inject('++', 0)
    provide('++', depth + 1)
    const matchedComputed = computed(() => currentLocation.matched[depth])
    return () => {
      const record = matchedComputed.value
      const viewComponent = record?.components?.default
      if (viewComponent) {
        return h(viewComponent)
      } else {
        return slots.default && slots.default()
      }
    }
  },
}
