"use client";

import { Provider } from "react-redux";
import { store } from "@/lib/store";
import { NotificationProvider } from "@/context/NotificationContext";
import SessionGuard from "@/components/SessionGuard";

interface Props {
  children: React.ReactNode;
}

const ReduxProvider: React.FC<Props> = ({ children }) => {
  return (
    <Provider store={store}>
      <NotificationProvider>
        <SessionGuard />
        {children}
      </NotificationProvider>
    </Provider>
  );
};

export default ReduxProvider;
