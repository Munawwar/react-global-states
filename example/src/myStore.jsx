import { createContextAndDependents } from 'react-global-states';

export const initialState = {
	cart: {
		count: 1,
		items: [{
			name: 'shoe',
			qty: 1
		}]
	},
	user: {
		name: 'bond',
	},
};

export const { Context, useGlobalStates, bindActionCreators } = createContextAndDependents(initialState);