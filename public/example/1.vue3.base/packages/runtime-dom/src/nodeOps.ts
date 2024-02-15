export const nodeOps = {
  insert(el, parent, ancher) {
    // <div id="app"><span></span></div>
    // 插入到某元素前，不传 ancher，直接 appendChild 元素
    return parent.insertBefore(el, ancher || null)
  },
  remove(el) {
    const parent = el.parentNode
    if (parent) {
      parent.removeChild(el)
    }
  },
  createElement(type) {
    return document.createElement(type)
  },
  createText(text) {
    return document.createTextNode(text)
  },
  setText(node, text) {
    return (node.nodeValue = text)
  },
  setElementText(node, text) {
    return (node.textContent = text)
  },
  parentNode(node) {
    return node.parentNode
  },
  nextSibling(node) {
    return node.nextSibling
  },
}
