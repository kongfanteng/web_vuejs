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

export function hasChangedProps(prevProps, nextProps) {
  const nextKeys = Object.keys(nextProps)
  const prevKeys = Object.keys(prevProps)
  if (nextKeys.length !== prevKeys.length) {
    // 如果传递的属性数量不一致，说明属性发生变化
    return true
  }
  for (let i = 0; i < nextKeys.length; i++) {
    const key = nextKeys[i]
    if (prevProps[key] !== nextProps[key]) {
      // 如果属性值不一致，说明属性发生变化
      return true
    }
  }
  return false
}

export function updateProps(prevProps, nextProps) {
  // 组件自己不能跟新属性，但是在父组件中可以更新属性
  // instance.props.count = 100
  // 除了属性外还有 attrs 要考虑
  for (let key in nextProps) {
    // instance.props = nextProps 丧失响应式
    prevProps[key] = nextProps[key] // instance.props.count = 新的值
  }
  for (const key in prevProps) {
    if (!(key in nextProps)) {
      delete prevProps[key]
    }
  }
  // 页面中的错误处理都需要在同一个出口进行管理
}
