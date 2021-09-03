import { useState } from "react";
import Clock from "./clock";
import Counter from "./counter";
import Nav from "./nav";
import { useStore } from "../lib/store";
import useInterval from "../lib/useInterval";
import createId from "../lib/createId";

export default function Page() {
  const [stateId] = useState(createId());
  const { updateStates, getStates } = useStore();
  console.log(
    "page.js: re-render page.js. state context id =",
    stateId,
    "storeId =",
    getStates().storeId
  );

  useInterval(() => {
    updateStates({
      lastUpdate: Date.now(),
      light: true
    });
  }, 1000);

  return (
    <>
      <Nav />
      <Clock />
      <Counter />
    </>
  );
}
