function defineReactive (obj, key, val) {
  Object.defineProperty(obj, key, {
    get() {
      console.log(`get ${key}: ${val}`)
      return val
    },
    set(newVal) {
      if (newVal!==val) {
        console.log(`set ${key}: ${newVal}`)
        val = newVal
      }
    }
  })
}
// 遍历对象所有属性
function observe (data) {
  if(typeof data !== 'object' || data === null) {
    return
  }

  Object.keys(data).forEach(key=> {
    defineReactive(data, key, data[key])
  })
}
const test = {
  foo: 'foo',
  bar: 'bar'
}

// defineReactive(test, 'foo', 'fooval')
observe(test)
test.foo
test.bar
test.foo = 'fooooooooo'
test.bar = 'barrrrr'