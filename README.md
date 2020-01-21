react-global-states an easy-to-use shared/global state store for React projects.

That is multiple React components can use shared global states to efficiently rerender if states change.

### Quick example

```js
import { useGlobalState, getStateUpdater } from 'react-global-states';
const Component = (props) => {
  // get (or create) global state group
  const { name = 'Dan' } = useGlobalState('greeting');
  const updateGreeting = getStateUpdater('greeting');

  const onClick = () => updateGreeting({
    name: 'everyone',
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

It is good practice to move the updation of states to a separate "action" file.

Within that file you can't use hooks though. So how to get the current states?

Use getState():

```js
import { getState, getStateUpdater } from 'react-global-states';
const cart = getState('cart');
const updateCart = getStateUpdater('cart');

export const clearCart = () => updateCart({
  items: [],
});
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
