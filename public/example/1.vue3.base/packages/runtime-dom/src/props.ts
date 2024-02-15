function patchStyle(el, prevValue, nextValue) {
  // 旧的 {color: red}, 新的 { background: red, color: blue }
  const style = el['style']
  if (nextValue) {
    // 用新的样式覆盖生效的所有style
    for (let key in nextValue) {
      style[key] = nextValue[key]
    }
  }
  if (prevValue) {
    for (let key in prevValue) {
      if (nextValue[key] == null) {
        style[key] = null
      }
    }
  }
}

function patchClass(el, nextValue) {
  // class: 'abc' class: 'abc bcd efg'
  if (nextValue == null) {
    el.removeAttribute('class')
  } else {
    el.className = nextValue
  }
}

function createInvoler(val) {
  const invoker = (e) => invoker.val(e)
  invoker.val = val
  return invoker
}

function patchEvent(el, eventName, nextValue) {
  // 对于事件而言，不关心之前是什么，用最新的结果
  const invokers = el._vei || (el._vei = {})
  const exists = invokers[eventName]
  // click: customEvent => f
  // 通过一个自定义的变量，绑定这个变量，后续更改变量对应的值
  if (exists && nextValue) {
    exists.val = nextValue // 换绑事件
  } else {
    const name = eventName.slice(2).toLowerCase()
    if (nextValue) {
      const invoker = (invokers[eventName] = createInvoler(nextValue))
      el.addEventListener(name, invoker)
    } else {
      el.removeEventListener(name, exists)
      invokers[eventName] = null
    }
  }
}

function patchAttr(el, key, nextValue) {
  if (nextValue == null) {
    el.removeAttribute(key)
  } else {
    el.setAttribute(key, nextValue)
  }
}

export function patchProp(el, key, prevValue, nextValue) {
  if (key === 'style') {
    // { style: { color: 'red' } } -> el.style[key] = value
    return patchStyle(el, prevValue, nextValue)
  } else if (key === 'class') {
    // { class: 'abc' } -> el.className(class, '')
    return patchClass(el, nextValue)
  } else if (/^on[^a-z]/.test(key)) {
    // onClick -> addEventListener
    return patchEvent(el, key, nextValue)
  } else {
    return patchAttr(el, key, nextValue)
  }
}
