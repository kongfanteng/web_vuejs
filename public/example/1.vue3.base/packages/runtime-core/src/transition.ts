import { isSameVnode } from './createVNode'
import { getCurrentInstance } from './component'
import { h } from './h'

function nextFrame(cb) {
  requestAnimationFrame(() => {
    requestAnimationFrame(cb)
  })
}

function resolveProps(props) {
  const {
    name = 'v',
    enterFromClass = `${name}-enter-from`,
    enterActiveClass = `${name}-enter-active`,
    enterToClass = `${name}-enter-to`,
    leaveFromClass = `${name}-leave-from`,
    leaveActiveClass = `${name}-leave-active`,
    leaveToClass = `${name}-leave-to`,
    onBeforeEnter,
    onEnter,
    onLeave,
  } = props
  const hooks = {
    onBeforeEnter(el) {
      onBeforeEnter && onBeforeEnter(el)
      el.classList.add(enterFromClass)
      el.classList.add(enterActiveClass)
    },
    onEnter(el) {
      function done() {
        el.classList.remove(enterActiveClass)
        el.classList.remove(enterToClass)
      }
      onEnter && onEnter(el, done)
      nextFrame(() => {
        el.classList.remove(enterFromClass)
        el.classList.add(enterToClass)
        // 用户写了 onEnter
        if (!onEnter || onEnter.length <= 1) {
          el.addEventListener('transitionend', done)
        }
      })
    },
    onLeave(el, done) {
      function resolve() {
        el.classList.remove(leaveActiveClass)
        el.classList.remove(leaveToClass)
        done() // done 不调用，dom 一直在
      }
      el.classList.add(leaveFromClass) // 例：opacity 0.5-1
      document.body.offsetHeight
      el.classList.add(leaveActiveClass)
      nextFrame(() => {
        el.classList.add(leaveActiveClass)
        el.classList.add(leaveToClass)
        // 用户写了 onLeave
        if (!onLeave || onLeave.length <= 1) {
          el.addEventListener('transitionend', done)
        }
      })
      onLeave && onLeave(el, resolve)
    },
  }
  return hooks
}

function resolveTransition(props, type) {
  if (type === 'enter') {
    return {
      beforeEnter: props.onBeforeEnter,
      enter: props.onEnter,
    }
  } else {
    return {
      leave: (el, done) => {
        props.onLeave(el, done)
      },
    }
  }
  // const hooks = {
  //   beforeEnter: props.onBeforeEnter,
  //   enter: props.onEnter,
  //   leave: props.onLeave,
  // }
  // return hooks
}

const BaseTransition = {
  props: {
    onBeforeEnter: Function,
    onEnter: Function,
    onLeave: Function,
  },
  setup(props, { slots }) {
    const instance = getCurrentInstance()
    return () => {
      const child = slots.default && slots.default()
      const enterHooks = resolveTransition(props, 'enter')
      child.transition = enterHooks
      const oldChild = instance.subTree
      if (oldChild) {
        if (!isSameVnode(oldChild, child)) {
          oldChild.transition = resolveTransition(props, 'leave')
        }
      }
      child.transition = enterHooks
      return child
    }
  },
}

export function Transition(props, { slots }) {
  return h(BaseTransition, resolveProps(props), slots)
}
