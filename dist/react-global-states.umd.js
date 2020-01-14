(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('react')) :
	typeof define === 'function' && define.amd ? define(['exports', 'react'], factory) :
	(global = global || self, factory(global['react-global-states'] = {}, global.React));
}(this, (function (exports, React) { 'use strict';

	var React__default = 'default' in React ? React['default'] : React;

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

	var store = {}; // internal publisher-subscriber system to
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
	}; // global state merger. unlike redux, I am not enforcing reducer layer

	var updateState = function (partial) {
	  var newStore = _extends_1({}, store, {}, partial);

	  store = newStore;
	  pubsub.notify(newStore);
	}; // curry function to partially update a sub property of global store.
	// e.g const updateCartState = createSubPropUpdater('cart');
	// updateCartState({ items: [], quantity: 0 });
	// this is equivalent to
	// updateState({ cart: { ...store.cart, items: [], quantity: 0 } })

	var createSubPropUpdater = function (propName) {
	  return function (partial) {
	    var _extends2;

	    var newStore = _extends_1({}, store, (_extends2 = {}, _extends2[propName] = _extends_1({}, store[propName] || {}, {}, partial), _extends2));

	    store = newStore;
	    pubsub.notify(newStore);
	  };
	};
	var setState = function (newState) {
	  var newStore = _extends_1({}, newState);

	  store = newStore;
	  pubsub.notify(newStore);
	}; // utility

	var plainObjectPrototype = Object.getPrototypeOf({});

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
	}; // used to wrap components to receive global store props


	var connect = function (propsToConnectTo, Component) {
	  if (propsToConnectTo === void 0) {
	    propsToConnectTo = [];
	  }

	  return function (props) {
	    // state container
	    var _useState = React.useState(propsToConnectTo.reduce(function (acc, propName) {
	      if (propName in store) {
	        acc[propName] = store[propName];
	      }

	      return acc;
	    }, {})),
	        state = _useState[0],
	        setState = _useState[1];

	    React.useEffect(function () {
	      var newStateHandler = function (newStore) {
	        var newState = propsToConnectTo.reduce(function (acc, propName) {
	          if (propName in store) {
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
	      };
	    }, [state]);
	    return React__default.createElement(Component, _extends_1({}, state, props));
	  };
	};
	var useGlobalStore = function (propsToConnectTo) {
	  if (propsToConnectTo === void 0) {
	    propsToConnectTo = [];
	  }

	  var _useState2 = React.useState(propsToConnectTo.reduce(function (acc, propName) {
	    if (propName in store) {
	      acc[propName] = store[propName];
	    }

	    return acc;
	  }, {})),
	      state = _useState2[0],
	      setState = _useState2[1];

	  React.useEffect(function () {
	    var newStateHandler = function (newStore) {
	      var newState = propsToConnectTo.reduce(function (acc, propName) {
	        if (propName in store) {
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
	    };
	  }, [state]);
	  return state;
	};

	exports.connect = connect;
	exports.createSubPropUpdater = createSubPropUpdater;
	exports.setState = setState;
	exports.updateState = updateState;
	exports.useGlobalStore = useGlobalStore;

	Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=react-global-states.umd.js.map
