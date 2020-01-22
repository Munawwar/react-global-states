react-global-states an easy-to-use shared/global state store for React projects.

That is multiple React components can use shared global states to efficiently rerender if states change.

### Quick example

```js
import { useGlobalStates, updateStates } from 'react-global-states';
const Component = (props) => {
  // get only the level 1 properties you need from the global store
  const {
    greeting: {
      name = 'Dan'
    } = {}
  } = useGlobalStates(['greeting']);

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

That's it. Simple as that.

### Action file

It is good practice to move the updateStates() calls to separate "action" file.

Within that file you can't use hooks though. So how to get the current states?

Use getStates():

```js
import { getStates } from 'react-global-states';
const { cart } = getStates();
```


### Helper

Your action file maybe be updating one part of your store across methods. It seems a bit redundant to always do:

```js
function func1 () {
  updateStates({
    cart: {
      ...cart,
      prop1: '...'
    }
  });
}

function func2 () {
  updateStates({
    cart: {
      ...cart,
      prop2: '...'
    }
  });
}
```

You can simplify this a bit by using createSubPropUpdater() helper method.

```js
import { createSubPropUpdater } from 'react-global-states';

const updateCartState = createSubPropUpdater('cart');

function func1 () {
  updateCartState({
    prop1: '...'
  });
}

function func2 () {
  updateCartState({
    prop2: '...'
  });
}
```

### Notes

The library only reacts to changes in level 1 and level 2 properties of the store object. This means you use PureComponent or React.memo() on your component only if manually passed props from parent components change often. 

This may seems like an arbitrary decision, but from previous experience with libraries like Redux, it is mostly not a good idea to have highly nested global store. react-global-states takes that as good practice and enforces it here.

**So what happens if there is a third level of nesting?**
Well the library will only do a JS strict equality check (=== operator), unlike the first two levels where individual properties are checked. Render performance could take a hit if you nest the global store beyond 3 and more levels.
So make sure if you do change 3rd or 4th level (or more) object, that you create a new 3rd level object everytime (using spread or whatever), so that component re-rendering is triggered.

### Play with it

Go to examples directory
```
yarn install
yarn start
```
and start playing with the example.

### API Reference

##### useGlobalStates(propNames&lt;Array&gt;)

React hook to fetch the properties you want from global store. Using the hook also associates the component with only those props you've asked for. This makes re-rendering performance much better.

Arguments:

propNames[]: Array of prop names (strings) you want to fetch from global store

Returns: an object with the key, values for each prop name you asked for. If a value doesn't exist you get undefined as the value for the prop name.


##### getStates()
To get states outside of a component (example: in an action file).

Returns: the entire global store.

##### updateStates(partial&lt;Object&gt;)

Function to update multiple states on the global store. updateStates with spread your new states as level 1 props of store (it does not replace other existing props of the store).

So let's say your store looks like

```js
{
  prop1: { a: 1 },
  prop2: { a: 0 },
}
```

and you do a update like:
```js
updateStates({
  prop2: { b: 2 },
  prop3: { c: 3 },
});
```

then the resultant global store will look like:
```js
{
  prop1: { a: 1 },
  prop2: { b: 2 },
  prop3: { c: 3 },
}
```

Arguments:

partial: An object with store props (as key-values) that you want to update.

Returns: No return value

##### createSubPropUpdater(propName&lt;String&gt;)

Returns a function that you can use to update a specific prop from the store. This is only needed if prop value is an object which you want to incrementally update.

This is a convinence function. You can achieve what you want with updateStates() function alone if you wish. Check <a href="#Helper">Helper</a> section for more info on when one would use this.

Arguments:

propName: The prop name whose sub/inner properties that you want to ultimately update.

Returns: A function that you can call (any number of times) to incrementally update the prop's sub/inner properties.