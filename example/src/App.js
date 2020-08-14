import React from 'react';
import { setStates } from 'react-global-states';
import StateTest from './StateTest';

// initial state
setStates({
  cart: {
    count: 1,
    items: [{
      name: 'shoe',
      qty: 1
    }]
  },
  user: {
    name: 'dan',
  },
});

function App() {
  return (
    <StateTest parentProp={"My name is firoz"} />
  );
}

export default App;
