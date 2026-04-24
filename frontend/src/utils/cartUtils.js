export const addDecimals = (num) => {
  return (Math.round(num * 100) / 100).toFixed(2);
};

// NOTE: the code below has been changed from the course code to fix an issue
// with type coercion of strings to numbers.
// Our addDecimals function expects a number and returns a string, so it is not
// correct to call it passing a string as the argument.

// Helper: รวมรายการสินค้าที่ซ้ำกัน (บวก quantity เข้าด้วยกัน)
// Support both _id and product_id as keys
export const mergeCartItems = (items) => {
  const map = {};
  items.forEach((item) => {
    // ใช้ _id หรือ product_id เป็น key (ถ้าไม่มีทั้งคู่ใช้ index)
    const key = item._id || item.product_id || `item_${Math.random().toString(36).substr(2, 9)}`;

    if (!map[key]) {
      map[key] = { ...item };
      // ตรวจสอบว่ามี _id หรือไม่ ถ้าไม่มีให้เพิ่มจาก key
      if (!map[key]._id) {
        map[key]._id = key;
      }
    } else {
      // บวก quantity เข้าด้วยกัน (ไม่ใช่ max)
      map[key].qty = (map[key].qty || 0) + (item.qty || 0);
      // ถ้ารายการใหม่มีข้อมูลใหม่กว่า ให้อัพเดต
      if (item.name) map[key].name = item.name;
      if (item.image) map[key].image = item.image;
      if (item.price) map[key].price = item.price;
    }
  });
  return Object.values(map);
};

export const updateCart = (state) => {
  // Merge duplicate items first (fix bug: same product shown multiple times)
  state.cartItems = mergeCartItems(state.cartItems);

  // FIX: Normalize isSelected to always be a boolean (true/false) after merge
  state.cartItems = state.cartItems.map((item) => ({
    ...item,
    isSelected: item.isSelected !== false, // undefined/null -> true (default selected), false -> false
  }));

  // Calculate the items price - ONLY for selected items
  const selectedForCalc = state.cartItems.filter(item => item.isSelected === true);
  const itemsPrice = selectedForCalc.reduce(
    (acc, item) => {
      return acc + (item.price * 100 * item.qty) / 100;
    },
    0,
  );

  console.log("[updateCart] Selected items for price calc:", selectedForCalc.length, "of", state.cartItems.length, "items");
  console.log("[updateCart] itemsPrice:", itemsPrice);

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
