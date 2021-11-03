import{createContext as e,useContext as t,useState as r,useEffect as n}from"react";
/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */var o=function(){return(o=Object.assign||function(e){for(var t,r=1,n=arguments.length;r<n;r++)for(var o in t=arguments[r])Object.prototype.hasOwnProperty.call(t,o)&&(e[o]=t[o]);return e}).apply(this,arguments)};var a,i,u,s,c,f=(function(e){"object"==typeof Reflect&&"function"==typeof Reflect.ownKeys?e.exports=Reflect.ownKeys:"function"==typeof Object.getOwnPropertySymbols?e.exports=function(e){return Object.getOwnPropertyNames(e).concat(Object.getOwnPropertySymbols(e))}:e.exports=Object.getOwnPropertyNames}(a={exports:{}},a.exports),a.exports),p=(i=f,u=Function.bind.call(Function.call,Array.prototype.reduce),s=Function.bind.call(Function.call,Object.prototype.propertyIsEnumerable),c=Function.bind.call(Function.call,Array.prototype.concat),Object.values||(Object.values=function(e){return u(i(e),(function(t,r){return c(t,"string"==typeof r&&s(e,r)?[e[r]]:[])}),[])}),Object.entries||(Object.entries=function(e){return u(i(e),(function(t,r){return c(t,"string"==typeof r&&s(e,r)?[[r,e[r]]]:[])}),[])}),Object.getPrototypeOf({})),l=function(e){var t=e,r={handlers:[],subscribe:function(e){this.handlers.includes(e)||this.handlers.push(e)},unsubscribe:function(e){var t=this.handlers.indexOf(e);t>-1&&this.handlers.splice(t,1)},notify:function(e){this.handlers.forEach((function(t){return t(e)}))}},n=function(e){return Boolean(e&&"object"==typeof e&&Object.getPrototypeOf(e)===p)},a=function(e){for(var a=Object.keys(e);a.length;){var i=a.shift(),u=t[i],s=e[i];n(u)&&n(s)?t[i]=o(o({},u),s):t[i]=s}r.notify(t)};return{getStates:function(){return o({},t)},setStates:function(e){t=e,r.notify(e)},updateStates:a,createPropUpdater:function(e){return function(t){var r;return a(((r={})[e]=t,r))}},pubsub:r}};function b(e,o){if(!o&&!e)throw new Error("Cannot use createHooks(). Please pass store or context.");var a=function(e){return null==e};return{useGlobalState:function(i){var u;if(o){if(!(u=t(o)||void 0))throw new Error("Cannot use hook. Please check if Provider has been added and that it has been initialized properly.")}else if(!(u=e))throw new Error("Cannot use hook. Please pass valid store.");var s=u.getStates,c=u.pubsub,f=s(),l=r(f[i]),b=l[0],y=l[1],d=r(u),h=d[0],v=d[1];return n((function(){u!==h&&(b=f[i],y(b),v(u));var e=function(e){var t=e[i];(function(e,t){if(a(e)||a(t)||"object"!=typeof e||"object"!=typeof t)return e===t;var r=Object.getPrototypeOf(e);if((r===p||Array.isArray(e))&&r===Object.getPrototypeOf(t)){var n=Object.entries(e).every((function(e){var r=e[0];return e[1]===t[r]}));return n&&Object.entries(t).every((function(t){var r=t[0],n=t[1];return e[r]===n}))}return e instanceof Date&&t instanceof Date?e.getTime()===t.getTime():e===t})(b,t)||y(t)};return c.subscribe(e),function(){return c.unsubscribe(e)}}),[b,u,i]),b},useStore:function(){var r=e;return o&&(r=t(o)||void 0),r},useUnwrappedAction:function(r){var n;if(o){if(!(n=t(o)||void 0))throw new Error("Cannot use hook. Please check if Provider has been added and that it has been initialized properly.")}else if(!(n=e))throw new Error("Cannot use hook. Please pass valid store.");return r(n)}}}function y(t){var r=e(null),n=b(void 0,r);return{Context:r,useGlobalState:n.useGlobalState,useStore:n.useStore,useUnwrappedAction:n.useUnwrappedAction}}var d=l({}),h=b(d).useGlobalState,v=d.getStates,O=d.setStates,j=d.updateStates,w=d.createPropUpdater;export{y as createContextAndHooks,b as createHooks,w as createPropUpdater,l as createStore,v as getStates,O as setStates,d as store,j as updateStates,h as useGlobalState};
//# sourceMappingURL=index.es.js.map