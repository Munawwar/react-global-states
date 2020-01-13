import React from 'react';
import { updateState } from 'react-state-store';
import StateTest from './StateTest';

import './App.css';

// initial state
updateState({
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
