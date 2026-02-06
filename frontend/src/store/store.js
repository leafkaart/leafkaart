// store/store.js
import { configureStore } from "@reduxjs/toolkit";
import { authApi } from "./api/authApi";
import { productsApi } from "./api/productsApi";
import { bannersApi } from "./api/bannersApi";
import { notificationApi } from "./api/notificationApi";
import { ordersApi } from "./api/ordersApi";
import { analyticsApi } from "./api/analyticsApi";

import authReducer from "./slices/authSlice";
import productReducer from "./slices/productSlice";
import bannerReducer from "./slices/bannerSlice";
import notificationReducer from "./slices/notificationSlice";
import orderReducer from "./slices/orderSlice";
import analyticsReducer from "./slices/analyticsSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    product: productReducer,
    banner: bannerReducer,
    notification: notificationReducer,
    order: orderReducer,
    analytics: analyticsReducer,

    [authApi.reducerPath]: authApi.reducer,
    [productsApi.reducerPath]: productsApi.reducer,
    [bannersApi.reducerPath]: bannersApi.reducer,
    [notificationApi.reducerPath]: notificationApi.reducer,
    [ordersApi.reducerPath]: ordersApi.reducer,
    [analyticsApi.reducerPath]: analyticsApi.reducer,
  },
  middleware: (getDefault) =>
    getDefault().concat(
      authApi.middleware, 
      productsApi.middleware, 
      bannersApi.middleware,
      notificationApi.middleware,
      ordersApi.middleware,
      analyticsApi.middleware
    ),
});

export default store;