"use client"
import { configureStore } from "@reduxjs/toolkit"
import { useDispatch, useSelector, type TypedUseSelectorHook, Provider } from "react-redux"
import authReducer from "./auth/slice"

export const makeStore = () => {
  return configureStore({
    reducer: {
      auth: authReducer,
    },
    middleware: (getDefault) => getDefault(),
    devTools: process.env.NODE_ENV !== "production",
  })
}

export type AppStore = ReturnType<typeof makeStore>
export type RootState = ReturnType<AppStore["getState"]>
export type AppDispatch = AppStore["dispatch"]

export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
