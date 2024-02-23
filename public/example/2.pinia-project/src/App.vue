<script setup>
import { useCounterStore } from './stores/counter'
import { useTodoStore } from './stores/todo'
import { storeToRefs } from 'pinia'
const store = useCounterStore()

function patch() {
  store.$patch((state) => {
    // setState()
    state.count += 100
    state.count += 200
  })
}

// const currentTodo = ref('')
// const todoStore = useTodoStore()
const { increment, decrement } = store

// setupApi 导出的不能解构，需要转换成 ref 在使用；reactive({ref()}) 拆包；
const todoStore = useTodoStore()
const { todos, todo, todoLen } = storeToRefs(todoStore) // reactive(); 仅能转对象;
const { addTodo } = todoStore // 函数不转
// todoStore.$dispose() // 停止 store 中 effect
</script>

<template>
  {{ store.count }}
  ( {{ store.double }} )
  <button @click="increment">+</button>
  <button @click="decrement">-</button>
  <button @click="store.$reset()">重置</button>
  <button @click="patch">patch</button>

  <input type="text" v-model="todo" />
  <li v-for="t of todos">
    {{ t }}
  </li>
  <button @click="addTodo()">添加{{ todoLen }}</button>
</template>
