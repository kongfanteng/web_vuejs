import { PatchFlags, ShapeFlags, invokeHooks } from '@vue/shared'
import { Fragment, Text, convert, isSameVnode } from './createVNode'
import { ReactiveEffect } from '@vue/reactivity'
import { queueJob } from './scheduler'
import { createInstance, setupComponent } from './component'
import { hasChangedProps, updateProps } from './componentProps'
import { isKeepAlive } from './keepAlive'

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
  const mountChildren = (children, container, parentComponent) => {
    for (let i = 0; i < children.length; i++) {
      const child = convert(children[i])
      // 递归调用 patch 方法，创建元素
      patch(null, child, container, null, parentComponent)
    }
  }

  const unmountChildren = (children, parentComponent) => {
    for (let i = 0; i < children.length; i++) {
      // 递归调用 patch 方法，卸载元素
      unmount(children[i], parentComponent)
    }
  }

  const unmount = (vnode, parentComponent) => {
    const { shapeFlag } = vnode

    if (vnode.type === Fragment) {
      // 文档碎片
      return unmountChildren(vnode.children, parentComponent)
    }

    if (shapeFlag & ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE) {
      return parentComponent.ctx.deactivated(vnode)
    }

    // 如果是组件，移除的是 subTree
    if (shapeFlag & ShapeFlags.COMPONENT) {
      const { bum, um } = vnode.component
      bum && invokeHooks(bum)
      unmount(vnode.component.subTree, parentComponent)
      um && invokeHooks(um) // 删除的时候需要异步方法
      return
    }

    // 后面要卸载的元素可能不是元素
    remove(vnode)
  }

  function remove(vnode) {
    const { transition, el } = vnode
    const performRemove = () => {
      hostRemove(el)
    }
    if (transition.leave) {
      transition.leave(el, performRemove)
    } else {
      performRemove()
    }
  }

  const mountElement = (vnode, container, anchor, parentComponent) => {
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
      mountChildren(children, el, parentComponent)
    } else {
      hostSetElementText(el, children)
    }

    if (vnode.transition) {
      vnode.transition.beforeEnter(el)
    }

    hostInsert(el, container, anchor) // 将元素插入到父级中

    if (vnode.transition) {
      vnode.transition.enter(el)
    }
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

  const patchKeyChildren = (c1, c2, el, parentComponent) => {
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
        patch(n1, n2, el, null, parentComponent)
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
        patch(n1, n2, el, null, parentComponent)
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
          patch(null, c2[i], el, null, parentComponent)
          i++
        }
      }
    } else if (i > e2) {
      // 老的多，新的少
      while (i <= e1) {
        // 如果 e2 后面没有值，说明是向后插入
        // 如果 e2 后面有值，说明是向前插入
        unmount(c1[i], parentComponent)
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
        unmount(child, parentComponent)
      } else {
        newIndexToOldIndexMap[newIndex - s2] = i + 1 // 默认值是 0
        // 老的里面有新的里面也有，需要 diff 算法，比较两个节点属性差异
        patch(child, c2[newIndex], el, null, parentComponent) // 仅比较属性，需要移动位置
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
        patch(null, child, el, insertanchor, parentComponent)
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

  const patchChildren = (n1, n2, el, parentComponent) => {
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
        unmountChildren(c1, parentComponent)
      }
      if (c1 !== c2) {
        // 2. （文本 -> 空）；清空文本；（文本 -> 文本）；用新文本换老文本；
        hostSetElementText(el, c2)
      }
    } else {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // 3. （数组 -> 数组）；（diff）；
          patchKeyChildren(c1, c2, el, parentComponent)
        } else {
          // 4. （数组 -> 文本）（数组 -> 空）移除数组，换成文本；
          unmountChildren(c1, parentComponent)
        }
      } else {
        if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
          // 5. （文本 -> 空）；清空文本
          hostSetElementText(el, '')
        }

        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // 6. （空 -> 数组）；挂载数组；
          mountChildren(c2, el, parentComponent)
        }
      }
    }
  }

  const patchElement = (n1, n2, container, parentComponent) => {
    // 更新逻辑
    let el = (n2.el = n1.el)

    if (n2.patchFlag > 0) {
      // 靶向更新
      if (n2.patchFlag & PatchFlags.TEXT) {
        if (n1.children !== n2.children) {
          hostSetElementText(el, n2.children)
        }
      }
    } else {
      patchProps(n1.props || {}, n2.props || {}, el)
    }
    if (n2.synamicChildren) {
      patchBlockChildren(n1, n2, el, parentComponent)
    } else {
      patchChildren(n1, n2, el, parentComponent)
    }
  }
  function patchBlockChildren(n1, n2, el, parentComponent) {
    for (let i = 0; i < n2.synamicChildren.length; i++) {
      patchElement(
        n1.synamicChildren[i],
        n2.synamicChildren[i],
        el,
        parentComponent
      )
    }
  }

  function processElement(n1, n2, container, anchor, parentComponent) {
    if (n1 == null) {
      mountElement(n2, container, anchor, parentComponent)
    } else {
      patchElement(n1, n2, container, parentComponent)
    }
  }

  function processText(n1, n2, container) {
    if (n1 == null) {
      hostInsert((n2.el = hostCreateText(n2.children)), container)
    } else {
      let el = (n2.el = n1.el)
      if (n2.children !== n1.children) {
        hostSetText(el, n2.children)
      }
    }
  }

  function processFragment(n1, n2, container, parentComponent) {
    if (n1 == null) {
      mountChildren(n2.children, container, parentComponent)
    } else {
      patchChildren(n1, n2, container, parentComponent)
    }
  }

  function updateComponentPreRender(instance, next) {
    instance.next = null
    instance.vnode = next // 这里为了保证 vnode 更新
    updateProps(instance.props, next.props)
    // instance.slots = next.children; 注意：用户解构使用 slots 可能导致render方法重新调用，获取的是老 slots;
    Object.assign(instance.slots, next.children)
    // 应该将 slots 中所有属性移除掉，再添加新的
  }

  function setupRenderEffect(instance, container) {
    const componentUpdateFn = () => {
      const { m, bm } = instance
      if (!instance.isMounted) {
        // 初次渲染
        bm && invokeHooks(instance.bm)
        const subTree = instance.render.call(instance.proxy, instance.proxy)
        instance.subTree = subTree
        patch(null, subTree, container, null, instance)
        instance.isMounted = true
        m && invokeHooks(m)
      } else {
        const { bu, u } = instance
        let next = instance.next
        if (next) {
          // 渲染前的更新
          updateComponentPreRender(instance, next)
        }
        bu && invokeHooks(bu)

        // 组件更新，自身的状态变更了要更新子树
        const subTree = instance.render.call(instance.proxy, instance.proxy)
        patch(instance.subTree, subTree, container, null, instance)
        u && invokeHooks(u)
        instance.subTree = subTree
      }
    }
    // 每个组件都要有一个effect函数
    const effect = new ReactiveEffect(componentUpdateFn, () =>
      queueJob(instance.update)
    )
    const update = (instance.update = effect.run.bind(effect))
    update()
  }

  function mountComponent(n2, container, anchor, parentComponent) {
    // 1）给组件生成一个实例 instance
    const instance = (n2.component = createInstance(n2, parentComponent))

    if (isKeepAlive(n2)) {
      instance.ctx.renderer = {
        createElement: hostCreateElement,
        move(vnode, container) {
          hostInsert(vnode.component.subTree.el, container)
        },
        patch,
        unmount,
      }
    }

    // 2）初始化实例属性 props attr slots
    setupComponent(instance)
    // 3）生成一个 effect 并调用渲染
    setupRenderEffect(instance, container)
  }

  function shouldComponentUpdate(n1, n2) {
    const prevProps = n1.props
    const nextProps = n2.props

    let c1 = n1.children
    let c2 = n2.children
    if (Object.keys(c1).length > 0 || Object.keys(c2).length > 0) return true

    return hasChangedProps(prevProps, nextProps)
  }

  function patchComponent(n1, n2, container) {
    const instance = (n2.component = n1.component)
    // const prevProps = n1.props
    // const nextProps = n2.props

    // 在这里出发，componentUpdateFn 函数让他去处理更新
    if (shouldComponentUpdate(n1, n2)) {
      instance.next = n2
      instance.update()
    }

    // updateProps(instance, prevProps, nextProps)
  }

  function processComponent(n1, n2, container, anchor, parentComponent) {
    if (n1 == null) {
      if (n2.shapeFlag & ShapeFlags.COMPONENT_KEPT_ALIVE) {
        parentComponent.ctx.activated(n2, container)
      } else {
        mountComponent(n2, container, anchor, parentComponent)
      }
    } else {
      patchComponent(n1, n2, container)
    }
  }

  // patch 方法每次更新都会重新的执行
  const patch = (n1, n2, container, anchor = null, parentComponent = null) => {
    // n1 和 n2 是不是相同的节点，如果不是相同节点直接删除掉，换新的
    if (n1 && !isSameVnode(n1, n2)) {
      unmount(n1, parentComponent) // 不是初始化，意味更新
      n1 = null // 删除之前的，继续走初始化流程
    }
    const { type, shapeFlag } = n2
    switch (type) {
      case Text:
        processText(n1, n2, container)
        break
      case Fragment:
        processFragment(n1, n2, container, parentComponent)
        break
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, anchor, parentComponent)
        } else if (shapeFlag & ShapeFlags.COMPONENT) {
          // 函数式组件待补充
          processComponent(n1, n2, container, anchor, parentComponent)
        }
    }
  }

  return {
    render(vnode, container) {
      // 根据 vdom 和容器
      // 通过 vdom 创建真实 DOM 插入到容器中

      if (vnode == null) {
        unmount(container._vnode, null) // 删掉容器上对应的 DOM 元素
      } else {
        const pervVnode = container._vnode || null
        const nextVnode = vnode
        patch(pervVnode, nextVnode, container)
        container._vnode = nextVnode
      }
    },
  }
}
