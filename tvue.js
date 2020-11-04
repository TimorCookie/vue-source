function defineReactive(obj, key, val) {
  // * 向下递归遍历
  observe(val)
  Object.defineProperty(obj, key, {
    get() {
      console.log(`get ${key}: ${val}`)
      return val
    },
    set(newVal) {
      if(newVal !== val) {
        console.log(`set ${key}: ${newVal}`)
        val = newVal
        // 解决赋的值是对象的情况(譬如test.foo={f1: 666})
        observe(val)
      }
    }
  })
}
function observe(obj) {
  if(typeof obj !== 'object' || obj === null) {
    return 
  }
  // * 只要obj是对象，就创建一个伴生的Observer实例
  new Observer(obj)
  
}
function proxy (vm) {
  Object.keys(vm.$data).forEach(key => {
    Object.defineProperty(vm, key, {
      get() {
        return vm.$data[key]
      },
      set(v) {
        vm.$data[key] = v
      }
    })
  })
}
class Observer {
  constructor(options) {
    if(Array.isArray(options)) {
      // todo 数组有特殊处理
    } else {
      this.walk(options)
    }
  }
  walk (obj) {
    Object.keys(obj).forEach(key => {
      defineReactive(obj, key, obj[key])
    })
  }
}
class TVue {
  constructor(options) {
    this.options = options
    this.$data = options.data

    // 1. 数据响应式
    observe(this.$data)
    // 1.5 代理 将data中的所有属性代理到KVue实例上方便用户使用
    proxy(this)
    // 2.编译
  }
}