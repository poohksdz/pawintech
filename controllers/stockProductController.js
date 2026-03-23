const asyncHandler = require('../middleware/asyncHandler.js')
const db = require('../config/db.js')

// @desc    Get all stock products
// @route   GET /api/stockproducts
// @access  Public
const getStockProducts = asyncHandler(async (req, res) => {
  try {
    const [products] = await db.pool.query(
      'SELECT *, isStarred, lastStarredAt, lastUnstarredAt FROM tbl_product'
    )
    res.status(200).json({ products })
  } catch (error) {
    console.error(`Error fetching products: ${error.message}`)
    res.status(500).json({ message: error.message })
  }
})

// @desc    Get single stock product by ID
// @route   GET /api/stockproducts/:id
// @access  Public
const getStockProductById = asyncHandler(async (req, res) => {
  const { id } = req.params

  try {
    const [product] = await db.pool.query(
      'SELECT *, isStarred, lastStarredAt, lastUnstarredAt FROM tbl_product WHERE id = ?',
      [id]
    )

    if (product.length === 0) {
      res.status(404)
      throw new Error('Product not found')
    }

    res.status(200).json(product[0])
  } catch (error) {
    console.error(`Error fetching product: ${error.message}`)
    res.status(500).json({ message: error.message })
  }
})

// @desc    Create a new stock product
// @route   POST /api/stockproducts
// @access  Private/Stock
const createStockProduct = asyncHandler(async (req, res) => {
  const {
    electotronixPN, manufacturePN, manufacture, description, category,
    subcategory, footprint, price, quantity, position, supplier, img
  } = req.body

  try {
    const [result] = await db.pool.query(
      `INSERT INTO tbl_product 
       (electotronixPN, manufacturePN, manufacture, description, category, subcategory, footprint, price, quantity, position, supplier, img) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [electotronixPN, manufacturePN, manufacture, description, category, subcategory, footprint, price, quantity, position, supplier, img]
    )

    res.status(201).json({ id: result.insertId, ...req.body })
  } catch (error) {
    console.error(`Error creating product: ${error.message}`)
    res.status(500).json({ message: error.message })
  }
})

// @desc    Update a stock product
// @route   PUT /api/stockproducts/:id
// @access  Private/Stock
const updateStockProduct = asyncHandler(async (req, res) => {
  const { id } = req.params
  const {
    electotronixPN, manufacturePN, manufacture, description, category,
    subcategory, footprint, price, quantity, position, supplier, img
  } = req.body

  try {
    await db.pool.query(
      `UPDATE tbl_product SET 
       electotronixPN = ?, manufacturePN = ?, manufacture = ?, description = ?, category = ?, 
       subcategory = ?, footprint = ?, price = ?, quantity = ?, position = ?, supplier = ?, img = ? 
       WHERE id = ?`,
      [electotronixPN, manufacturePN, manufacture, description, category, subcategory, footprint, price, quantity, position, supplier, img, id]
    )

    res.status(200).json({ id, ...req.body })
  } catch (error) {
    console.error(`Error updating product: ${error.message}`)
    res.status(500).json({ message: error.message })
  }
})

// @desc    Delete a stock product
// @route   DELETE /api/stockproducts/:id
// @access  Private/Stock
const deleteStockProduct = asyncHandler(async (req, res) => {
  const { id } = req.params

  try {
    await db.pool.query('DELETE FROM tbl_product WHERE id = ?', [id])
    res.status(200).json({ message: 'Product deleted' })
  } catch (error) {
    console.error(`Error deleting product: ${error.message}`)
    res.status(500).json({ message: error.message })
  }
})

// @desc    Update product quantity
// @route   PUT /api/stockproducts/updateQty/:id
// @access  Private
const updateStockProductQty = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { qty } = req.body

  try {
    await db.pool.query('UPDATE tbl_product SET quantity = quantity - ? WHERE id = ?', [qty, id])
    res.status(200).json({ message: 'Quantity updated' })
  } catch (error) {
    console.error(`Error updating quantity: ${error.message}`)
    res.status(500).json({ message: error.message })
  }
})

// @desc    Update product quantity by Electotronix PN
// @route   PUT /api/stockproducts/updateProductQtyByElectotronixPN/:electotronixPN
// @access  Private
const updateStockProductQtyByElectotronixPN = asyncHandler(async (req, res) => {
  const { electotronixPN } = req.params
  const { qty } = req.body

  try {
    await db.pool.query('UPDATE tbl_product SET quantity = quantity - ? WHERE electotronixPN = ?', [qty, electotronixPN])
    res.status(200).json({ message: 'Quantity updated' })
  } catch (error) {
    console.error(`Error updating updating product: ${error.message}`)
    res.status(500)
    throw new Error('Error updating updating product')
  }
})

// @desc    Toggle star status for a product
// @route   PUT /api/stockproducts/:id/star
// @access  Private/Stock
const toggleStarProduct = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { rating } = req.body
  const userName = req.user?.name || 'Unknown User'

  if (rating !== undefined && (rating < 0 || rating > 5)) {
    res.status(400)
    throw new Error('Rating must be between 0 and 5')
  }

  try {
    const [productRows] = await db.pool.query(
      'SELECT isStarred, starRating FROM tbl_product WHERE id = ?',
      [id]
    )

    if (productRows.length === 0) {
      res.status(404)
      throw new Error('Product not found')
    }

    const currentRating = productRows[0].starRating
    const newRating = rating !== undefined ? rating : (productRows[0].isStarred ? 0 : 5) // Fallback to toggle if no rating provided
    const newStarredStatus = newRating > 0 ? 1 : 0
    const now = new Date()

    let query = ''
    let queryParams = []

    if (newStarredStatus) {
      query = 'UPDATE tbl_product SET isStarred = ?, starRating = ?, lastStarredAt = ?, lastStarredBy = ?, starExpirationAlertSent = FALSE WHERE id = ?'
      queryParams = [newStarredStatus, newRating, now, userName, id]
    } else {
      query = 'UPDATE tbl_product SET isStarred = ?, starRating = ?, lastUnstarredAt = ?, lastUnstarredBy = ?, starExpirationAlertSent = FALSE WHERE id = ?'
      queryParams = [newStarredStatus, newRating, now, userName, id]
    }

    await db.pool.query(query, queryParams)

    res.status(200).json({
      message: newStarredStatus ? `Product rated ${newRating} stars` : 'Product unstarred',
      isStarred: !!newStarredStatus,
      starRating: newRating,
      timestamp: now,
      userName: userName
    })
  } catch (error) {
    console.error(`Error rating product: ${error.message}`)
    res.status(500).json({ message: error.message })
  }
})

module.exports = {
  getStockProducts,
  getStockProductById,
  createStockProduct,
  updateStockProduct,
  deleteStockProduct,
  updateStockProductQty,
  updateStockProductQtyByElectotronixPN,
  toggleStarProduct,
}