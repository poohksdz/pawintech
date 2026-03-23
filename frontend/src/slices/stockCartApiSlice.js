import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  stockcartItems: localStorage.getItem('stockcart')
    ? JSON.parse(localStorage.getItem('stockcart'))
    : [],
}

const stockCartApiSlice = createSlice({
  name: 'stockcart',
  initialState,
  reducers: {
    addToStockCart: (state, action) => {
      const { user, ...item } = action.payload
      const existItem = state.stockcartItems.find(
        (x) => x._id === item._id.toString()
      )

      if (existItem) {
        state.stockcartItems = state.stockcartItems.map((x) =>
          x._id === existItem._id ? item : x
        )
      } else {
        state.stockcartItems.push(item)
      }

      localStorage.setItem('stockcart', JSON.stringify(state.stockcartItems))
    },

    removeStockFromCart: (state, action) => {
      state.stockcartItems = state.stockcartItems.filter(
        (x) => x._id !== action.payload
      )
      localStorage.setItem('stockcart', JSON.stringify(state.stockcartItems))
    },

    clearStockCartItems: (state) => {
      state.stockcartItems = []
      localStorage.setItem('stockcart', JSON.stringify([]))
    },

    resetStockCart: (state) => {
      state.stockcartItems = initialState.stockcartItems
      localStorage.setItem('stockcart', JSON.stringify(state.stockcartItems))
    },
  },
})

export const {
  addToStockCart,
  removeStockFromCart,
  clearStockCartItems,
  resetStockCart,
} = stockCartApiSlice.actions

export default stockCartApiSlice.reducer
