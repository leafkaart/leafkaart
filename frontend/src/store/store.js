import { configureStore } from "@reduxjs/toolkit";
import { authApi } from "./api/authApi";
import { productsApi } from "./api/productsApi";
import { notificationApi } from "./api/notificationApi";

import authReducer from "./slices/authSlice";
import productReducer from "./slices/productSlice";
import notificationReducer from "./slices/notificationSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    product: productReducer,
    notification: notificationReducer,

    [authApi.reducerPath]: authApi.reducer,
    [productsApi.reducerPath]: productsApi.reducer,
    [notificationApi.reducerPath]: notificationApi.reducer,
  },
  middleware: (getDefault) =>
    getDefault().concat(authApi.middleware, productsApi.middleware, notificationApi.middleware),
});