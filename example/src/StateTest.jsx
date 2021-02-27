import React, { useContext } from 'react';
import { useGlobalStates, Context, bindActionCreators } from './myStore';
import * as cartActionCreators from './cart-actions';

const Component = ({
	parentProp = '',
	cartActions,
}) => {
	const { updateStates, updateCart } = useContext(Context);
	console.log('StateTest render...');
	const { user: { name } = {} } = useGlobalStates(['user']);
	return (
		<div>
			Hi {name}
			<br />
			{parentProp}
			<br />
			<br />
			<button onClick={() => updateStates({ user: { name: 'everyone' } })}>Greet everyone instead</button>

			<br />
			<br />
			<button onClick={() => updateCart({ count: 0 })}>Change non-connected prop</button>
			<br />
			<button onClick={() => cartActions.incrementQuantity()}>Change another non-connected prop</button>
		</div>
	);
};

export default bindActionCreators(Component, { cartActions: cartActionCreators });
