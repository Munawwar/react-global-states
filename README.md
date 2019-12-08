This project a proof-of-concept on creating a shared/global state store,
connecting multiple React components to the store and testing if
components react to the changes in the store.

Wrap your components like so:
```js
import { connect } from './state-store';
const Component = (props) => { /* blah blah */ }
export default connect(['user'], Component);
```

And change properties from a button onClick handler like so:
```js
import { connect, assignState } from './state-store';
const Component = (props) => {
  /* blah blah */

  return (
    <div>
      Hi {(props.greeting || {}).name}
      <button onClick={() => assignState({ greeting: { name: 'everyone' }})}>Greet everyone</button>
    </div>
  );
}
```

For those of you familiar with Redux there are multiple deviations from it:

1. biggest difference is there is no reducer layer! and there are no events!
You use state-store.js's setState() or assignState() functions to set the global store's properties directly. It's so much simpler!
Your app/site is mostly UI layer and Actions layer.

Reducer layer is an additional layer of complexity/abstraction that if you do need, you'd better use redux. Reducer layer do have it's use in adding for example, something like google analytic e-commerce events middleware or logging middleware (with thunk). However some apps/site don't need event middlewares. So pick the right tool.

2. the library only react to changes in level 1 and level 2 properties of the store object

Why this seemingly arbitraty restriction?
Complexity reduction, the answer. i.e. I recommend you to see your global store not as
super nested props. I'd want you to normalize it.

So do't do:
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

No! this data store structure is complicated (and in this case redundant) to deal with.
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

There are other advantages with 2 levels nesting. If you are like me, who scaffold the project components like the store props, then I've saved you from the mess/hell of deeply nested component directories. You treat your components and store data as though they are "linear".

So what happens if there is a third level of nesting?
Well the library will only do a JS === equality check, unlike the first two levels where individual properties are checked. Performance could take a hit.
So make sure if you do change 3rd or 4th level (or more) object, that you create a new 3rd level object everytime (using spread or Object.assign or whatever), so that component re-rendering is triggered.

3. you can only connect to level 1 properties of the store which will be passed
as is with same prop name to the component.
As mentioned in point #2, I strongly recommend 2 levels of store reactiviity. So it only makes sense to restrict this and simply mention the L1 props you want to connect to.

This is a good practice in redux I enforce anyway. In redux
```js
mapStateToProp(({ user, cart }) => ({ user, cart })); // I don't recommend renaming props or transforming it in any way
```

### Play with it
```
yarn install
yarn start
```