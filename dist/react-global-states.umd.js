(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('react')) :
	typeof define === 'function' && define.amd ? define(['exports', 'react'], factory) :
	(global = global || self, factory(global['react-global-states'] = {}, global.React));
}(this, (function (exports, react) { 'use strict';

	function createCommonjsModule(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}

	var _extends_1 = createCommonjsModule(function (module) {
	function _extends() {
	  module.exports = _extends = Object.assign || function (target) {
	    for (var i = 1; i < arguments.length; i++) {
	      var source = arguments[i];

	      for (var key in source) {
	        if (Object.prototype.hasOwnProperty.call(source, key)) {
	          target[key] = source[key];
	        }
	      }
	    }

	    return target;
	  };

	  return _extends.apply(this, arguments);
	}

	module.exports = _extends;
	});

	var createStore = function (initStore) {
	  // "The" global store
	  var store = initStore; // internal publisher-subscriber system to
	  // notify containers of store changes.

	  var pubsub = {
	    handlers: [],
	    subscribe: function subscribe(handler) {
	      // console.log('subscribed');
	      if (!this.handlers.includes(handler)) {
	        this.handlers.push(handler);
	      }
	    },
	    unsubscribe: function unsubscribe(handler) {
	      // console.log('unsubscribed');
	      var index = this.handlers.indexOf(handler);

	      if (index > -1) {
	        this.handlers.splice(index, 1);
	      }
	    },
	    notify: function notify(newStore) {
	      this.handlers.forEach(function (handler) {
	        return handler(newStore);
	      });
	    }
	  };

	  var getStates = function () {
	    return _extends_1({}, store);
	  }; // global state merger. unlike redux, I am not enforcing reducer layer


	  var plainObjectPrototype = Object.getPrototypeOf({});

	  var isPlainObject = function (obj) {
	    return Boolean(obj && typeof obj === 'object' && Object.getPrototypeOf(obj) === plainObjectPrototype);
	  }; // updateStates merges properties upto two levels of the data store


	  var updateStates = function (partial) {
	    var newStore = _extends_1({}, store);

	    var propNames = Object.keys(partial);

	    while (propNames.length) {
	      var propName = propNames.shift();
	      var oldValue = store[propName];
	      var newValue = partial[propName];

	      if (isPlainObject(oldValue) && isPlainObject(newValue)) {
	        newStore[propName] = _extends_1({}, oldValue, newValue);
	      } else {
	        newStore[propName] = newValue;
	      }
	    }

	    store = newStore;
	    pubsub.notify(newStore);
	  };

	  // utility
	  var twoLevelIsEqual = function (oldState, newState, level) {
	    if (level === void 0) {
	      level = 1;
	    }

	    if (oldState === null || newState === null || oldState === undefined || newState === undefined) {
	      return oldState === newState;
	    }

	    var oldStatePrototype = Object.getPrototypeOf(oldState);

	    if (level <= 2 && (oldStatePrototype === plainObjectPrototype || Array.isArray(oldState)) && oldStatePrototype === Object.getPrototypeOf(newState)) {
	      // check if all props of oldState is in newState
	      var isEqual = Object.entries(oldState).every(function (_ref) {
	        var key = _ref[0],
	            val = _ref[1];
	        return twoLevelIsEqual(val, newState[key], level + 1);
	      }); // check if all props of newState is in oldState

	      isEqual = isEqual && Object.entries(newState).every(function (_ref2) {
	        var key = _ref2[0],
	            val = _ref2[1];
	        return twoLevelIsEqual(oldState[key], val, level + 1);
	      }); // if so, they are equal (upto two levels).

	      return isEqual;
	    }

	    if (oldState instanceof Date && newState instanceof Date) {
	      return oldState.getTime() === newState.getTime();
	    }

	    return oldState === newState;
	  };

	  return {
	    useGlobalStates: function useGlobalStates(propsToConnectTo) {
	      var _useState = react.useState(propsToConnectTo.reduce(function (acc, propName) {
	        if (propName in store) {
	          acc[propName] = store[propName];
	        }

	        return acc;
	      }, {})),
	          state = _useState[0],
	          setState = _useState[1];

	      var propNameHash = propsToConnectTo.slice().sort().join('|');
	      react.useEffect(function () {
	        var newStateHandler = function (newStore) {
	          var newState = propsToConnectTo.reduce(function (acc, propName) {
	            if (propName in newStore) {
	              acc[propName] = newStore[propName];
	            }

	            return acc;
	          }, {}); // console.log('current state', state);
	          // console.log('new state', newState);
	          // console.log('twoLevelIsEqual', twoLevelIsEqual(state, newState));

	          if (!twoLevelIsEqual(state, newState)) {
	            setState(newState);
	          }
	        };

	        pubsub.subscribe(newStateHandler); // on component unmount, unsubscribe to prevent mem leak

	        return function () {
	          return pubsub.unsubscribe(newStateHandler);
	        }; // eslint-disable-next-line react-hooks/exhaustive-deps
	      }, [state, propNameHash]);
	      return state;
	    },
	    getStates: getStates,
	    setStates: function setStates(newStore) {
	      store = newStore;
	      pubsub.notify(newStore);
	    },
	    updateStates: updateStates
	  };
	};
	var defaultStore = createStore({});
	var useGlobalStates = defaultStore.useGlobalStates,
	    getStates = defaultStore.getStates,
	    setStates = defaultStore.setStates,
	    updateStates = defaultStore.updateStates; // -------------- app code testing ------------------

	exports.createStore = createStore;
	exports.getStates = getStates;
	exports.setStates = setStates;
	exports.updateStates = updateStates;
	exports.useGlobalStates = useGlobalStates;

	Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=react-global-states.umd.js.map
