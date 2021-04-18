import { createContextAndHooks } from 'react-global-states';

export const getInitialState = () => ({
	cart: {
		count: 1,
		items: [{
			name: 'shoe',
			qty: 1
		}]
	},
	user: {
		name: 'Dan',
	},
});

export const {
	Context,
	useGlobalState,
	useStore,
} = createContextAndHooks(getInitialState());