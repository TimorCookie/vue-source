/**
 * 创建Observer类
 * @param {*} obj 需要侦测的对象
 */
function observe(obj) {
  if (typeof obj !== 'object' || obj === null) return
  new Observer(obj)
}
/**
 * 对象属性数据拦截
 * @param {*} obj 
 * @param {*} key 
 * @param {*} val 
 */
function defineReactive(obj, key, val) {
  observe(val)
  const dep = new Dep()
  Object.defineProperty(obj, key, {
    get() {
      console.log(`getter触发========key:${key}---val:${val}`)
      dep.target&&dep.addDep(Dep.target)
      return val
    },
    set(newVal) {
      if (newVal !== val) {
        val = newVal
        console.log(`getter触发========key:${key}---val:${val}`)
        observe(val)
        dep.notify()
      }
    }
  })
}
class Observer {
  constructor(options) {
    this.options = options
    if (Array.isArray(options)) {
      // todo 数组的特殊操作
    } else {
      this.walk(options)
    }

  }
  walk() {
    Object.keys(this.options).forEach(key => {
      defineReactive(this.options, key, this.options[key])
    })
  }
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
class TVue {
  constructor(options) {
    this.$options = options
    this.$data = options.data

    observe(this.$data)

    // 将vm.$data 代理到vm
    proxy(this)

    // 编译
    new Compile(options.el, this)
  }
}

class Compile {
  constructor(el, vm) {
    this.$el = document.querySelector(el)
    this.$vm = vm

    this.compile(this.$el)
  }
  compile (el){
    const childNodes = el.childNodes
    childNodes.forEach(node=> {
      // 区分一下当前node是文本节点还是element元素
      if(this.isElement(node)) {
        // element
        this.compileElement(node)
      } else if(this.isInerpolation(node)){
        // 插值文本
        this.compileText(node)
      }
      if(node.childNodes) {
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
    Array.from(nodeAttrs).forEach(attr=> {
      let attrName = attr.name
      let exp = attr.value

      if(this.isDirective(attrName)) {
        const dir = attrName.substring(2)
        this[dir] && this[dir](node, exp)
      }
    })
  }
  isDirective(key) {
    return key.startsWith('t-')
  }
  html(node, exp) {
    node.innerHTML = this.$vm[exp]
  }
  text(node, exp) {
    node.textContent = this.$vm[exp]
  }
}

class Watcher{
  constructor(vm, key, update) {
    this.vm = vm;
    this.key = key
    this.updateFn = update

    Dep.target = this
    this.vm[this.key]
    Dep.target = null
  }
  update(){
    this.updateFn.call(this.vm, this.vm[this.key])
  }
}
class Dep {
  constructor (){
    this.deps = []
  }
  addDep(dep) {
    this.deps.add(dep)
  }
  notify() {
    this.deps.forEach(dep=> dep.update())
  }
}