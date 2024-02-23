import { generate } from './codegen'
import { parser } from './parser'
import { transfrom } from './transfrom'

export function compile(template) {
  // parser 解析代码为语法树1
  const ast = parser(template)
  // 进行代码的转化，增加辅助信息
  // 拼接字符串生成代码
  transfrom(ast) // 内容的操作 + 导入方法的配置

  generate(ast)
  
  console.log('ast:', ast)
}
