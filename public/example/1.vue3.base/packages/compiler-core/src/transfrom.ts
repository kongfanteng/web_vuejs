import { PatchFlags } from '@vue/shared'
import { NodeTypes } from './ast'
import {
  CREATE_ELEMENT_BLOCK,
  CREATE_ELEMENT_VNODE,
  FRAGMENT,
  OPEN_BLOCK,
  TO_DISPLAY_STRING,
  createCallExpression,
  createElementCall,
} from './runtime-helpers'

function transformElement(node, context) {
  if (node.type === NodeTypes.ELEMENT) {
    return () => {
      let vnodeTag = `'${node.tag}'` // 模板中的标签名 'div'
      let vnodeProps = node.props
      let vnodeChildren = null
      let properties = []
      for (let i = 0; i < vnodeProps.length; i++) {
        properties.push({
          key: vnodeProps[i].name,
          value: vnodeProps[i].value.content,
        })
      }
      let propsExpression
      if (vnodeProps.length > 0) {
        propsExpression = {
          properties,
          type: NodeTypes.JS_OBJECT_EXPRESSION,
        }
      }

      // 针对儿子的情况做处理，有一个儿子直接用儿子
      if (node.children.length === 1) {
        vnodeChildren = node.children[0]
      } else {
        if (node.children) vnodeChildren = node.children
      }
      node.codegenNode = createElementCall(
        context,
        vnodeTag,
        propsExpression,
        vnodeChildren
      )
      // createElementValue('div', 属性, 内容)
    }
  }
}

function isText(node) {
  return node.type === NodeTypes.TEXT || node.type === NodeTypes.INTERPOLATION
}
function transformText(node, context) {
  if (node.type === NodeTypes.ELEMENT || node.type === NodeTypes.ROOT) {
    // element
    // 我们在处理的时候，是遇到这个节点就处理，还是等这个节点中的儿子处理完了再处理；
    return () => {
      let hasText = false // 默认文本
      let container = null
      let children = node.children
      for (let i = 0; i < children.length; i++) {
        let child = children[i]
        if (isText(child)) {
          // 再看后一个
          hasText = true
          for (let j = i + 1; j < children.length; j++) {
            const next = children[j]
            if (isText(next)) {
              if (!container) {
                container = children[i] = {
                  type: NodeTypes.COMPOUND_EXPRESSION,
                  children: [child],
                }
              }
              // <div>a{{aa}}b</div>
              container.children.push('+', next)
              children.splice(j, 1)
              j--
            } else {
              container = null
              break
            }
          }
        }
      }

      // 如果只有一个儿子，不需要循环处理，可以直接采用 innerHTML 的方式，如果没有文本无需处理；
      if (children.length === 1 || !hasText) {
        return
      }

      for (let i = 0; i < children.length; i++) {
        const child = children[i]
        const args = []
        if (isText(child) || NodeTypes.COMPOUND_EXPRESSION == child.type) {
          args.push(child)
          if (child.type !== NodeTypes.TEXT) {
            // 复合表达式
            args.push(PatchFlags.TEXT + '')
          }
          children[i] = {
            // createTextVnode
            type: NodeTypes.TEXT_CALL,
            content: child, // createTextVnode(内容, 1)
            codegenNode: createCallExpression(context, args),
          }
        }
      }
      console.log(children)
    }
  }
}

function transformExpression(node, context) {
  // 元素 - 表达式 - 内容_toDisplayString
  if (node.type === NodeTypes.INTERPOLATION) {
    // 文本直接增加_ctx.xxx
    node.content.content = '_ctx.' + node.content.content
    console.log('表达式的转化 transformExpression')
  }
}

function createContext(node) {
  const context = {
    currentNode: node,
    parent: null,
    helpers: new Map(), // createElementNode: 10, createTextNode: 10,
    helper(name) {
      const c = context.helpers.get(name) || 0
      context.helpers.set(name, c + 1)
      return name
    },
    nodeTransformFns: [
      // 处理方法：处理对应的节点类型，进行对应的处理
      transformElement,
      transformText,
      transformExpression,
      // 指令的转化
      // 插槽的转换...
    ],
    removeHelper(name) {
      let c = context.helpers.get(name)
      if (c) {
        c = c - 1
        if (c === 0) {
          context.helpers.delete(name)
        } else {
          context.helpers.set(name, c)
        }
      }
      return name
    },
  }
  return context
}

function traverseNode(node, context) {
  // 遍历语法树，目的：对每个节点进行操作；
  const fns = context.nodeTransformFns
  const exitFns = []
  for (let i = 0; i < fns.length; i++) {
    // babel/core
    let exit = fns[i](node, context) // 进入当前节点
    exit && exitFns.push(exit)
  }
  switch (node.type) {
    case NodeTypes.ELEMENT:
    case NodeTypes.ROOT:
      // 针对子节点递归遍历
      for (let i = 0; i < node.children.length; i++) {
        context.parent = node
        traverseNode(node.children[i], context)
      }
    case NodeTypes.INTERPOLATION:
      context.helper(TO_DISPLAY_STRING)
      break
  }

  context.currentNode = node

  // 子节点处理完毕
  let len = exitFns.length
  while (len--) {
    exitFns[len]()
  }
}

function converRoot(ast, context) {
  let children = ast.children
  if (children.length === 1) {
    const child = children[0] // createELementVnode x createElementBlock
    if (child.type === NodeTypes.ELEMENT) {
      ast.codegenNode = child.codegenNode // 用元素的信息保留起来
      ast.codegenNode.isBlock = true // block 节点
      context.removeHelper(CREATE_ELEMENT_VNODE)
      context.helper(OPEN_BLOCK)
      context.helper(CREATE_ELEMENT_BLOCK)
    } else {
      ast.codegenNode = child
    }
  } else {
    // 多个儿子生成一个 block，并且是 fragment
    if (children.length > 0) {
      ast.codegenNode = createElementCall(
        context,
        context.helper(FRAGMENT),
        undefined,
        ast.children
      )
      context.helper(OPEN_BLOCK)
      context.helper(CREATE_ELEMENT_BLOCK)
      ast.codegenNode.isBlock = true
    }
  }
}

export function transfrom(ast) {
  const context = createContext(ast)
  traverseNode(ast, context)
  // 针对 ast 的子节点做处理，生成 block 节点；
  converRoot(ast, context)
  ast.helpers = [...context.helpers.keys()]
}

// 树的遍历，先完成子节点，后倒序处理自身
