/**
 * 将对象转化为响应式数据
 * @param {*} obj 需要响应化的对象
 * @param {*} key 属性
 * @param {*} val 值
 */
function defineReactive (obj, key, val) {
  // 解决诸如 test.baz.a 对象嵌套问题
  observe(val)
  Object.defineProperty(obj, key, {
    get() {
      console.log(`get ${key}: ${val}`)
      return val
    },
    set(newVal) {
      if (newVal!==val) {
        console.log(`set ${key}: ${newVal}`)
        val = newVal
        // 解决赋的值是对象的情况(譬如test.foo={f1: 666})
        observe(val)
      }
    }
  })
}


/**
 * 对象响应化:遍历每个key，定义getter、setter
 * @param {*} data 需要响应化的对象
 */
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
  bar: 'bar',
  baz: {
    a: 4
  }
}

// defineReactive(test, 'foo', 'fooval')
observe(test)
// test.foo
// test.bar
// test.foo = 'fooooooooo'
// test.bar = 'barrrrr'
// test.baz.a
test.foo={
  f1: '666'
}
test.foo.f1
