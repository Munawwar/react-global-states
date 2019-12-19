This project a proof-of-concept on creating a shared/global state store,
connecting multiple React components to the store and testing if
components react to the changes in the store.

Features:

* No reducers or events. Set global state with a function call. Simple!
* No action creator wrapping
  Actions are normal functions (async or not). import your actions to your file and call them directly
* Even actions are optional (but I highly recommend them)
  (What are actions? Actions are triggered in response to user interactions. They are functions in which you do business logic without directly accessing the DOM, browser specific features or UI component properties/methods. This makes it independently testable as well.)

Wrap your components like so:
```js
import { connect } from './state-store';
const Component = (props) => { /* blah blah */ }
// get 'user' prop from global store
export default connect(['greeting'], Component);
```

And change properties from a button onClick handler like so:
```js
import { connect, assignState } from './state-store';
const Component = (props) => {
  /* blah blah */

  return (
    <div>
      Hi {props.greeting?.name ?? 'Dan'}
      {/* for sake of demo, I am not placing the action logic in an action file */}
      <button onClick={() => assignState({ greeting: { name: 'everyone' }})}>Greet everyone</button>
    </div>
  );
}
// ...
```

Note: Component's are rendered only if connected properties level 1 or level 2 properties are changed. This means you use PureComponent or React.memo() on your component only if manually passed props from parent components change often. 

For those of you familiar with Redux there are multiple deviations from it:

1. biggest difference is there is no reducer layer! and there are no events!
You use state-store.js's setState() or assignState() functions to set the global store's properties directly. It's so much simpler!
Your client-side is mostly components layer and actions layer.

  Reducer layer is an additional layer of complexity/abstraction that if you do need, you'd better use redux. Reducer layer do have it's use in adding for example, something like google analytic e-commerce events middleware or logging middleware (with thunk). However some apps/site don't need event middlewares. So pick the right tool.

2. the library only reacts to changes in level 1 and level 2 properties of the store object

    Why this seemingly arbitraty restriction?
Complexity reduction, the answer. i.e. I recommend you to see your global store not as
super nested props. I'd want you to normalize it.

  So don't do:
  ```
{
  productPage: {
    cart: {
      items: [...]
    },
    product,
  },
  cartPage: {
    cart: {
      items: [...]
    },
    couponCode: '',
  }
}
```

  Nope! This data store structure is complicated (and in this case 'cart' is redundant) to deal with.
I recommend it be refactored to:
  ```
{
  cart: {
    items: [...]
  },
  productPage: {
    product,
  },
  cartPage: {
    couponCode: '',
  }
}
```
  These can be refactored to two levels of nesting. Which I've enforced by only responding to change in those two levels of the store only.

  There are other advantages with 2 levels nesting. If you are like me, who scaffold the project components like the store props, then I've saved you from the mess/hell of deeply nested component directories. You treat your components and store data as though they are "flat".

  So what happens if there is a third level of nesting?
Well the library will only do a JS strict equality check (=== operator), unlike the first two levels where individual properties are checked. Render performance could take a hit if you nest the global store beyond 3 and more levels.
So make sure if you do change 3rd or 4th level (or more) object, that you create a new 3rd level object everytime (using spread or whatever), so that component re-rendering is triggered.

3. you can only connect to level 1 properties of the store which will be passed
as is with same prop name to the component.
As mentioned in point #2, I strongly recommend 2 levels of store reactivity. So it only makes sense to restrict this and simply mention the L1 props you want to connect to.

This is a good practice in redux I enforce anyway. In redux
```js
mapStateToProp(({ user, cart }) => ({ user, cart })); // I don't recommend renaming props or transforming it in any way
```

### Play with it
```
yarn install
yarn start
```
