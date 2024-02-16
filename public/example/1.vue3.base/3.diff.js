// 2 5 8 9 7 4 6 11
// 最长的子序列是多少个？长度？

// 贪心算法
// 找序列中更有潜力的那一个，比最后一个大的，直接放到队列中，如果比最后一个小
// 则将它替换到队列中比他第一个大的那一项（二分查找）

// 运用 贪心算法 + 二分查找 + 追溯

// 2
// 2 5
// 2 5 8
// 2 5 8 9
// 2 5 7 9
// 2 4 7 9
// 2 4 6 9
// 2 4 6 9 11

// 追溯
// 2 5 8 9 11 = 5

// [1, 2, 3, 4, 5] -> [0, 1, 2, 3, 4]
function getSeq(arr) {
  const result = [0]
  const len = arr.length

  let resultLastIndex
  let start = 0,
    end = 0,
    middle = 0,
    p = arr.slice(0)
  for (let i = 0; i < len; i++) {
    const arrI = arr[i]
    if (arrI !== 0) {
      resultLastIndex = result[result.length - 1]
      if (arr[resultLastIndex] < arrI) {
        result.push(i)
        p[i] = resultLastIndex
        continue
      }
      // 替换
      start = 0
      end = result.length - 1
      while (start < end) {
        middle = Math.floor((start + end) / 2)
        // 结果集中间的哪一项的值
        if (arr[result[middle]] < arrI) {
          start = middle + 1
        } else {
          end = middle
        }
      }
      if (arrI < arr[result[end]]) {
        p[i] = result[end - 1]
        result[end] = i // 返回最后找到的索引比这一项大，就用这个索引换掉，因为更有潜力
      }
    }
  }
  console.log('p:', p)
  let i = result.length
  let last = result[i - 1] // 拿到 9 的索引，向上找
  while (i-- > 0) {
    result[i] = last
    last = p[last] // 追溯上一次的值
  }
  return result
}
const r = getSeq([2, 3, 1, 5, 6, 8, 7, 9, 4])
console.log('r:', r)
