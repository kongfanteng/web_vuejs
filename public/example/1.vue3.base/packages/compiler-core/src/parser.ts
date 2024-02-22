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

function advanceBy(context, endIndex) {
  let str = context.source
  context.source = str.slice(endIndex) // 截取掉前面解析过的内容
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
  console.log('parserTxt:', content)
  debugger
  return {
    type: NodeTypes.TEXT,
    content,
    loc: {
      start,
      end: {},
    },
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
