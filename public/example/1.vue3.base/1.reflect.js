const person = {
  name: 'jw',
  get aliasName() {
    // 属性访问器
    return 'handsome' + this.name
  },
}
const proxy = new Proxy(person, {
  get(target, key, receiver) {
    console.log(key)
    return Reflect.get(target, key, receiver)
  },
  set(target, key, value, receiver) {
    //  this = receiver
    return Reflect.set(target, key, value, receiver)
  },
})
console.log(proxy.aliasName)
// 如果用户修改了name属性，我们是无法监控到的
// effect(() => {
//   proxy.name = 'jw2'
// })
// proxy.name = 'wx'
