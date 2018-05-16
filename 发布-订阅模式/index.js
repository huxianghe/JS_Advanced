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
            if (_toString.call(callback) !== '[object Function]') 
                return
                // 订阅器中是否存在订阅行为；
            if (!_observer[type]) 
                _observer[type] = []
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
            if (!subscribes || !subscribes.length) 
                return
            subscribes.forEach(callback => {
                callback.apply(this, theme)
            })
            return this
        }
        // 取订
        const unsubscrible = function (type, callback) {
            if (!_observer[type] || !_observer[type].length) 
                return
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
            if (!_cache[type] || _toString.call(callback) !== '[object Function]') 
                return
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