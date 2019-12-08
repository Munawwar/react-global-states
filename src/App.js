import React from 'react';
import { assignState } from './state-store';
import StateTest from './StateTest';

import './App.css';

// initial state
assignState({
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
