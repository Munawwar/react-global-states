import React from 'react';
import {
  updateStates,
  useGlobalStates,
} from 'react-global-states';

const Component = ({
  parentProp = '',
}) => {
  console.log('StateTest render...');
  const { user: { name } = {} } = useGlobalStates(['user']);
  return <div>
    Hi {name}
    <br/>
    {parentProp}
    <br/>
    <br/>
    <button onClick={() => updateStates({ user: { name: 'everyone' } }) }>Greet everyone instead</button>

    <br/>
    <br/>
    <button onClick={() => updateStates({ cart: { count: 0 }}) }>Change non-connected prop</button>
  </div>;
};

export default Component;