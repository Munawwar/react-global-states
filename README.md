react-global-states is a global state store for React projects.

without the reducer, dispatch, thunk/saga, nested selector etc ceremonies.

## Quick example

```
npm install react-global-states
```

Before you start you need to decide whether you need SSR (Server-side rendering) support or just CSR (client-side rendering). SSR significantly changes the way you code/use the library.

CSR Example:

JS

```jsx
import { useGlobalState, updateStates } from 'react-global-states';
const Component = () => {
  // get a specific property from the global store
  const { name = 'Dan' } = useGlobalState('greeting') || {};

  return (
    <div>
      Hi {name}
      {/* for sake of demo, I am not placing the action logic in an action file */}
      <button onClick={() => updateStates({ greeting: { name: 'everyone' } })}>Greet everyone</button>
    </div>
  );
}
export default Component;
```

TS

```jsx
import { useGlobalState, updateStates } from './myStore';
const Component = () => {
  // get a specific property from the global store
  const { name } = useGlobalState('greeting');

  return (
    <div>
      Hi {name}
      {/* for sake of demo, I am not placing the action logic in an action file */}
      <button onClick={() => updateStates({ greeting: { name: 'everyone' } })}>Greet everyone</button>
    </div>
  );
}
export default Component;
```
```jsx
// myStore.ts
import { createStore, createHooks } from 'react-global-states';

type MyStore = {
  greeting: {
    name: string;
  }
}

const store = createStore<MyStore>({
  greeting: {
    name: 'Dan'
  }
});

export const { getStates, updateStates } = store;
export const { useGlobalState } = createHooks(store);
```

SSR Example:

JS

```jsx
import { useGlobalState, useStore } from './storeHelpers';
const Component = () => {
  // get a specific property from the global store
  const { name = 'Dan' } = useGlobalState('greeting');
  const { updateStates } = useStore();

  return (
    <div>
      Hi {name}
      {/* for sake of demo, I am not placing the action logic in an action file */}
      <button onClick={() => updateStates({ greeting: { name: 'everyone' }})}>Greet everyone</button>
    </div>
  );
}
export default Component;
```
```jsx
// storeHelpers.js
import { createContextAndHooks } from 'react-global-states';

export const getInitialState = () => ({
  greeting: {
    name: 'Dan'
  }
});

export const {
  Context,
  useGlobalState,
  useStore,
} = createContextAndHooks(
  // optional to pass initial states.. but you get IDE intellisense if you pass it.
  getInitialState()
);
```
```jsx
// app.js
import { createStore } from 'react-global-states';
import { Context, getInitialState } from './storeHelpers';

const App = () => {
  const store = createStore(getInitialState());
  return (
    <Context.Provider value={store}>
      <Component />
    </Context.Provider>
  );
}
export default App;
```

TypeScript

```tsx
import { useGlobalState, useStore } from './storeHelpers';

const Component = () => {
  // get a specific property from the global store
  const { name } = useGlobalState('greeting');
  const { updateStates } = useStore();
  return (
    <div>
      Hi {name}
      {/* for sake of demo, I am not placing the action logic in an action file */}
      <button onClick={() => updateStates({ greeting: { name: 'everyone' }})}>Greet everyone</button>
    </div>
  );
}
export default Component;
```
```jsx
// storeHelpers.ts
import { createContextAndHooks } from 'react-global-states';

type MyStore = {
  greeting: {
    name: string;
  }
}

export const getInitialState = (): MyStore => ({
  greeting: {
    name: 'Dan'
  }
});

export const {
  Context,
  useGlobalState,
  useStore,
} = createContextAndHooks<MyStore>();
```
```jsx
// app.js
import { createStore } from 'react-global-states';
import { Context, getInitialState } from './storeHelpers';

const App = () => {
  const store = createStore(getInitialState());
  return (
    <Context.Provider value={store}>
      <Component />
    </Context.Provider>
  );
}
export default App;
```

# Contents

