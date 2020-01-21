react-global-states an easy-to-use shared/global state store for React projects.

That is multiple React components can use shared global states to efficiently rerender if states change.

### Quick example

```js
import { useStateGroups, setStateGroups } from 'react-global-states';
const Component = (props) => {
  // get only the level 1 properties you need from the global store
  const {
    greeting = {},
    greeting: {
      name = 'Dan'
    } = {}
  } = useStateGroups(['greeting']);

  const onClick = () => setStateGroups({
    greeting: {
      ...greeting,
      name: 'everyone',
    },
  });

  return (
    <div>
      Hi {name}
      {/* for sake of demo, I am not placing the action logic in an action file */}
      <button onClick={onClick}>Greet everyone</button>
    </div>
  );
}
export default Component;
```

That's it. Simple as that.

### Action file

It is good practice to move the setStateGroups() calls to "action" separate file.

Within that file you can't use hooks though. So how to get the current states?

Use getStateGroups():

```js
import { getStateGroups } from 'react-global-states';
const { cart } = getStateGroups(['cart']);
```

### Helper

Your action file maybe be updating one part of your store across methods. It seems a bit redundant to always do:

```js
function action1 () {
  setStateGroups({
    cart: {
      ...cart,
      prop1: '...'
    }
  });
}

function action2 () {
  setStateGroups({
    cart: {
      ...cart,
      prop2: '...'
    }
  });
}
```

You can simplify this a bit by using createStateGroupUpdater() helper method.

```js
import { createStateGroupUpdater } from 'react-global-states';

const updateCartState = createStateGroupUpdater('cart');

function action1 () {
  updateCartState({
    prop1: '...'
  });
}

function action2 () {
  updateCartState({
    prop2: '...'
  });
}
```

### Notes

The library only reacts to changes in level 1 properties of a state group. This means you use PureComponent or React.memo() on your component only if manually passed props from parent components change often.

This may seems like an arbitrary decision, but from previous experience with libraries like Redux, it is mostly not a good idea to have highly nested global store. react-global-states takes that as good practice and enforces it here.

**So what happens if there is a second level of nesting?**
Well the library will only do a JS strict equality check (=== operator), unlike the first level where individual properties are checked. Render performance could take a hit if you nest the global store beyond 2 or more levels.
So make sure if you do change 2rd or 3th level (or more) object, that you create a new object everytime (using spread or whatever), so that component re-rendering is triggered.

### Play with it

Go to examples directory
```
yarn install
yarn start
```
and start playing with the example.
