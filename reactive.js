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

const test = {}

defineReactive(test, 'foo', 'fooval')
test.foo
test.foo = 'fooooooooo'