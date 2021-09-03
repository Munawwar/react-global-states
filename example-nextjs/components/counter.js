import { useGlobalState, useStore, initialState } from "../lib/store";

const useCounter = () => {
  const count = useGlobalState("count");
  const { updateStates, getStates } = useStore();
  const increment = () =>
    updateStates({
      count: getStates().count + 1
    });
  const decrement = () =>
    updateStates({
      count: getStates().count - 1
    });
  const reset = () =>
    updateStates({
      count: initialState.count
    });

  return { count, increment, decrement, reset };
};

const Counter = () => {
  const { count, increment, decrement, reset } = useCounter();
  return (
    <div>
      <h1>
        Count: <span>{count}</span>
      </h1>
      <button onClick={increment}>+1</button>
      <button onClick={decrement}>-1</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
};

export default Counter;
