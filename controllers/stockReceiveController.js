const asyncHandler = require('../middleware/asyncHandler.js')
const db = require('../config/db.js') // ✅ เรียกใช้ Pool ที่สร้างไว้แล้ว

// @desc    Get all goodsreceipt
// @route   GET /api/Stockgoodsreceipt
// @access  Private/Admin
const getStockGoodsreceipt = asyncHandler(async (req, res) => {
  try {
    // ✅ ใช้ db.query ได้เลย
    const [rows] = await db.pool.query(
      'SELECT `ID`, `grnno`,  DATE_FORMAT(`grndate`, "%d-%m-%Y") AS `grndate`, `grntime`, `grnqty`, `img`, `electotronixPN`, `value`, `category`, `subcategory`, `footprint`, `weight`, `position`, `unitprice`, `manufacture`, `manufacturePN`, `supplier`, `supplierPN`, `moq`, `spq`, `link`, `process`, `description`, `alternative`, `note`, `username` FROM `tbl_goodsreceipt` ORDER BY ID DESC'
    )
    res.status(200).json({ receiptgoods: rows })
  } catch (error) {
    console.error(`Error fetching goodsreceipt: ${error.message}`)
    res.status(500)
    throw new Error('Error fetching goodsreceipt')
  }
})

// @desc    Get goodsreceipt by ID
// @route   GET /api/Stockgoodsreceipt/:id
// @access  Private/Admin
const getStockGoodsreceiptDetails = asyncHandler(async (req, res) => {
  const { id } = req.params
  try {
    const [rows] = await db.pool.query(
      'SELECT `ID`, `grnno`,  DATE_FORMAT(`grndate`, "%d-%m-%Y") AS `grndate`, `grntime`, `grnqty`, `img`, `electotronixPN`, `value`, `category`, `subcategory`, `footprint`, `weight`, `position`, `unitprice`, `manufacture`, `manufacturePN`, `supplier`, `supplierPN`, `moq`, `spq`, `link`, `process`, `description`, `alternative`, `note`, `username` FROM `tbl_goodsreceipt` WHERE ID = ? ORDER BY ID DESC',
      [id]
    )

    if (rows.length === 0) {
      res.status(404)
      throw new Error('Goodsreceipt not found')
    }

    res.status(200).json(rows[0])
  } catch (error) {
    console.error(`Error fetching goodsreceipt: ${error.message}`)
    res.status(500)
    throw new Error('Error fetching goodsreceipt')
  }
})

// @desc    Create new goodsreceipts (bulk insert) + update product qty
// @route   POST /api/Stockgoodsreceipt
// @access  Public
const createStockGoodsreceipt = asyncHandler(async (req, res) => {
  const { items, additionUser, userId } = req.body

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'No items provided' })
  }

  try {
    const grndate = new Date().toISOString().split('T')[0]
    const grntime = new Date().toTimeString().split(' ')[0]

    const today = new Date()
    const dd = String(today.getDate()).padStart(2, '0')
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const yyyy = today.getFullYear()
    const datePrefix = `INC${yyyy}${mm}${dd}`

    const [rows] = await db.pool.query(
      'SELECT grnno FROM tbl_goodsreceipt WHERE grnno LIKE ? ORDER BY grnno DESC LIMIT 1',
      [`${datePrefix}%`]
    )

    let nextIncrement = 1
    if (rows.length > 0) {
      const lastGrn = rows[0].grnno
      const lastIncrement = parseInt(lastGrn.slice(-4), 10)
      nextIncrement = lastIncrement + 1
    }

    const grnno = `${datePrefix}${String(nextIncrement).padStart(4, '0')}`

    const insertGoodsreceiptQuery = `
      INSERT INTO tbl_goodsreceipt
      (grnno, grndate, grntime, grnqty, img, electotronixPN, value, category, subcategory,
       footprint, weight, position, unitprice, manufacture, manufacturePN, supplier, supplierPN,
       moq, spq, link, process, description, alternative, note, username, product_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `

    const updateProductQtyQuery = `
      UPDATE tbl_product
      SET quantity = quantity + ?
      WHERE ID = ?
    `

    const results = []

    for (const item of items) {
      // 1. Fetch product info from tbl_product
      const [productRows] = await db.pool.query(
        'SELECT * FROM tbl_product WHERE ID = ?',
        [item.ID]
      )

      if (productRows.length === 0) continue // skip if product not found

      const product = productRows[0]

      // 2. Insert goodsreceipt using product data
      const [result] = await db.pool.query(insertGoodsreceiptQuery, [
        grnno,
        grndate,
        grntime,
        item.additionqty || 0,
        product.img || '',
        product.electotronixPN || '',
        product.value || '',
        product.category || '',
        product.subcategory || '',
        product.footprint || '',
        product.weight || '',
        product.position || '',
        product.price || '',
        product.manufacture || '',
        product.manufacturePN || '',
        product.supplier || '',
        product.supplierPN || '',
        product.moq || '',
        product.spq || '',
        product.link || '',
        product.process || '',
        product.description || '',
        product.alternative || '',
        product.note || '',
        additionUser || item.username || '',
        product.ID,
      ])

      // 3. Update product quantity
      if (item.ID && item.additionqty) {
        await db.pool.query(updateProductQtyQuery, [
          item.additionqty,
          item.ID,
        ])
      }

      results.push({
        insertedId: result.insertId,
        productId: product.ID,
        qtyAdded: item.additionqty,
      })
    }

    res.status(201).json({
      message: 'Goodsreceipts created & product stock updated successfully',
      count: results.length,
      results,
    })
  } catch (error) {
    console.error(`Error creating goodsreceipts: ${error.message}`)
    res.status(500).json({
      error: 'Error creating goodsreceipts',
      detail: error.message,
    })
  }
})

