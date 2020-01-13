import React from 'react';
import {
  connect,
  updateState,
  createSubPropUpdater,
} from 'react-state-store';

const updateUserState = createSubPropUpdater('user');

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
    <button onClick={() => updateUserState({ name: 'everyone' })}>Greet everyone instead</button>

    <br/>
    <br/>
    <button onClick={() => updateState({ cart: { items: [] }}) }>Change non-connected prop</button>
  </div>;
};

export default connect(['user'], Component);