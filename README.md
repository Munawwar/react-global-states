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

### Helper

Your action file maybe be updating one part of your store across methods. It seems a bit redundant to always do:

```js
function func1 () {
  updateStates({
    cart: {
      prop1: '...'
    }
  });
}

function func2 () {
  updateStates({
    cart: {
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
