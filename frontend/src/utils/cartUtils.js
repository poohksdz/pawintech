export const addDecimals = (num) => {
  return (Math.round(num * 100) / 100).toFixed(2)
}

// NOTE: the code below has been changed from the course code to fix an issue
// with type coercion of strings to numbers.
// Our addDecimals function expects a number and returns a string, so it is not
// correct to call it passing a string as the argument.

// 导出一个函数，用于更新购物车
export const updateCart = (state) => {
  // Calculate the items price in whole number (pennies) to avoid issues with
  // floating point number calculations
  const itemsPrice = state.cartItems.reduce(
    (acc, item) => acc + (item.price * 100 * item.qty) / 100,
    0
  )
  state.itemsPrice = addDecimals(itemsPrice)

  // Calculate the shipping price
  // const shippingPrice = itemsPrice > 100 ? 0 : 10;
  const shippingPrice = 70
  state.shippingPrice = addDecimals(shippingPrice)

  // Calculate the tax price
  // const taxPrice = 0.15 * itemsPrice;
  // state.taxPrice = addDecimals(taxPrice);

  // const totalPrice = itemsPrice + shippingPrice + taxPrice;
  const totalPrice = itemsPrice * 0.07 + itemsPrice + shippingPrice
  // Calculate the total price
  state.totalPrice = addDecimals(totalPrice)

  const vatPrice = itemsPrice * 0.07
  // Calculate the vat price
  state.vatPrice = addDecimals(vatPrice)

  // Save the cart to localStorage
  localStorage.setItem('cart', JSON.stringify(state))

  return state
}
