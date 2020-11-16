function defineReactive(obj, key, val) {
  // ! 向下递归遍历
  observe(val)
  // 创建Dep实例
  const dep = new Dep()
  Object.defineProperty(obj, key, {
    get() {
      console.log(`get ${key}: ${val}`)
      Dep.target && dep.addDep(Dep.target)
      return val
    },
    set(newVal) {
      if (newVal !== val) {
        console.log(`set ${key}: ${newVal}`)
        val = newVal
        //! 解决赋的值是对象的情况(譬如test.foo={f1: 666})
        observe(val)
        dep.notify()
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
    this.$options = options
    this.$data = options.data
    // ! 1.数据响应式
    observe(this.$data)
    // ! 1.5 代理 将data中的所有属性代理到JVue实例上方便用户使用
    proxy(this)
    // ! 2.编译
    // new Compile(options.el, this)
    if (options.el) {
      this.$mount(options.el)
    }
  }
  $mount (el) {
    // 获取宿主元素
    this.$el = document.querySelector(el)
    console.log(this.$el)
    const updateComponent = () => {
       // 执行渲染函数
      const { render } = this.$options;
      // 真实dom操作版实现
      const el = render.call(this);
      const parent = this.$el.parentElement;
      parent.insertBefore(el, this.$el.nextSibling);
      parent.removeChild(this.$el);
      this.$el = el;
    }
    // 创建一个 Watcher 实例
    new Watcher(this, updateComponent)
  }
}
// 将宿主的模板编译，获取它里面的动态内容，找到相关依赖并且生成watcher
// class Compile {
//   constructor(el, vm) {
//     this.$el = document.querySelector(el)
//     this.$vm = vm

//     this.compile(this.$el)
//   }

//   compile(el) {
//     const childNodes = el.childNodes
//     childNodes.forEach(node => {
//       if (this.isElement(node)) {
//         // element
//         this.compileElement(node)
//       } else if (this.isInerpolation(node)) {
//         // 编译插值 text
//         this.compileText(node)
//       }
//       // 递归遍历子节点
//       if (node.childNodes) {
//         this.compile(node)
//       }
//     })
//   }
//   isElement(node) {
//     return node.nodeType === 1
//   }
//   isInerpolation(node) {
//     return node.nodeType === 3 && (/\{\{(.*)\}\}/).test(node.textContent)
//   }
//   compileText(node) {
//     this.update(node, RegExp.$1, 'text')
//     // node.textContent = this.$vm[RegExp.$1]
//   }
//   compileElement(node) {
//     let nodeAttrs = node.attributes
//     // 遍历元素所有特性 如果为k-开头 说明是动态，需要特殊处理
//     Array.from(nodeAttrs).forEach(attr => {
//       // 形如 j-text="counter"
//       let attrName = attr.name
//       let exp = attr.value
//       if (this.isDirective(attrName)) {
//         // ! dir: 指令
//         const dir = attrName.substring(2)
//         // 执行指令对应的方法
//         this[dir] && this[dir](node, exp)
//       }
//     })
//   }
//   isDirective(attr) {
//     return attr.startsWith('t-')
//   }
//   text(node, exp) {
//     this.update(node, exp, 'text')
//     // node.textContent = this.$vm[exp]
//   }
//   html(node, exp) {
//     this.update(node, exp, 'html')
//     // node.innerHTML = this.$vm[exp]
//   }
  
//   /**
//    * 初始化显示， watcher创建
//    * @param {*} node 节点
//    * @param {*} exp 属性值
//    * @param {*} dir 指令（k-`${dir}`）
//    */
//   update(node, exp, dir) {
//     // 1.初始化
//     const fn = this[dir + 'Updater'];
//     fn && fn(node, this.$vm[exp])
//     // 2.更新 创建watcher
//     new Watcher(this.$vm, exp, function(val) {
//       fn && fn(node, val)
//     })
//   }
//   // 节点更新实操方法
//   textUpdater (node, val){
//     node.textContent = val
//   }
//   htmlUpdater (node, val) {
//     node.innerHTML = val
//   }
// }


// 负责视图更新，与依赖一一对应
class Watcher {
  constructor(vm, expOrFn) {
    this.vm = vm;
    this.getter = expOrFn;
     // 触发依赖收集
    this.get()

  }
  get () {
    Dep.target = this;
    this.getter.call(this.vm)
    Dep.target = null
  }
  // Dep未来会通知更新
  update() {
    this.get()
  }
}
// 依赖：和响应式对象的key一一对应
class Dep {
  constructor() {
    this.deps = new Set();
  }
  addDep(wather) {
    this.deps.add(wather)
  }
  notify() {
    this.deps.forEach(wather => wather.update())
  }
}