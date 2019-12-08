import React from 'react';
import { connect, assignState } from './state-store';

const Component = ({
  user: {
    name,
  } = {},
  parentProp = '',
}) => {
  console.log('StateTest render...');
  return <div>
    Hi {name}
    <br/>
    {parentProp}
    <br/>
    <br/>
    <button onClick={() => assignState({ user: { name: 'everyone' }})}>Greet everyone instead</button>

    <br/>
    <br/>
    <button onClick={() => assignState({ cart: { items: [] }}) }>Change non-connected prop</button>
  </div>;
};

export default connect(['user'], Component);