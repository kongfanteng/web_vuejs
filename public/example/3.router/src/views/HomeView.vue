<template>
  <div class="home">
    <img alt="Vue logo" src="../assets/logo.png" />
    <HelloWorld msg="Welcome to Your Vue.js App" />
  </div>
</template>

<script>
// @ is an alias to /src
import HelloWorld from '@/components/HelloWorld.vue'

export default {
  name: 'HomeView',
  components: {
    HelloWorld,
  },
  // async
  beforeRouteLeave(to, from, next) {
    console.log('组件内的离开')
    // await new Promise((resolve, reject) => {
    //   setTimeout(() => {
    //     if (Math.random() > 0.5) {
    //       next()
    //     }
    //   }, 1000)
    // })
  },
  beforeRouteUpdate() {
    console.log('组件内的更新')
  },
}
</script>
