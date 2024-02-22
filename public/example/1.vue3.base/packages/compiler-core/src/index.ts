import { parser } from './parser'

export function compile(template) {
  // parser 解析代码为语法树1
  const ast = parser(template)
  // 进行代码的转化，增加辅助信息
  // 拼接字符串生成代码
  console.log('ast:', ast)
}
