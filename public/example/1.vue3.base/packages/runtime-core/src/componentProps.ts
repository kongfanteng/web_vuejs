import { reactive } from '@vue/reactivity'

export function initProps(instance, rawProps) {
  const props = {}
  const attrs = {}
  const options = instance.propsOptions || {}

  if (rawProps) {
    for (let key in rawProps) {
      if (key in options) {
        props[key] = rawProps[key]
      } else {
        attrs[key] = rawProps[key]
      }
    }
  }

  instance.props = reactive(props) // 响应式属性，源码中为非深度响应式；属性变化了会造成页面更新；
  instance.attrs = attrs
}
