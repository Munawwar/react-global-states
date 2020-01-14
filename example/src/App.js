import React from 'react';
import { updateState } from 'react-global-states';
import StateHOCTest from './StateHOCTest';
import StateHookTest from './StateHookTest';

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
    <React.Fragment>
      <h3>Using connect() (Higher order component)</h3>
      <StateHOCTest parentProp={"My name is firoz"} />
      <br />
      <hr />
      <br />
      <h3>Using useGlobalStates() (React hooks)</h3>
      <StateHookTest parentProp={"My name is firoz"} />
    </React.Fragment>
  );
}

export default App;
