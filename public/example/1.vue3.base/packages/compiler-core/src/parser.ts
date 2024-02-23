import { NodeTypes } from './ast'

function createContext(source) {
  return {
    column: 0,
    line: 1,
    offset: 0,
    source, // 解析中发生变化
    originalSource: source, // 保持不变
  }
}

function isEnd(context) {
  if (context.source.startsWith('</')) {
    return true
  }
  if (!context.source) {
    // source 为空，表示已经解析完毕
    return true
  }
}

function getCursor(context) {
  const { line, column, offset } = context
  return { line, column, offset }
}

function advancePositionWithMutation(context, str, endIndex) {
  let linesCount = 0
  let returnLine = -1
  for (let i = 0; i < endIndex; i++) {
    if (str.charCodeAt(i) === 10) {
      linesCount++
      returnLine = 1 // 记录当前换行的位置
    }
  }
  context.line += linesCount // 计算行号
  context.offset += endIndex // 计算偏移量
  // 计算列信息
  context.column =
    returnLine === -1 ? context.column + endIndex : endIndex - returnLine
}

function advanceBy(context, endIndex) {
  let str = context.source
  context.source = str.slice(endIndex) // 截取掉前面解析过的内容
  // 更新上下文信息，根据结果索引遍历字符串，有多少个换行
  advancePositionWithMutation(context, str, endIndex)
}

function parseTextData(context, endIndex) {
  const content = context.source.slice(0, endIndex)
  advanceBy(context, endIndex)
  return content
}

function parserText(context) {
  const endTokens = ['<', '{{']
  let endIndex = context.source.length // 假设全部是文本
  // 之后看 < 还是 {{ 离得更近一些，取出部分内容
  for (let i = 0; i < endTokens.length; i++) {
    const index = context.source.indexOf(endTokens[i])
    if (index > -1 && index < endIndex) {
      endIndex = index // 缩小范围
    }
  }
  // 需要获取文本的信息和文本的内容
  const start = getCursor(context)
  const content = parseTextData(context, endIndex)
  return {
    type: NodeTypes.TEXT,
    content,
    loc: getSelection(context, start),
  }
}

function getSelection(context, start, end?) {
  if (!end) {
    end = getCursor(context)
  }
  return {
    start,
    end,
    source: context.originalSource.slice(start.offset, end.offset),
  }
}

function parseInterpolation(context) {
  const start = getCursor(context) // 表达式开始的位置
  const endIndex = context.source.indexOf('}}')

  // 例：{{ greeting }}
  advanceBy(context, 2)
  const innerStart = getCursor(context) // 内部开始的位置
  const innerEnd = getCursor(context) // 内部结束的位置

  const contentIndex = endIndex - 2

  const preTrimContent = parseTextData(context, contentIndex) // 拿到文本
  const content = preTrimContent.trim()

  const startOffset = preTrimContent.indexOf(content)

  // 更新开始位置
  if (startOffset > 0)
    advancePositionWithMutation(innerStart, preTrimContent, startOffset)
  const endOffset = content.length + startOffset
  // 更新结束位置
  advancePositionWithMutation(innerEnd, preTrimContent, endOffset)
  advanceBy(context, 2)

  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content,
      loc: getSelection(context, innerStart, innerEnd),
    },
    loc: getSelection(context, start),
  }
}

function advanceSpaces(context) {
  const match = /^[\t\r\n\f ]*/.exec(context.source)
  if (match) {
    advanceBy(context, match[0].length)
  }
}

function parseAttributeValue(context) {
  const quote = context.source[0]
  let content
  if (quote === '"' || quote === "'") {
    advanceBy(context, 1)
    const endQuoteIndex = context.source.indexOf(quote)
    content = parseTextData(context, endQuoteIndex)
    advanceBy(context, 1)
  } else {
    // value
    const match = /^[^\t\r\n\f />]+/.exec(context.source)
    content = parseTextData(context, match[0].length)
  }
  return content
}

function parseAttribute(context) {
  // a = 1 @click="bbb"
  const match = /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec(context.source)
  const name = match[0]
  advanceBy(context, name.length) // 拿到 key，key = value
  advanceSpaces(context) // 去空格
  advanceBy(context, 1) // 去 = 号
  advanceSpaces(context) // 去 ' "
  const value = parseAttributeValue(context)
  return {
    type: NodeTypes.ATTRIBUTE,
    name,
    value: {
      type: NodeTypes.TEXT,
      content: value,
    },
  }
}

function parseAttributes(context) {
  const props = []
  while (!context.source.startsWith('>')) {
    const attr = parseAttribute(context)
    props.push(attr)
    advanceSpaces(context)
  }
  return props
}

function parseTag(context) {
  const start = getCursor(context)
  // <div>hello</div>
  const match = /^<\/?([a-z][^\t\r\n\f />]*)/i.exec(context.source)
  const tag = match[1]
  advanceBy(context, match[0].length) // 删除后：>hello</div>
  advanceSpaces(context)

  // 属性处理
  const props = parseAttributes(context)

  const isSelfClosing = context.source.startsWith('/>') // 是否自闭合
  advanceBy(context, isSelfClosing ? 2 : 1)
  return {
    type: NodeTypes.ELEMENT,
    tag,
    props,
    loc: getSelection(context, start), // 结束不正确：标签没有完全解析完
  }
}

function parseElement(context) {
  // <div>hello world</div>
  const ele = parseTag(context) // 前一半标签
  // hello world</div>
  const children = parseChildren(context) // 内容
  // 开始标签和内容处理完毕后，我们不希望 parseElement 处理结果
  if (context.source.startsWith('</')) {
    parseTag(context)
  }
  ;(ele as any).loc = getSelection(context, ele.loc.start)
  ;(ele as any).children = children
  return ele
}

function parseChildren(context) {
  const nodes = []
  while (!isEnd(context)) {
    // 内容解析完毕结束
    let node = null
    const str = context.source // 剩余要解析的字符串
    if (str.startsWith('<')) {
      // <1>
      if (/[a-z]/i.test(str[1])) {
        // <大写/小写: 开始标签；例 <a
        //  标签，属性；

        node = parseElement(context)
      }
    } else if (str.startsWith('{{')) {
      // 表达式
      node = parseInterpolation(context)
    } else {
      // 文本
      node = parserText(context)
    }
    nodes.push(node)
  }
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    if (node.type === NodeTypes.TEXT) {
      if (!/[^\t\r\n\f ]/.test(node.content)) {
        nodes[i] = null // 无意义节点
      } else {
        // 将多个空格替换为一个空格
        node.content = node.content.replace(/[\t\r\n\f ]+/g, ' ')
      }
    }
  }
  return nodes.filter(Boolean)
}

function creatRoot(children, start, context) {
  return {
    type: NodeTypes.ROOT,
    children,
    loc: getSelection(context, start),
  }
}
export function parser(template) {
  // <div a="1" a=1 a='1'>{{abc}} hello</div>
  // 边解析边删除，有限状态机，根据当前语法来判断命中的逻辑
  // loc start end(column offset line)
  // 外层要包装一个 fragment，写业务，不停在用的变量不要传入；
  const context = createContext(template)
  const start = getCursor(context)
  return creatRoot(parseChildren(context), start, context)
}

// NodeTypes.ELEMENT > props; NodeTypes.INTERPOLATION > NodeTypes.SIMPLE_EXPRESSION; NodeTypes.TEXT; NodeTypes.ROOT;
