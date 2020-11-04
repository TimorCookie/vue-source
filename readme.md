## 前言

​		相信大家对于 Vue 的数据响应式原理并不陌生，vue2 中利用 Object.defineProperty() 实现变更检测，而 Vue3 则利用了 ES6 提供的 ProxyAPI 来取代了之前的 defineProperty 来实现这一功能。既然知道其响应式原理，那么我们该怎么实现一个数据拦截方法呢？接下来，让我们一步步来实现一个自己的 数据拦截库吧！

## 基本概念

### MVVM 框架

​		MVVM是 `Model-View-ViewModel` 的简写。它本质上就是MVC 的改进版。MVVM 就是将其中的 View 的状态和行为抽象化，让我们将视图 UI 和业务逻辑分开。当然这些事 ViewModel 已经帮我们做了，它可以取出 Model 的数据同时帮忙处理 View 中由于需要展示内容而涉及的业务逻辑。

​		MVVM 框架的三个要素：数据响应式、模版引擎及其渲染

  - 数据响应式：监听数据变化并在试图中更新（数据变更能够响应在视图中，就是数据响应式）

    		- Vue 2.x 版本： Object.defineProperty()
        - Vue 3.x 版本：Proxy
  - 模版引擎：提供描述视图的模版语法

    		- 插值：{{}}
        - 指令：v-bind, v-on, v-model, v-for, v-if...

  - 渲染：如何将模版转换为 html
    		- 模版 => vnode => dom

## 实现数据侦测

### 1. 基础方法定义

```javascript
// reactive.js
function defineReactive (obj, key, val) {
  Object.defineProperty(obj, key, {
    get() {
      // 每次取值时输出日志，方便调试
      console.log(`some data was get --- key: ${key}, val: ${val}`)
      return val
    },
    set(newVal) {
      if(newVal !== val) {
        // 每次取值时输出日志，方便调试
      	console.log(`new data was set --- key: ${key}, val: ${newVal}`)
        val = newVal
      }
    }
  })
}
```

现在我们基本实现了一个最原始的数据拦截函数，不妨来测试一下

```javascript
// reactive.js
let test = {}
defineReactive(test, 'foo', 'firstblood')
// 取 foo 的值
test.foo
// 设置 foo 的值
test.foo = 'foo'
```

上面我们定义了一个对象 test，并用之前已写好的 `defineReactive` 函数对其进行加工后尝试取 foo 的值。

此时当我们运行 `node reactive.js` 后控制台输出结果

  ![image-20201104112127669](https://tva1.sinaimg.cn/large/0081Kckwgy1gkd4wk7z1ij30jf04d74h.jpg)



表明我们对 test 这个对象的取值和赋值已经成功拦截！

虽然目前这个简易版本的 defineReactive 已经基本实现了对象拦截的操作，但仍有许多不足，譬如：

- 需要我们手动处理对象的每一个属性（key）

  ```javascript
  defineReactive(test, 'foo', 'foo')
  defineReactive(test, 'bar', 'bar')
  defineReactive(test, 'baz', 'baz')
  ```

- 当对象属性也是一个对象的时候，无法继续检测对象属性的属性

  ```javascript
  let test = {
    foo: {
      id: 1,
      name: 'foo',
    }
  }
  defineReactive(test, 'foo', {name: 'newFoo'})
  
  test.foo.id
  
  // node 执行当前文件后输出 'some data was get --- key: foo, val: [object Object]'
  // 说明只有 foo 属性成功被检测，而 foo 的 id 属性无法被检测
  ```

- 赋值为对象时，也无法继续检测

  ```javascript
  let test = {}
  defineReactive(test, 'foo', {name: 'newFoo'})
  test.foo.name
  // node 执行当前文件后输出 'some data was get --- key: foo, val: [object Object]'
  // 说明只有 foo 属性成功被检测，而 foo 的 name 属性无法被检测
  ```

  

- 如果对象添加/删除了新属性无法检测

  ```javascript
  let test = {}
  defineReactive(test, 'foo', 'firstblood')
  
  // foo 取值
  test.foo
  // node 执行后输出 'some data was get --- key: foo, val: firstblood'
  
  test.bar
  // node 执行后仅仅输出 'some data was get --- key: foo, val: firstblood'， 并未监测到 bar 取值
  ```

  

基于以上不足之处，我们需要继续完善我们的对象拦截操作

### 2. 改造完善 defineReactive 

#### - 遍历需要响应化的对象

  ```javascript
  // reactive.js
  function observe (obj) {
    // 对传入的参数做类型判断
    if (typeof obj !== 'object' || obj === null) return 
  	// 对象响应化:遍历每个key，定义getter、setter
    Object.keys(obj).forEach(key => {
    	// 调用前面已经写好的拦截方法
      defineReactive(obj, key, obj[key])
    })
  }
  ```

   通过 observe 方法， 我们对象每个属性进行遍历并对其设置了拦截操作，这样我们只要将需要做拦截的对象交由 observe 处理一下，就可以实现对象的所有属性自动拦截

  ````javascript
  const myData = {
    foo: 'foo',
    bar: 'bar',
    baz: {
      name: 'baz'
    }
  }
  observe(myData)
  // test
  myData.foo
  myData.bar = 'newBar'
  myData.baz.name
  ````

  node执行以上代码后控制台输出，证明目前对象属性自动拦截功能已经基本实现， 但嵌套对象仍旧是有问题的

  ![image-20201104140010012](https://tva1.sinaimg.cn/large/0081Kckwgy1gkd4w6a3eqj30gv04ogno.jpg)

  

#### - 解决嵌套对象问题

  当对象的属性值也为对象时，我们只需要对象的属性值也交给 observe 处理一下就可以了

  ````javascript
  // reactive.js
  function defineReactive(obj, key, val) {
    observe(val)
    Object.defineProperty(obj, key, {
      //...
    })
      //...
  }
  ````

  测试看看：

  ```javascript
  const myData = {
    foo: 'foo',
    bar: 'bar',
    baz: {
      name: 'baz'
    }
  }
  observe(myData)
  
  myData.baz.name
  ```

  node 执行后控制台输出如下，说明我们实现了对嵌套对象数据存取侦测

  ![image-20201104140851481](https://tva1.sinaimg.cn/large/0081Kckwgy1gkd53ips3hj30gs03tjrl.jpg)

#### - 解决赋值是对象的问题

  如果在给对象的某个属性赋值时，值为对象，那么我们需要对该属性值也 observe 一下，使其也成为侦测对象

  ```javascript
  // reactive.js
  function defineReactive(obj, key, val) {
    observe(val)
    Object.defineProperty(obj, key, {
      get () {
        // ...
      },
      set (newVal) {
        // ...
        observe(newVal) // 新值是对象的情况
        // ...
      }
    })
      //...
  }
  ```



#### - 解决 添加/删除了新属性问题

  ```javascript
  // reactive.js
  
  // 新增一个set函数来处理
  function set(obj, key, val) {
    defineReactive(obj, key, val)
  }
  ```



至此，我们就实现了一个简易版的数据拦截库！

完整版代码如下：

```javascript
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

/**
 * 添加新属性
 * @param {*} obj 
 * @param {*} key 
 * @param {*} val 
 */
function $set (obj, key, val){
  defineReactive(obj, key, val)
}
```



## 结语

​		今天我们已经基本实现了一个简易版的数据拦截库，那么我们如何利用这个库来实现数据响应化，使数据变化驱动视图响应呢？Vue2.x 里又是怎么做的呢？篇幅有限，且听下回分解吧～！