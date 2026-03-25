"use client";

import { Provider } from "react-redux";
import { store } from "@/lib/store";
import { NotificationProvider } from "@/context/NotificationContext";

interface Props {
  children: React.ReactNode;
}

const ReduxProvider: React.FC<Props> = ({ children }) => {
  return (
    <Provider store={store}>
      <NotificationProvider>{children}</NotificationProvider>
    </Provider>
  );
};

export default ReduxProvider;
