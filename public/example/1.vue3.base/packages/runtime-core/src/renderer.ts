import { ShapeFlags } from '@vue/shared'
import { Text, isSameVnode } from './createVNode'

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
  const mountChildren = (children, container, anchor) => {
    for (let i = 0; i < children.length; i++) {
      // 递归调用 patch 方法，创建元素
      patch(null, children[i], container, anchor)
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

  const mountElement = (vnode, container, anchor) => {
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
      mountChildren(children, el, anchor)
    } else {
      hostSetElementText(el, children)
    }
    hostInsert(el, container, anchor) // 将元素插入到父级中
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

  function getSeq(arr) {
    const result = [0]
    const len = arr.length

    let resultLastIndex
    let start = 0,
      end = 0,
      middle = 0,
      p = arr.slice(0)
    for (let i = 0; i < len; i++) {
      const arrI = arr[i]
      if (arrI !== 0) {
        resultLastIndex = result[result.length - 1]
        if (arr[resultLastIndex] < arrI) {
          result.push(i)
          p[i] = resultLastIndex
          continue
        }
        // 替换
        start = 0
        end = result.length - 1
        while (start < end) {
          middle = Math.floor((start + end) / 2)
          // 结果集中间的哪一项的值
          if (arr[result[middle]] < arrI) {
            start = middle + 1
          } else {
            end = middle
          }
        }
        if (arrI < arr[result[end]]) {
          p[i] = result[end - 1]
          result[end] = i // 返回最后找到的索引比这一项大，就用这个索引换掉，因为更有潜力
        }
      }
    }
    let i = result.length
    let last = result[i - 1] // 拿到 9 的索引，向上找
    while (i-- > 0) {
      result[i] = last
      last = p[last] // 追溯上一次的值
    }
    return result
  }

  const patchKeyChildren = (c1, c2, el, anchor) => {
    // 有优点的点，dom 操作常见的方式；1）前后增加，前后删除；
    // 如果不优化，那就比较 c1,c2 的差异循环即可
    // form start
    let i = 0 // 头部牵引
    let e1 = c1.length - 1
    let e2 = c2.length - 1
    // a, b, c
    // a, b, c, d
    while (i <= e1 && i <= e2) {
      const n1 = c1[i]
      const n2 = c2[i]
      if (isSameVnode(n1, n2)) {
        patch(n1, n2, el, anchor)
      } else {
        break
      }
      i++
    }
    // ([a, b, c] -> [a, b, c, d]); (i, e1, e2 -> 3, 2, 3);

    // a, b, c
    // d, a, b, c
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1]
      const n2 = c2[e2]
      if (isSameVnode(n1, n2)) {
        patch(n1, n2, el, anchor)
      } else {
        break
      }
      e1--
      e2--
    }

    // ([d, a, b, c] -> [a, b, c]); (i, e1, e2 -> 0, -1, 0);

    // QR: 新的比老的多呢？如何知道有新增元素的？
    // i > e1 说明新的比老的长，有新增的逻辑；
    if (i > e1) {
      if (i <= e2) {
        // i - e2 之间为新增的部分
        while (i <= e2) {
          patch(null, c2[i], el, anchor)
          i++
        }
      }
    } else if (i > e2) {
      // 老的多，新的少
      while (i <= e1) {
        // 如果 e2 后面没有值，说明是向后插入
        // 如果 e2 后面有值，说明是向前插入
        unmount(c1[i])
        i++
      }
    }
    // ([a,b,c,d,e,f,g] -> [a,b,e,c,d,h,f,g]); ([i, e1, e2] -> [2, 5, 5])

    let s1 = i
    let s2 = i

    const keyToNewIndexMap = new Map()
    for (let i = s2; i < e2; i++) {
      const child = c2[i]
      keyToNewIndexMap.set(child.key, i)
    }

    const toBePatch = e2 - s2 + 1
    const newIndexToOldIndexMap = new Array(toBePatch).fill(0)

    for (let i = s1; i <= e1; i++) {
      const child = c1[i]
      let newIndex = keyToNewIndexMap.get(child.key)
      if (newIndex == undefined) {
        unmount(child)
      } else {
        newIndexToOldIndexMap[newIndex - s2] = i + 1 // 默认值是 0
        // 老的里面有新的里面也有，需要 diff 算法，比较两个节点属性差异
        patch(child, c2[newIndex], el, anchor) // 仅比较属性，需要移动位置
      }
    }

    const cressingIndexMap = getSeq(newIndexToOldIndexMap)

    let lastIndex = cressingIndexMap.length - 1

    // [5, 3, 4, 0] -> [1, 2]
    // [5, 3, 8, 0, 4, 6, 7] -> [1, 4, 5, 6]索引
    // QR: 如何知道哪些元素是新增，哪些需要移动？倒序插入；

    // 数组里映射者老的关系
    for (let i = toBePatch - 1; i >= 0; i--) {
      const anchorIndex = s2 + i
      const child = c2[anchorIndex]
      const insertanchor = c2[anchorIndex + 1]?.el

      // Vue2 中会额外移动不需要动的节点，Vue3 不会
      if (newIndexToOldIndexMap[i] === 0) {
        // 说明当前虚拟节点创建过
      }
      if (!child.el) {
        // 说明这个节点创建过
        patch(null, child, el, insertanchor)
      } else {
        // 暴力的倒序插入
        // a b 912345678 fg
        // a b 812345679 fg
        // 通过最长递增子序列优化
        if (cressingIndexMap[lastIndex] === i) {
          lastIndex--
        } else {
          hostInsert(child.el, el, insertanchor)
        }
      }
    }

    // from end
    // a, b, c
    // a, b, c, d
    // a, b, c
    // d, a, b, c
  }

  const patchChildren = (n1, n2, el, anchor?) => {
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
          patchKeyChildren(c1, c2, el, anchor)
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
          mountChildren(c2, el, anchor)
        }
      }
    }
  }

  const patchElement = (n1, n2, container, anchor?) => {
    // 更新逻辑
    let el = (n2.el = n1.el)
    patchProps(n1.props || {}, n2.props || {}, el)
    patchChildren(n1, n2, el, anchor)
  }

  function processElement(n1, n2, container, anchor) {
    if (n1 == null) {
      mountElement(n2, container, anchor)
    } else {
      patchElement(n1, n2, container)
    }
  }

  function processText(n1, n2, container) {
    if (n1 == null) {
      hostInsert((n2.el = hostCreateText(n2.children)), container)
    } else {
      n2.el = n1.el
      if (n2.children !== n1.children) {
        hostSetText(n2.children)
      }
    }
  }

  // patch 方法每次更新都会重新的执行
  const patch = (n1, n2, container, anchor = null) => {
    // n1 和 n2 是不是相同的节点，如果不是相同节点直接删除掉，换新的
    if (n1 && !isSameVnode(n1, n2)) {
      unmount(n1) // 不是初始化，意味更新
      n1 = null // 删除之前的，继续走初始化流程
    }
    const { type } = n2
    switch (type) {
      case Text:
        debugger
        processText(n1, n2, container)
        break
      default:
        processElement(n1, n2, container, anchor)
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
        patch(pervVnode, nextVnode, container, null)
        container._vnode = nextVnode
      }
    },
  }
}
