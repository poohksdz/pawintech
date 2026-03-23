const asyncHandler = require('../middleware/asyncHandler.js')
const db = require('../config/db.js') // ✅ แก้เป็นบรรทัดนี้

// @desc    Get all footprint
// @route   GET /api/Stockfootprint
// @access  Private/Admin
const getStockFootprint = asyncHandler(async (req, res) => {
  try {
    const [rows] = await db.pool.query(
      'SELECT * FROM tbl_footprint ORDER BY `namefootprint` ASC'
    )
    res.status(200).json(rows)
  } catch (error) {
    console.error(`Error fetching footprint: ${error.message}`)
    res.status(500)
    throw new Error('Error fetching footprint')
  }
})

// @desc    Get footprint by ID
// @route   GET /api/Stockfootprint/:id
// @access  Private/Admin
const getStockFootprintDetails = asyncHandler(async (req, res) => {
  const { id } = req.params
  try {
    const [rows] = await db.pool.query(
      'SELECT * FROM tbl_footprint WHERE ID = ?',
      [id]
    )

    if (rows.length === 0) {
      res.status(404)
      throw new Error('Footprint not found')
    }

    res.status(200).json(rows[0])
  } catch (error) {
    console.error(`Error fetching footprint: ${error.message}`)
    res.status(500)
    throw new Error('Error fetching footprint')
  }
})

// @desc    Create a new footprint
// @route   POST /api/Stockfootprint
// @access  Public
const createStockFootprint = asyncHandler(async (req, res) => {
  const { category, namefootprint, createuser } = req.body

  if (!namefootprint) {
    res.status(400)
    throw new Error('Footprint name is required')
  }

  try {
    const query = `INSERT INTO tbl_footprint ( category, namefootprint, createuser) VALUES (?, ?, ?)`
    const [result] = await db.pool.query(query, [
      category,
      namefootprint,
      createuser,
    ])

    const footprintID = String(result.insertId).padStart(4, '0')

    await db.pool.query(
      `UPDATE tbl_footprint SET footprintID = ? WHERE id = ?`,
      [footprintID, result.insertId]
    )

    res.status(201).json({
      message: 'Footprint created successfully',
      footprint: {
        id: result.insertId,
        category,
        footprintID,
        namefootprint,
        createuser,
      },
    })
  } catch (error) {
    console.error(`Error creating footprint: ${error.message}`)
    res.status(500)
    throw new Error('Error creating footprint')
  }
})

// @desc    Update footprint
// @route   PUT /api/Stockfootprint/:id
// @access  Private/Admin
const updateStockFootprint = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { category, namefootprint, createuser } = req.body

  if (!category || !namefootprint) {
    res.status(400)
    throw new Error('Footprint name are required')
  }

  try {
    const [existingFootprint] = await db.pool.query(
      'SELECT * FROM tbl_footprint WHERE ID = ?',
      [id]
    )

    if (existingFootprint.length === 0) {
      res.status(404)
      throw new Error('Footprint not found')
    }

    const query = `
      UPDATE tbl_footprint
      SET category = ?, namefootprint = ?, createuser = ? 
      WHERE ID = ?
    `

    const [result] = await db.pool.query(query, [
      category,
      namefootprint,
      createuser,
      id,
    ])

    if (result.affectedRows === 0) {
      res.status(404)
      throw new Error('No changes made to the footprint')
    }

    res.status(200).json({
      message: 'Footprint updated successfully',
      footprint: {
        id,
        namefootprint,
        category,
        createuser,
      },
    })
  } catch (error) {
    console.error(`Error updating footprint: ${error.message}`)
    res.status(500)
    throw new Error('Error updating footprint')
  }
})

// @desc    Delete footprint
// @route   DELETE /api/Stockfootprint/:id
// @access  Private/Admin
const deleteStockFootprint = asyncHandler(async (req, res) => {
  const { id } = req.params

  try {
    const [existingFootprint] = await db.pool.query(
      'SELECT * FROM tbl_footprint WHERE ID = ?',
      [id]
    )

    if (existingFootprint.length === 0) {
      res.status(404)
      throw new Error('Footprint not found')
    }

    await db.pool.query('DELETE FROM tbl_footprint WHERE ID = ?', [id])

    res.status(200).json({ message: 'Footprint deleted successfully' })
  } catch (error) {
    console.error(`Error deleting footprint: ${error.message}`)
    res.status(500)
    throw new Error('Error deleting footprint')
  }
})

// @desc    Get Footprint by category
// @route   GET /api/StockFootprint?category=category
// @access  Private/Admin
const getStockFootprintByCategory = asyncHandler(async (req, res) => {
  const { category } = req.query

  if (!category) {
    return res.status(400).json({ message: 'Category is required' })
  }

  try {
    // ใช้ db.query ก็ได้
    const [rows] = await db.pool.query(
      'SELECT * FROM tbl_footprint WHERE category = ?',
      [category]
    )

    res.status(200).json(rows)
  } catch (error) {
    console.error(`Error fetching footprint: ${error.message}`)
    res.status(500).json({ message: 'Error fetching footprint' })
  }
})

module.exports = {
  getStockFootprintByCategory,
  createStockFootprint,
  updateStockFootprint,
  deleteStockFootprint,
  getStockFootprint,
  getStockFootprintDetails,
}