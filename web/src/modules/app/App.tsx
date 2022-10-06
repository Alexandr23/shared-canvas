import React from "react";

import { useStore } from "../store";
import { Layout } from "../layout";
import { Header } from "../header";
import { Footer } from "../footer";
import { Canvas } from "../canvas";
import { useLineHandlers } from "../line";

export const App = () => {
  useLineHandlers();

  const init = useStore((state) => state.init);

  React.useEffect(() => {
    init();
  }, []);

  return (
    <div className="App">
      <Layout header={<Header />} body={<Canvas />} footer={<Footer />} />
    </div>
  );
};
