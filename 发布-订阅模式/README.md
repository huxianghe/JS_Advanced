之前在看[DMQ](https://github.com/DMQ)根据[vue](https://cn.vuejs.org/)双向数据绑定原理模拟实现了[mvvm](https://github.com/DMQ/mvvm)，里面有提到发布者-订阅者模式，看了一些资料，今天自己简单实现了一个发布-订阅模式。
######何为发布-订阅模式？
>其定义对象间一种一对多的依赖关系，当一个对象的状态发生改变时，所有依赖于它的对象都将得到通知。 
>

![](images/发布-订阅模式图解.png)
首次接触这个概念的时候，会有几个疑问，对象？指DOM对象还是自定义对象，还是两者均可？依赖如何建立的？一个对象状态的改变如何影响所有依赖它的对象？
这里面以微信公众号为例，展开说明：
- 假如用户A订阅了 某一个公众号G，那么当公众号G推送消息的时候，用户A就会收到相关的推送，点开可以查看推送的消息内容。
- 但是公众号G并不关心订阅的它的是男人、女人还是二哈，它只负责发布自己的主体，只要是订阅公众号的用户均会收到该消息。
- 作为用户A，不需要时刻打开手机查看公众号G是否有推动消息，因为在公众号推送消息的那一刻，用户A就会收到相关推送。
- 当然了，用户A如果不想继续关注公众号G，那么可以取消关注，取关以后，公众号G再推送消息，A就无法收到了。
######发布-订阅模式抽象化
上面即是对发布-订阅实例化的描述，但是跟上面问题的答案还是有些差距，我们付诸于代码，以代码的形式来模拟订阅消息、发布消息、取消订阅的功能，来解决上面提到的问题：
```javascript
        // 01-定义一个发布-订阅模式函数；
        function Pub2Sub() {
            // 02-订阅器；
            this._observer = {}
        }
        // 03-原型对象上面添加方法；
        Pub2Sub.prototype = {
            constructor: Pub2Sub,
            // 04-订阅者；
            subscribe: function (type, callback) {
                if (Object.prototype.toString.call(callback) !== '[object Function]') return
                // 订阅器中是否存在订阅行为；
                if (!this._observer[type]) this._observer[type] = []
                this._observer[type].push(callback)
                return this
            },
            // 05-发布者；
            publish: function () {
                let _self = this
                // 获取发布行为
                let type = Array.prototype.shift.call(arguments)
                // 获取发布主题
                let theme = Array.prototype.slice.call(arguments)
                // 获取相关主题所有订阅者
                let subscribes = _self._observer[type]
                // 发布主题
                if (!subscribes || !subscribes.length) {
                    console.warn('unsubscribe action or no actions in observer, please check out')
                    return
                }
                subscribes.forEach(callback => {
                    callback.apply(_self, theme)
                })
                return _self
            },
            // 06-取消订阅
            unsubscrible: function (type, callback) {
                if (!this._observer[type] || !this._observer[type].length) return
                let subscribes = this._observer[type]
                subscribes.some((item, index, arr) => {
                    if (item === callback) {
                      // 删除对应的订阅行为
                        arr.splice(index, 1)
                        return true
                    }
                })
                return this
            }
        }
        // 实例化发布-订阅模式
        let ps = new Pub2Sub()

        // 添加订阅
        let sub1 = function (data) {
            console.log('sub1' + data)
        }
        let sub2 = function (data) {
            console.log('sub2' + data)
        }
        ps.subscribe('click', sub1)
        ps.subscribe('click', sub2)

        // 实现发布、取订及再发布
        ps.publish('click', '第一次点击消息').unsubscrible('click', sub2).publish('click', '第二次点击消息')
        // 打印结果依次是：
        // sub1第一次点击消息
        // sub2第一次点击消息
        // sub1第二次点击消息
```
上面代码块中，订阅者1 `sub1`  和 订阅者 `sub2`  分别订阅了 'click'，这个行为，当发布者 `ps.publish` 发布主题的时候，`sub1` 和 `sub2` 均收到了消息，在控制台输出 `sub1第一次点击消息` 和 `sub2第一次点击消息`，然后 订阅者 `sub2`  又取订了 `click` 行为，所以当 发布者 `ps.publish` 再次发布主题的时候，只有 `sub1` 才收到相关消息。
那么我们就通过代码阐述了依赖是如何建立的，就是通过订阅器来实现；

**但是**，上述实现的代码存在两个问题：
- 订阅行为需要在发布行为之前，如果直接发布主题，订阅器中没有相关的订阅行为，我这里手动抛出了警告。但是这是不应该的，正如用户A订阅了公众号G，也可以查看G的历史消息，所以这里需要实现查看发布主题历史记录的功能；
- 其次，上述功能的实现是通过定义在一个自定义对象，这样就与发布-订阅模式的松散耦合理念有些出入，所以还需要做到如何更优雅的管理接口。

######发布-订阅模式优化版
针对上述的问题，我在这个版本里面做了优化，看代码：
```javascript  
// 声明一个全局发布-订阅对象，为不同模块之间的可能存在的通信做铺垫
const Observer = (function () {
            // 订阅器
            const _observer = {}
            // 历史记录
            const _cache = {},
                _shift = Array.prototype.shift,
                _slice = Array.prototype.slice,
                _toString = Object.prototype.toString
            // 订阅
            const subscribe = function (type, callback) {
                if (_toString.call(callback) !== '[object Function]') return
                // 订阅器中是否存在订阅行为；
                if (!_observer[type]) _observer[type] = []
                _observer[type].push(callback)
                return this
            }
            // 发布
            const publish = function () {
                // 获取发布行为
                let type = _shift.call(arguments)
                // 获取发布主题
                let theme = _slice.call(arguments)
                // 记录发布主题
                if (!_cache[type]) {
                    _cache[type] = [theme]
                } else {
                    _cache[type].push(theme)
                }
                // 获取相关主题所有订阅者行为
                let subscribes = _observer[type]
                // 发布主题
                if (!subscribes || !subscribes.length) return
                subscribes.forEach(callback => {
                    callback.apply(this, theme)
                })
                return this
            }
            // 取订
            const unsubscrible = function (type, callback) {
                if (!_observer[type] || !_observer[type].length) return
                let subscribes = _observer[type]
                subscribes.some((item, index, arr) => {
                    if (item === callback) {
                        arr.splice(index, 1)
                        return true
                    }
                })
                return this
            }
            // 查看发布记录
            const viewLog = function (type, callback) {
                if (!_cache[type] || _toString.call(callback) !== '[object Function]') return
                _cache[type].forEach(item => {
                    callback.apply(this, item)
                })
                return this
            }
            return {
                _observer,
                _cache,
                subscribe,
                publish,
                unsubscrible,
                viewLog
            }
        }())
        // 先发布主题；
        Observer.publish('click', '第一次发布点击消息')
        Observer.publish('focus', '第一次发布聚焦消息')
        Observer.publish('blur', '第一次发布失焦消息')

        // 订阅
        let sub1 = function (data) {
            console.log('sub1' + data)
        }
        let sub2 = function (data) {
            console.log('sub2' + data)
        }
        let sub3 = function (data) {
            console.log('sub3' + data)
        }
        Observer.subscribe('click', sub1)
        Observer.subscribe('click', sub2)
        Observer.subscribe('focus', sub3)

        // 再发布、取订、查看发布记录
        Observer.publish('click', '第二次发布点击消息').unsubscrible('click', sub2).publish('click', '第三次发布点击消息').publish('focus', '第二次发布聚焦消息').viewLog('click', function (message) {
                console.log(message)
            })
```
我们现在无论是先发布主题再订阅，还是订阅之后再发布主题，都不会有问题，因为在 `Observer.publish` 里面，发布者只关注自己发布主题功能，并且发布的时候将自己发布的对应主题保存。
在发布功能里面添加一个存放发布记录的功能，在这里面我存放的是一个数组，是为了在 `Observer.viewLog() `  中方便调用。
通过一系列的发布、取订、再发布、以及查看发布记录，打印结果如下：
```javascript
sub1第二次发布点击消息
sub2第二次发布点击消息
sub1第三次发布点击消息
sub3第二次发布聚焦消息
// 这是查看历史发布主题的结果，因为针对 click 行为，一共发布了三次主题
第一次发布点击消息
第二次发布点击消息
第三次发布点击消息
```
######理解对象间一对多的依赖关系
回到最初我们的问题，这个对象指的是既可以是自定义对象也可以是DOM对象
- 定义两个模块
```javascript
  let moduleA = {
          // 伪代码
          todo() {
            Observer.subscribe(type, function (data) {
                // 拿到 data 然后做一些事情
            })
        }
    }
  let moduleB = {
          // 伪代码
          todo() {
            Observer.subscribe(type, function (data) {
                // 拿到 data 然后做一些事情
            })
        }
    }
  // 下面是异步获取到数据
 // 伪代码
  ajax(function (data) {
        // 发布数据，所有的订阅均会拿到 data，然后按照自己的逻辑处理
        Observer.publish(type, data)
    })
```
可能会有人疑问，为什么需要这样来传递数据，直接在 `moduleA` 和 `moduleB` 里面直接获取数据不可以吗?
答案肯定是可以的，但是发布-订阅这种模式可以更优雅地在不同模块之间传递数据，代替传统的回调函数。

