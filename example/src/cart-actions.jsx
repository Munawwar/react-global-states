export const resetCount = ({ updateCart }) => (count = 0) => {
  updateCart({ count });
};

export const incrementQuantity = ({ updateCart, getStates }) => () => {
  updateCart({ count: getStates().cart.count + 1 });
};

export const decrementQuantity = ({ updateCart, getStates }) => () => {
  updateCart({ count: getStates().cart.count - 1 });
};