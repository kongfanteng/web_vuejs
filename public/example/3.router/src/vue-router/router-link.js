import { inject } from 'vue'

export const RouterLink = {
  props: {
    to: { type: String, required: true },
  },
  setup(props) {
    const router = inject('router')
    function navigate() {
      router.push(props.to)
    }
    return (proxy) => {
      return <a onClick={navigate}>{proxy.$slots.default()} </a>
    }
  },
}
