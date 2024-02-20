import {
  h,
  onMounted,
} from '/node_modules/@vue/runtime-dom/dist/runtime-dom.esm-browser.js'
export default {
  setup() {
    onMounted(() => {
      console.log('onmounted')
    })
    return {}
  },
  render: () => h('div', 'jhello'),
}
