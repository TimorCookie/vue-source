function defineReactive(obj, key, val) {
  // ! 向下递归遍历
  observe(val)
  Object.defineProperty(obj, key, {
    get() {
      console.log(`get ${key}: ${val}`)
      return val
    },
    set(newVal) {
      if (newVal !== val) {
        console.log(`set ${key}: ${newVal}`)
        val = newVal
        //! 解决赋的值是对象的情况(譬如test.foo={f1: 666})
        observe(val)
      }
    }
  })
}
function observe(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return
  }
  // * 只要obj是对象，就创建一个伴生的Observer实例
  new Observer(obj)

}
function proxy(vm) {
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
    if (Array.isArray(options)) {
      // todo 数组有特殊处理
    } else {
      this.walk(options)
    }
  }
  walk(obj) {
    Object.keys(obj).forEach(key => {
      defineReactive(obj, key, obj[key])
    })
  }
}
class TVue {
  constructor(options) {
    this.options = options
    this.$data = options.data
    // ! 1.数据响应式
    observe(this.$data)
    // ! 1.5 代理 将data中的所有属性代理到JVue实例上方便用户使用
    proxy(this)
    // ! 2.编译
    new Compile(options.el, this)
  }
}
// 将宿主的模板编译，获取它里面的动态内容，找到相关依赖并且生成watcher
class Compile {
  constructor(el, vm) {
    this.$el = document.querySelector(el)
    this.$vm = vm

    this.compile(this.$el)
  }

  compile(el) {
    const childNodes = el.childNodes
    childNodes.forEach(node => {
      if (this.isElement(node)) {
        // element
        this.compileElement(node)
      } else if (this.isInerpolation(node)) {
        // 编译插值 text
        this.compileText(node)
      }
      // 递归遍历子节点
      if (node.childNodes) {
        this.compile(node)
      }
    })
  }
  isElement(node) {
    return node.nodeType === 1
  }
  isInerpolation(node) {
    return node.nodeType === 3 && (/\{\{(.*)\}\}/).test(node.textContent)
  }
  compileText(node) {
    node.textContent = this.$vm[RegExp.$1]
  }
  compileElement(node) {
    let nodeAttrs = node.attributes
    Array.from(nodeAttrs).forEach(attr => {
      let attrName = attr.name
      let exp = attr.value
      if(this.isDirective(attrName)) {
        const dir = attrName.substring(2)
        this[dir] &&this[dir](node, exp)
      }
    })
  }
  isDirective(attr) {
    return attr.startsWith('t-')
  }
  text (node, exp) {
    node.textContent = this.$vm[exp]
  }
  html (node, exp) {
    node.innerHTML = this.$vm[exp]
  }
}