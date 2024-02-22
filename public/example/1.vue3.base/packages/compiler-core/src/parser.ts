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

function parseChildren(context) {
  const nodes = []
  while (!isEnd(context)) {
    // 内容解析完毕结束
    let node = null
    const str = context.source // 剩余要解析的字符串
    if (str.startsWith('<')) {
      // <1>
      if (/a-z/i.test(str[1])) {
        // <大写/小写: 开始标签；例 <a
        //  标签，属性；
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
  return nodes
}
export function parser(template) {
  // <div a="1" a=1 a='1'>{{abc}} hello</div>
  // 边解析边删除，有限状态机，根据当前语法来判断命中的逻辑
  // loc start end(column offset line)
  // 外层要包装一个 fragment
  const context = createContext(template)
  return parseChildren(context)
}
