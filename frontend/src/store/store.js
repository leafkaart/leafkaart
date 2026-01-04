// store/store.js
import { configureStore } from "@reduxjs/toolkit";
import { authApi } from "./api/authApi";
import { productsApi } from "./api/productsApi";
import { bannersApi } from "./api/bannersApi";
import { notificationApi } from "./api/notificationApi";

import authReducer from "./slices/authSlice";
import productReducer from "./slices/productSlice";
import bannerReducer from "./slices/bannerSlice";
import notificationReducer from "./slices/notificationSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    product: productReducer,
    banner: bannerReducer,
    notification: notificationReducer,

    [authApi.reducerPath]: authApi.reducer,
    [productsApi.reducerPath]: productsApi.reducer,
    [bannersApi.reducerPath]: bannersApi.reducer,
    [notificationApi.reducerPath]: notificationApi.reducer,
  },
  middleware: (getDefault) =>
    getDefault().concat(
      authApi.middleware, 
      productsApi.middleware, 
      bannersApi.middleware,
      notificationApi.middleware
    ),
});

export default store;