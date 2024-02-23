import { isString } from '@vue/shared'
import { NodeTypes } from './ast'
import { TO_DISPLAY_STRING, helperMapping } from './runtime-helpers'

export function generate(ast) {
  const context = createContext()
  const { push, newline, indent, deindent } = context
  if (ast.helpers.length > 0) {
    push(
      `import { ${ast.helpers.map(
        (helper) => helperMapping[helper] + ' as _' + helperMapping[helper]
      )} } from "vue"`
    )
    newline()
    push(
      `return function render(_ctx, _cache, $props, $setup, $data, $options){`
    )
    indent()
    push(`return `)
    if (ast.codegenNode) {
      // 转化后的节点
      genNode(ast.codegenNode, context)
    } else {
      push('null')
    }

    deindent()
    push(`}`)
    console.log('context.code:', context.code)
    let code = new Function('_ctx', '_props', 'return abc')
    console.log('code:', code)
    // TODO: 编译过程-拼接字符串
  }
}

function genInterpolation(node, context) {
  const { push } = context
  push(`_${helperMapping[TO_DISPLAY_STRING]}(`)
  genNode(node.content.content, context)
  push(`)`)
}

function genText(node, context) {
  context.push(JSON.stringify(node.content))
}

function genNode(node, context) {
  if (isString(node)) {
    return context.push(node)
  }
  switch (node.type) {
    case NodeTypes.TEXT:
      genText(node, context)
      break
    case NodeTypes.INTERPOLATION:
      genInterpolation(node, context)
      break
  }
}

function createContext() {
  const context = {
    code: '',
    indentLevel: 0,
    push(code) {
      context.code += code
    },
    indent() {
      newline(++context.indentLevel)
    },
    deindent(withoutNewLine = false) {
      if (withoutNewLine) {
        --context.indentLevel
      } else {
        newline(--context.indentLevel)
      }
    },
    newline() {
      newline(context.indentLevel)
    },
  }
  function newline(n: number) {
    context.push('\n' + `  `.repeat(n))
  }
  return context
}
