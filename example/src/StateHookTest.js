import React from 'react';
import {
  updateState,
  createSubPropUpdater,
  useGlobalStore,
} from 'react-global-states';

const updateUserState = createSubPropUpdater('user');

const Component = ({
  parentProp = '',
}) => {
  console.log('StateTest render...');
  const { user: { name } = {} } = useGlobalStore(['user']);
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

export default Component;