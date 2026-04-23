export const addDecimals = (num) => {
  return (Math.round(num * 100) / 100).toFixed(2);
};

// NOTE: the code below has been changed from the course code to fix an issue
// with type coercion of strings to numbers.
// Our addDecimals function expects a number and returns a string, so it is not
// correct to call it passing a string as the argument.

// 导出一个函数，用于更新购物车
// Helper: merge duplicate items by _id (take latest qty)
// Export for use in cartSlice
export const mergeCartItems = (items) => {
  const map = {};
  items.forEach((item) => {
    if (!map[item._id]) {
      map[item._id] = { ...item };
    } else {
      // Keep the larger qty if duplicate
      map[item._id].qty = Math.max(map[item._id].qty || 0, item.qty || 0);
    }
  });
  return Object.values(map);
};

export const updateCart = (state) => {
  // Merge duplicate items first (fix bug: same product shown multiple times)
  state.cartItems = mergeCartItems(state.cartItems);

  // Calculate the items price - ONLY for selected items
  const itemsPrice = state.cartItems.reduce(
    (acc, item) => {
      // FIX BUG: Only count items where isSelected is EXPLICITLY true
      if (item.isSelected === true) {
        return acc + (item.price * 100 * item.qty) / 100;
      }
      return acc;
    },
    0,
  );
  state.itemsPrice = addDecimals(itemsPrice);

  // Calculate the shipping price
  const shippingPrice = state.receivePlace === "atcompany" ? 0 : 70;
  state.shippingPrice = addDecimals(shippingPrice);

  // Calculate the vat price
  const vatPrice = itemsPrice * 0.07;
  state.vatPrice = addDecimals(vatPrice);

  // Calculate the total price
  const totalPrice = itemsPrice * 1.07 + shippingPrice;
  state.totalPrice = addDecimals(totalPrice);

  // Save the cart to localStorage
  localStorage.setItem("cart", JSON.stringify(state));

  return state;
};
