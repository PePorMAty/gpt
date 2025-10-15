import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";
import type { Middleware } from 'redux';
import gptReducer from "./slices/gpt/gpt-slice";

export const store = configureStore({
  reducer: {
    gpt: gptReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST"],
      },
    }).concat(
      // Логирование действий с явными типами
      ((store) => (next) => (action) => {
        console.log("Dispatching:", action);
        const result = next(action);
        console.log("Next state:", store.getState());
        return result;
      }) as Middleware
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
