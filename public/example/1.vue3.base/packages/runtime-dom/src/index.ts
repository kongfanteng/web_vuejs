import { createRenderer } from '@vue/runtime-core'
import { nodeOps } from './nodeOps'
import { patchProp } from './props'
const renderOptions = { ...nodeOps, patchProp }
// 默认的渲染属性，可以构建渲染器，也可以让用户提供渲染属性来渲染
export function createRender(options) {
  return {
    render(vdom, container) {},
  }
}
export function render(vdom, container) {
  const { render } = createRenderer(renderOptions)
  render(vdom, container)
}

export * from '@vue/runtime-core'
