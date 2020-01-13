react-state-store an easy-to-use shared/global state store for React projects.

That is multiple React components can use shared global states to efficiently rerender if states change.

### Quick example

Wrap your components like so:
```js
import { connect } from 'react-state-store';
const Component = (props) => { /* blah blah */ }
// get 'greeting' prop from global store
export default connect(['greeting'], Component);
```

And change properties from a button onClick handler like so:
```js
import { connect, updateState } from 'react-state-store';
const Component = (props) => {
  /* blah blah */

  return (
    <div>
      Hi {props.greeting?.name ?? 'Dan'}
      {/* for sake of demo, I am not placing the action logic in an action file */}
      <button onClick={() => updateState({ greeting: { name: 'everyone' }})}>Greet everyone</button>
    </div>
  );
}
// ...
```
That's it. Simple as that.

### Helper

Your action file maybe be updating one part of your store across methods. It seems a bit redundant to always do:

```js
function func1 () {
  updateState({
    cart: {
      prop1: '...'
    }
  });
}

function func2 () {
  updateState({
    cart: {
      prop2: '...'
    }
  });
}
```

You can simplify this a bit by using createSubPropUpdater() helper method.

```js
import { createSubPropUpdater } from 'react-state-store';

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

1. The library only reacts to changes in level 1 and level 2 properties of the store object. This means you use PureComponent or React.memo() on your component only if manually passed props from parent components change often. 

  This may seems like an arbitrary decision, but from previous experience with libraries like Redux, it is mostly not a good idea to have highly nested global store. react-state-store takes that as good practice and enforeces it here.

   **So what happens if there is a third level of nesting?**
   Well the library will only do a JS strict equality check (=== operator), unlike the first two levels where individual properties are checked. Render performance could take a hit if you nest the global store beyond 3 and more levels.
So make sure if you do change 3rd or 4th level (or more) object, that you create a new 3rd level object everytime (using spread or whatever), so that component re-rendering is triggered.

2. You can only connect to level 1 properties of the store which will be passed
as is with same prop name to the component.
   
   As mentioned in point #1, react-state-store only has 2 level of store reactivity. So it only makes sense to restrict this and simply mention the L1 props you want to connect to.

### Play with it
```
yarn install
yarn start
```