* [Action File](#action-file)
* [Initial States](#initial-states)
* [Notes](#notes)
* [Play with it](#play-with-it)
* [API Reference](#api-reference)
## Action file

It is good practice to move the updateStates() calls to separate "action" file. For e.g. you can unit test the actions without having to test the UI components as well.

actions/greeting.js
```js
export const updateName = (store, name) => {
  store.updateStates({ greeting: { name }});
}
```

And you can change the component to the following:
```jsx
import { useStore } from 'react-global-states';
import * as greetingActions from '../actions/greeting';

const Component = () => {
  const store = useStore();
  // ...
      <button onClick={() => greetingActions.updateName(store, 'everyone')}>Greet everyone</button>
  // ...
}
```

Note: Actions can be async functions (yay! no thunk/saga required).

Within the action file you can't use hooks though. Instead you can use getStates() to get the current states from the store.

```js
export const someAction = (store, name) => {
  const allGlobalStatesOfTheStore = store.getStates(); // you get all the properties of the store
  const { greeting } = allGlobalStatesOfTheStore;
  // ...
}
```

## Initial States

If you are using TypeScript or if you are creating an new store, you get the ability to set initial states of the store while creating the store:

```ts
import { createStore } from 'react-global-states';

const getInitialStates = ():MyStore => ({
  greeting: {
    name: 'Dan'
  }
});
createStore<MyStore>(initialStates);
```

However if you are using the default store, you can initialize the store using `setStates()`.

```js
import { setStates } from 'react-global-states';

setStates({
  greeting: {
    name: 'Dan'
  }
});
```

`setStates()` simply replaces the entire store.

## Notes


### Reactivity

The library only reacts to changes in level 1 and level 2 properties of the store object.

This may seem like an arbitrary decision, but from previous experience with libraries like Redux on large projects, it is mostly not a good idea to have highly nested global store. Mostly because managing a tree is a lot harder. It involves selectors and re-mapping store properties to new names etc to improve performance, all of which adds unnecessary complexities/cognitive load, which could have been avoided if you flatten the global store in the first place. `react-global-states` takes that as good practice and enforces it here.

**So what happens if there is a third level of nesting?**
Well the library will only do a JS strict equality check (=== operator), unlike the first two levels where individual properties are checked. Render performance could take a hit if you nest the global store beyond 3 and more levels.
So if you do change 3rd or 4th level (or more) object,  make sure that you create a new 3rd level object everytime (using spread or whatever), so that component re-rendering is triggered.

### Q: "Why is SSR more complex"?

Answer: Each server request for a page needs it's own states. Sharing states across requests does not work well in async rendering libraries like `next.js`. Which means each request needs a new store, passed to components via a Context. But that makes libraries more complex to use.

### Zombie child & stale props problem

Redux documents [two issues](https://react-redux.js.org/api/hooks#stale-props-and-zombie-children) they had to tackle named "zombie child" and "state props" problems.

The common pattern between the two issues is the use of component props to select a global state. `react-global-states` does not support dynamic selectors, rather get all the data you need and make the conditional decision in render code. This happens to be a good thing here, as both classes of issues are not possible with static selectors.

### Usage with Multiple renderers

When using `react-global-states` with multiple renderers (e.g. react-three-fiber inside react), you will have to implement a [solution mentioned in this thread by franciscop-sc](https://github.com/facebook/react/issues/13332#issuecomment-513088081).

## Play with it

Go to examples directory
```
yarn install
yarn start
```
and start playing with the example.

## API Reference

#### useGlobalState(propName)

React hook to fetch a property from the the global store. Using the hook also associates the component with the property.

Parameters:

propName: Property names (string) you want to fetch from global store

Returns: The property you asked for. If a value doesn't exist you get undefined.

<br><br>

#### getStates()

Returns: the entire global store. You can use this outside of a component (example: in an action file).

<br><br>

#### setStates(newStore&lt;Object&gt;)

Replaces your entire store with the `newStore` object you pass.

Parameters:

newStore: The new store object.

Returns: No return value

<br><br>

#### updateStates(partial&lt;Object&gt;)

Function to update multiple states on the global store. updateStates will merge new states upto two levels of the store.

So let's say your store looks likes the following:

```js
{
  prop1: { a: 1 },
  prop2: { b: 2 },
}
```

and you do an update as below:
```js
updateStates({
  prop1: { a: 0 },
  prop2: { d: 4 },
  prop3: { c: 3 },
});
```

then the resultant global store will look like:
```js
{
  prop1: { a: 0 },
  prop2: { b: 2, d: 4 },
  prop3: { c: 3 },
}
```

Parameters:

partial: An partial store object that would be used to update the store.

Returns: No return value

<br><br>

#### useStore()

Returns: Store methods for the store that was connected via context provider.

<br><br>

#### createPropUpdater(propName&lt;String&gt;)

Returns a function that can be used to update a specific prop from the store. This is only needed if prop value is an object which you want to incrementally update.

This is a convenience function. You can achieve what you want with updateStates() function alone if you wish.

Arguments:

propName: The prop name whose sub/inner properties that you want to ultimately update.

Returns: A function that you can call (any number of times) to incrementally update the prop's sub/inner properties.

Example:

```js
// without createPropUpdater()
const resetCart = () => updateStates({ cart: { items: [] } });
const setCartItems = (items) => updateStates({ cart: { items } });
// ...

// with createPropUpdater()
const updateCart = createPropUpdater('cart');
const resetCart = () => updateCart({ items: [] });
const setCartItems = (items) => updateCart({ items });
// .. the more actions you have that is updating cart, the more useful createPropUpdater() becomes.
```

<br><br>

#### createStore(initialStoreProps: Object)

Creates a new store and returns an object with functions with same name & interface as the APIs mentioned above (i.e. store.getStates()) to manage the new store.

There are two use-cases for creating a fresh store, instead of using the default store:

1. You are using TypeScript: For type checks to work you need to define your Store's interface. The default store accepts any props, which won't give you strict type check.

2. You are writing a library/module that is expected to be used with any react app: In which case polluting the default store with props can cause naming collision with the consumer of your library. Creating new store avoids prop name collisions for libraries.

Parameters:

initialStoreProps (optional): An object with properties to initialize your store with.

Returns: An object with functions to use the new store.

<br><br>

## Breaking changes v4

useGlobalStates() is removed, instead use useGlobalState() (singular).

```js
// old api
const { cart: { quantity } } = useGlobalStates(['cart']);
// new api
const { quantity } = useGlobalState('cart');
```

## Changes v3.1

* Bring back createSubPropUpdater(). But it's named createPropUpdater() instead.

## Breaking changes v3

* updatesStates() now will merge 2nd level properties unlike v2 which only merged 1st level properties.

* Renamed createSubPropUpdater() method. updateStates() now can do the same job. However if you really need the compatibility, then you can implement it as follows:

```js
import { updateStates } from 'react-global-states';
const createSubPropUpdater = (propName) => (partial) => updateStates({ [propName]: partial });
```

* no more ES5 support. distributions are in ES6

## Future work

Support for react concurrent mode. From the current [useMutableSource` RFC](https://github.com/bvaughn/rfcs/blob/useMutableSource/text/0000-use-mutable-source.md#redux-stores) it seems like we can support concurrent mode without public API change. This is just theoretical at the moment.. things could change.
