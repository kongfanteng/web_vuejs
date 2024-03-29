export enum NodeTypes {
  ROOT, // Fragment 0
  ELEMENT, // element 1; div p
  TEXT, // <div>text</div>
  COMMENT,
  SIMPLE_EXPRESSION, // {{ SIMPLE_EXPRESSION }}
  INTERPOLATION, // {{ INTERPOLATION }}
  ATTRIBUTE, // <div a=1 b=2>
  DIRECTIVE,
  // containers
  COMPOUND_EXPRESSION, // {{ INTERPOLATION }} hello
  IF,
  IF_BRANCH,
  FOR,
  TEXT_CALL, // createTextVnode()
  // codegen
  VNODE_CALL,
  JS_CALL_EXPRESSION,
  JS_OBJECT_EXPRESSION,
  JS_PROPERTY,
  JS_ARRAY_EXPRESSION,
  JS_FUNCTION_EXPRESSION,
  JS_CONDITIONAL_EXPRESSION,
  JS_CACHE_EXPRESSION,

  // ssr codegen
  JS_BLOCK_STATEMENT,
  JS_TEMPLATE_LITERAL,
  JS_IF_STATEMENT,
  JS_ASSIGNMENT_EXPRESSION,
  JS_SEQUENCE_EXPRESSION,
  JS_RETURN_STATEMENT,
}
