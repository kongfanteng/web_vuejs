const queue = []
let isFlushing = false
const resolvePromise = Promise.resolve()

// 调度函数，实现异步渲染
export function queueJob(job) {
  if (!queue.includes(job)) {
    // 将任务放到队列中
    queue.push(job)
  }
  if (!isFlushing) {
    isFlushing = true
    resolvePromise.then(() => {
      isFlushing = false
      let arr = queue.slice(0)
      queue.length = 0 // 在执行的时候可以继续向 queue 中添加任务
      for (let i = 0; i < arr.length; i++) {
        const job = arr[i]
        job()
      }
      arr.length = 0
    })
  }
}
