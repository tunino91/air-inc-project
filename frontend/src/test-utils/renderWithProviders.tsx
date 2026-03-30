"use client";

import { PropsWithChildren } from "react";
import { configureStore } from "@reduxjs/toolkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import uiReducer from "@/store/uiSlice";

const defaultUiState = uiReducer(undefined, { type: "@@INIT" });

export const createTestStore = (preloadedUiState?: Partial<typeof defaultUiState>) =>
  configureStore({
    reducer: {
      ui: uiReducer,
    },
    preloadedState: {
      ui: {
        ...defaultUiState,
        ...preloadedUiState,
      },
    },
  });

export const renderWithProviders = (
  ui: React.ReactElement,
  {
    preloadedUiState,
  }: {
    preloadedUiState?: Partial<typeof defaultUiState>;
  } = {}
) => {
  const store = createTestStore(preloadedUiState);
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const Wrapper = ({ children }: PropsWithChildren) => (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </Provider>
  );

  return {
    store,
    queryClient,
    ...render(ui, { wrapper: Wrapper }),
  };
};