// @desc    Update goodsreceipt
// @route   PUT /api/Stockgoodsreceipt/:id
// @access  Private/Admin
const updateStockGoodsreceipt = asyncHandler(async (req, res) => {
  const { id } = req.params
  const {
    grnno, grndate, grntime, grnqty, electotronixPN, value, footprint, category,
    subcategory, description, position, supplierPN, supplier, manufacturePN,
    manufacture, weight, unitprice, moq, spq, link, alternative, process,
    note, img, username,
  } = req.body

  if (!grnno || !grndate) {
    res.status(400)
    throw new Error('Goodsreceipt are required')
  }

  try {
    const [existingGoodsreceipt] = await db.pool.query(
      'SELECT * FROM tbl_goodsreceipt WHERE ID = ?',
      [id]
    )

    if (existingGoodsreceipt.length === 0) {
      res.status(404)
      throw new Error('Goodsreceipt not found')
    }

    const query = `
      UPDATE tbl_goodsreceipt
      SET grnno = ?, grndate = ?, grntime = ?, grnqty = ?, electotronixPN = ?, value = ?, footprint = ?, category = ?, subcategory = ?, description = ?, position = ?, supplierPN = ?, supplier = ?, manufacturePN = ?, manufacture = ?, weight = ?, unitprice = ?, moq = ?, spq = ?, link = ?, alternative = ?, process = ?, note = ?, img = ?, username = ?
      WHERE ID = ?
    `

    const [result] = await db.pool.query(query, [
      grnno, grndate, grntime, grnqty, electotronixPN, value, footprint, category,
      subcategory, description, position, supplierPN, supplier, manufacturePN,
      manufacture, weight, unitprice, moq, spq, link, alternative, process,
      note, img, username, id,
    ])

    if (result.affectedRows === 0) {
      res.status(404)
      throw new Error('No changes made to the goodsreceipt')
    }

    res.status(200).json({
      message: 'Goodsreceipt updated successfully',
      goodsreceipt: {
        id, grnno, grndate, grntime, grnqty, electotronixPN, value, footprint,
        category, subcategory, description, position, supplierPN, supplier,
        manufacturePN, manufacture, weight, unitprice, moq, spq, link,
        alternative, process, note, img, username,
      },
    })
  } catch (error) {
    console.error(`Error updating goodsreceipt: ${error.message}`)
    res.status(500)
    throw new Error('Error updating goodsreceipt')
  }
})

// @desc    Delete goodsreceipt
// @route   DELETE /api/Stockgoodsreceipt/:id
// @access  Private/Admin
const deleteStockGoodsreceipt = asyncHandler(async (req, res) => {
  const { id } = req.params

  try {
    const [existingGoodsreceipt] = await db.pool.query(
      'SELECT * FROM tbl_goodsreceipt WHERE ID = ?',
      [id]
    )

    if (existingGoodsreceipt.length === 0) {
      res.status(404)
      throw new Error('Goodsreceipt not found')
    }

    await db.pool.query('DELETE FROM tbl_goodsreceipt WHERE ID = ?', [id])

    res.status(200).json({ message: 'Goodsreceipt deleted successfully' })
  } catch (error) {
    console.error(`Error deleting goodsreceipt: ${error.message}`)
    res.status(500)
    throw new Error('Error deleting goodsreceipt')
  }
})

module.exports = {
  createStockGoodsreceipt,
  updateStockGoodsreceipt,
  deleteStockGoodsreceipt,
  getStockGoodsreceipt,
  getStockGoodsreceiptDetails,
}