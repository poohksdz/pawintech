const asyncHandler = require('../middleware/asyncHandler.js')
const db = require('../config/db.js') // ✅ แก้เป็นบรรทัดนี้

// @desc    Get all categories
// @route   GET /api/Stockcategories
// @access  Private/Admin
const getStockCategories = asyncHandler(async (req, res) => {
  try {
    const [rows] = await db.pool.query(
      'SELECT  `ID`, `categoryid`, `category`, `createuser` FROM tbl_category ORDER BY `category` ASC'
    )
    res.status(200).json(rows)
  } catch (error) {
    console.error(`Error fetching categories: ${error.message}`)
    res.status(500)
    throw new Error('Error fetching categories')
  }
})

// @desc    Get category by ID
// @route   GET /api/Stockcategories/:id
// @access  Private/Admin
const getStockCategoryDetails = asyncHandler(async (req, res) => {
  const { id } = req.params
  try {
    const [rows] = await db.pool.query(
      'SELECT  `ID`, `categoryid`, `category`, `createuser` FROM tbl_category WHERE ID = ?',
      [id]
    )

    if (rows.length === 0) {
      res.status(404)
      throw new Error('Category not found')
    }

    res.status(200).json(rows[0])
  } catch (error) {
    console.error(`Error fetching category: ${error.message}`)
    res.status(500)
    throw new Error('Error fetching category')
  }
})

// @desc    Create a new category
// @route   POST /api/Stockcategories
// @access  Public
const createStockCategory = asyncHandler(async (req, res) => {
  const { category, createuser } = req.body

  if (!category || !createuser) {
    res.status(400)
    throw new Error('Category name or create name are required')
  }

  try {
    const query = `INSERT INTO tbl_category (category, createuser) VALUES (?, ?)`
    const [result] = await db.pool.query(query, [category, createuser])

    const categoryid = String(result.insertId).padStart(4, '0')

    await db.pool.query(
      `UPDATE tbl_category SET categoryid = ? WHERE id = ?`,
      [categoryid, result.insertId]
    )

    res.status(201).json({
      message: 'Category created successfully',
      category: {
        id: result.insertId,
        categoryid,
        category,
        createuser,
      },
    })
  } catch (error) {
    console.error(`Error creating category: ${error.message}`)
    res.status(500)
    throw new Error('Error creating category')
  }
})

// @desc    Update category
// @route   PUT /api/Stockcategories/:id
// @access  Private/Admin
const updateStockCategory = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { category, createuser } = req.body

  if (!category || !createuser) {
    res.status(400)
    throw new Error('Category name or create name are required')
  }

  try {
    const [existingCategory] = await db.pool.query(
      'SELECT * FROM tbl_category WHERE ID = ?',
      [id]
    )

    if (existingCategory.length === 0) {
      res.status(404)
      throw new Error('Category not found')
    }

    const query = `
      UPDATE tbl_category
      SET category = ?, createuser = ? 
      WHERE ID = ?
    `

    const [result] = await db.pool.query(query, [category, createuser, id])

    if (result.affectedRows === 0) {
      res.status(404)
      throw new Error('No changes made to the category')
    }

    res.status(200).json({
      message: 'Category updated successfully',
      category: {
        id,
        category,
        createuser,
      },
    })
  } catch (error) {
    console.error(`Error updating category: ${error.message}`)
    res.status(500)
    throw new Error('Error updating category')
  }
})

// @desc    Delete category
// @route   DELETE /api/Stockcategories/:id
// @access  Private/Admin
const deleteStockCategory = asyncHandler(async (req, res) => {
  const { id } = req.params

  try {
    const [existingCategory] = await db.pool.query(
      'SELECT * FROM tbl_category WHERE ID = ?',
      [id]
    )

    if (existingCategory.length === 0) {
      res.status(404)
      throw new Error('Category not found')
    }

    await db.pool.query('DELETE FROM tbl_category WHERE ID = ?', [id])

    res.status(200).json({ message: 'Category deleted successfully' })
  } catch (error) {
    console.error(`Error deleting category: ${error.message}`)
    res.status(500)
    throw new Error('Error deleting category')
  }
})

module.exports = {
  createStockCategory,
  updateStockCategory,
  deleteStockCategory,
  getStockCategories,
  getStockCategoryDetails,
}