import { useState } from "react";
import { useMemoizedStore, Context } from "../lib/store";
import createId from "../lib/createId";

export default function App({ Component, pageProps }) {
  const [stateId] = useState(createId());

  console.log(
    "_app.js: initialServerSideState",
    pageProps.initialServerSideState,
    "state context id =",
    stateId
  );
  const store = useMemoizedStore(pageProps.initialServerSideState);
  console.log("_app.js: storeId", store.getStates().storeId);

  return (
    <Context.Provider value={store}>
      <Component {...pageProps} />
    </Context.Provider>
  );
}
