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

  const unmountChildren = (children) => {
    for (let i = 0; i < children.length; i++) {
      // 递归调用 patch 方法，卸载元素
      unmount(children[i])
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

  const patchProps = (oldProps, newProps, el) => {
    for (let key in newProps) {
      // 用新的生效
      hostPatchProp(el, key, oldProps[key], newProps[key])
    }
    // 老的里面有新的没有则删除
    for (let key in oldProps) {
      if (!(key in newProps)) {
        hostPatchProp(el, key, oldProps[key], null)
      }
    }
  }

  const patchKeyChildren = (c1, c2, el) => {
    // 有优点的点，dom 操作常见的方式；1）前后增加，前后删除；
    // 如果不优化，那就比较 c1,c2 的差异循环即可
    // form start
    let i = 0 // 头部牵引
    let e1 = c1.length - 1
    let e2 = c2.length - 1
    while (i <= e1 && i <= e2) {
      const n1 = c1[i]
      const n2 = c2[i]
      if (isSameVnode(n1, n2)) {
      }
      i++
    }
    // from end
    // a, b, c
    // a, b, c, d
    // a, b, c
    // d, a, b, c
  }

  const patchChildren = (n1, n2, el) => {
    // 比较前后 2 个节点的差异
    let c1 = n1.children
    let c2 = n2.children

    let prevShapeFlag = n1.shapeFlag // 上一次
    let shapeFlag = n2.shapeFlag // 新的一次

    // 文本 数组 空 = 9 种

    // （文本 -> 数组）；文本删除掉，换成数组；
    // （文本 -> 空）；清空文本；（文本 -> 文本）；用新文本换老文本；

    // （数组 -> 文本）（数组 -> 空）移除数组，换成文本；
    // （数组 -> 数组）；（diff）；

    // （空 -> 文本）；更新文本；
    // （空 -> 数组）；挂载数组；
    // （空 -> 空）；无需处理；

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 1. （文本 -> 数组）；文本删除掉，换成数组；
        unmountChildren(c1)
      }
      if (c1 !== c2) {
        // 2. （文本 -> 空）；清空文本；（文本 -> 文本）；用新文本换老文本；
        hostSetElementText(el, c2)
      }
    } else {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // 3. （数组 -> 数组）；（diff）；
          console.log('diff')
          patchKeyChildren(c1, c2, el)
        } else {
          // 4. （数组 -> 文本）（数组 -> 空）移除数组，换成文本；
          unmountChildren(c1)
        }
      } else {
        if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
          // 5. （文本 -> 空）；清空文本
          hostSetElementText(el, '')
        }

        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // 6. （空 -> 数组）；挂载数组；
          mountChildren(c2, el)
        }
      }
    }
  }

  const patchElement = (n1, n2, container) => {
    // 更新逻辑
    let el = (n2.el = n1.el)
    patchProps(n1.props || {}, n2.props || {}, el)
    patchChildren(n1, n2, el)
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
