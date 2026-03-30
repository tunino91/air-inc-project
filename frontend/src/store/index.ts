"use client";

import { configureStore } from "@reduxjs/toolkit";
import uiReducer from "./uiSlice";

export const store = configureStore({
  reducer: {
    // Redux only owns client-side UI state in this app.
    ui: uiReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
