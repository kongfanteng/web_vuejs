import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export const useTodoStore = defineStore(
  'todo',
  () => {
    // setup 方法
    const todo = ref('')
    const todos = ref([])
    const todoLen = computed(() => todos.value.length)
    function addTodo() {
      todos.value.push(todo.value)
    }
    return {
      todo,
      todos,
      addTodo,
      todoLen,
    }
  },
  { persist: true }
)
