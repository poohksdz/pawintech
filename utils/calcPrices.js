const asyncHandler = require('../middleware/asyncHandler.js')
const { pool } = require('../config/db.js')

function addDecimals(num) {
  return (Math.round(num * 100) / 100).toFixed(2)
}

const calcPrices = async (orderItems) => {
  try {
    // Calculate the items price in whole numbers (pennies) to avoid floating-point issues
    const itemsPrice = orderItems.reduce(
      (acc, item) => acc + (item.price * 100 * item.qty) / 100,
      0
    )

    // Query transportation price
    const [rows] = await pool.query(
      'SELECT transportationPrice FROM transportations LIMIT 1'
    )

    if (rows.length === 0) {
      throw new Error('Transportation price not found')
    }

    const transportationPrice = rows[0].transportationPrice

    // Calculate the shipping price
    const shippingPrice = Number(transportationPrice) || 0

    // Calculate the total price
    const totalPrice = itemsPrice + shippingPrice

    // Return prices as strings fixed to 2 decimal places
    return {
      itemsPrice: addDecimals(itemsPrice),
      shippingPrice: addDecimals(shippingPrice),
      totalPrice: addDecimals(totalPrice),
    }
  } catch (error) {
    console.error(`Error in calcPrices: ${error.message}`)
    throw new Error('Error calculating prices')
  }
}

// Export using CommonJS
module.exports = { calcPrices }

// function addDecimals(num) {
//   return (Math.round(num * 100) / 100).toFixed(2)
// }

// // NOTE: the code below has been changed from the course code to fix an issue
// // with type coercion of strings to numbers.
// // Our addDecimals function expects a number and returns a string, so it is not
// // correct to call it passing a string as the argument.

// function calcPrices(orderItems) {
//   // Calculate the items price in whole number (pennies) to avoid issues with
//   // floating point number calculations
//   const itemsPrice = orderItems.reduce(
//     (acc, item) => acc + (item.price * 100 * item.qty) / 100,
//     0
//   )

//   // Calculate the shipping price
//   const shippingPrice = 70

//   // Calculate the total price
//   const totalPrice = itemsPrice + shippingPrice

//   // return prices as strings fixed to 2 decimal places
//   return {
//     itemsPrice: addDecimals(itemsPrice),
//     shippingPrice: addDecimals(shippingPrice),
//     totalPrice: addDecimals(totalPrice),
//   }
// }

// // Export using CommonJS
// module.exports = { calcPrices }
