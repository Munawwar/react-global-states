import Page from "../components/page";
import { initializeStore } from "../lib/store";

export default function SSR() {
  console.log("ssr.js: Re-render page");
  return <Page />;
}

// The date returned here will be different for every request that hits the page,
// that is because the page becomes a serverless function instead of being statically
// exported when you use `getServerSideProps` or `getInitialProps`
export function getServerSideProps() {
  const store = initializeStore();
  const { updateStates } = store;
  console.log("ssr.js: getServerSideProps() called");

  updateStates({
    light: false,
    lastUpdate: Date.now()
  });

  return {
    props: { initialServerSideState: store.getStates() }
  };
}
