import { ShapeFlags } from '@vue/shared'
import { isSameVnode } from './createVNode'

export function createRenderer(options) {
  // 此方法并不关心  options 有谁提供
  let {
    insert: hostInsert,
    remove: hostRemove,
    createElement: hostCreateElement,
    createText: hostCreateText,
    setText: hostSetText,
    setElementText: hostSetElementText,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling,
    patchProp: hostPatchProp,
  } = options

  // 挂载所有子节点，子节点不一定是元素，还有可能是组件
  const mountChildren = (children, container) => {
    for (let i = 0; i < children.length; i++) {
      // 递归调用 patch 方法，创建元素
      patch(null, children[i], container)
    }
  }

  const unmount = (vnode) => {
    // 后面要卸载的元素可能不是元素
    hostRemove(vnode.el)
  }

  const mountElement = (vnode, container) => {
    const { type, props, shapeFlag, children } = vnode
    // 先创建父元素
    let el = (vnode.el = hostCreateElement(type))
    // 给父元素增添属性
    if (props) {
      for (let key in props) {
        hostPatchProp(el, key, null, props[key])
      }
    }
    // 区分子节点类型，挂载子节点
    if (ShapeFlags.ARRAY_CHILDREN & shapeFlag) {
      mountChildren(children, el)
    } else {
      hostSetElementText(el, children)
    }
    hostInsert(el, container) // 将元素插入到父级中
  }
  const patchElement = (n1, n2, container) => {
    // 1. 判断是否是文本节点
    // 2. 判断是否是元素节点
    // 3. 判断是否是组件节点
    // 4. 判断是否是文本节点
  }

  // patch 方法每次更新都会重新的执行
  const patch = (n1, n2, container) => {
    // n1 和 n2 是不是相同的节点，如果不是相同节点直接删除掉，换新的
    if (n1 && !isSameVnode(n1, n2)) {
      unmount(n1) // 不是初始化，意味更新
      n1 = null // 删除之前的，继续走初始化流程
    }
    if (n1 == null) {
      // 初始化逻辑
      mountElement(n2, container)
    } else {
      patchElement(n1, n2, container)
    }
  }

  return {
    render(vnode, container) {
      // 根据 vdom 和容器
      // 通过 vdom 创建真实 DOM 插入到容器中

      if (vnode == null) {
        unmount(container._vnode) // 删掉容器上对应的 DOM 元素
      } else {
        const pervVnode = container._vnode || null
        const nextVnode = vnode
        patch(pervVnode, nextVnode, container)
        container._vnode = nextVnode
      }
    },
  }
}
