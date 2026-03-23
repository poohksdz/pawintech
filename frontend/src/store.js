import { configureStore } from '@reduxjs/toolkit'
import { apiSlice } from './slices/apiSlice'
import cartSliceReducer from './slices/cartSlice'
import stockCartReducer from './slices/stockCartApiSlice'
import additionStockCartReducer from './slices/stockAdditionApiSlice'
import stockIssueCartReducer from './slices/stockIssueCartApiSlice'
import pcbCartReducer from './slices/pcbCartSlice'
import authReducer from './slices/authSlice'
import languageReducer from './slices/languageSlice'
import notificationsReducer from './notificationSlice'

const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    cart: cartSliceReducer,
    stockcart: stockCartReducer,
    additionstockcart: additionStockCartReducer,
    stockissuecart: stockIssueCartReducer,
    pcbcart: pcbCartReducer,
    auth: authReducer,
    language: languageReducer,
    notifications: notificationsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
  devTools: true,
})

export default store
