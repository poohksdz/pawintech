const asyncHandler = require('../middleware/asyncHandler.js')
const db = require('../config/db.js') // ✅ เรียกใช้ Pool ที่สร้างไว้แล้ว

// @desc    Create a new category
// @route   POST /api/categories
// @access  Public
const createCategory = asyncHandler(async (req, res) => {
  const { categoryName, categoryNameThai, categoryShortName } = req.body

  // Validate input data
  if (!categoryName || !categoryShortName) {
    res.status(400)
    throw new Error('Category name and short name are required')
  }

  try {
    // Insert the new category into the database
    const query = `
      INSERT INTO categories (categoryName, categoryNameThai, categoryShortName, createdAt, updatedAt)
      VALUES (?, ?, ?, NOW(), NOW())
    `
    const [result] = await db.pool.query(query, [
      categoryName,
      categoryNameThai,
      categoryShortName,
    ])

    res.status(201).json({
      message: 'Category created successfully',
      category: {
        id: result.insertId,
        categoryName,
        categoryNameThai,
        categoryShortName,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })
  } catch (error) {
    console.error(`Error creating category: ${error.message}`)
    res.status(500)
    throw new Error('Error creating category')
  }
})

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private/Admin
const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { categoryName, categoryNameThai, categoryShortName } = req.body

  // Validate input data
  if (!categoryName || !categoryShortName) {
    res.status(400)
    throw new Error('Category name and short name are required')
  }

  try {
    // Check if the category exists
    const [existingCategory] = await db.pool.query(
      'SELECT * FROM categories WHERE _id = ?',
      [id]
    )

    if (existingCategory.length === 0) {
      res.status(404)
      throw new Error('Category not found')
    }

    // Prepare the update query
    const query = `
      UPDATE categories
      SET categoryName = ?, categoryNameThai = ?, categoryShortName = ?, updatedAt = NOW()
      WHERE _id = ?
    `

    const [result] = await db.pool.query(query, [
      categoryName,
      categoryNameThai,
      categoryShortName,
      id,
    ])

    if (result.affectedRows === 0) {
      res.status(404)
      throw new Error('No changes made to the category')
    }

    res.status(200).json({
      message: 'Category updated successfully',
      category: {
        id,
        categoryName,
        categoryNameThai,
        categoryShortName,
        updatedAt: new Date(),
      },
    })
  } catch (error) {
    console.error(`Error updating category: ${error.message}`)
    res.status(500)
    throw new Error('Error updating category')
  }
})

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params

  try {
    // Check if the category exists
    const [existingCategory] = await db.pool.query(
      'SELECT * FROM categories WHERE _id = ?',
      [id]
    )

    if (existingCategory.length === 0) {
      res.status(404)
      throw new Error('Category not found')
    }

    // Delete the category
    await db.pool.query('DELETE FROM categories WHERE _id = ?', [id])

    res.status(200).json({ message: 'Category deleted successfully' })
  } catch (error) {
    console.error(`Error deleting category: ${error.message}`)
    res.status(500)
    throw new Error('Error deleting category')
  }
})

// @desc    Get all categories
// @route   GET /api/categories
// @access  Private/Admin
const getCategories = asyncHandler(async (req, res) => {
  try {
    // Query to fetch all categories
    const [rows] = await db.pool.query('SELECT * FROM categories')
    res.status(200).json(rows) // Send the results as a JSON response
  } catch (error) {
    console.error(`Error fetching categories: ${error.message}`)
    res.status(500)
    throw new Error('Error fetching categories')
  }
})

// @desc    Get category by ID
// @route   GET /api/categories/:id
// @access  Private/Admin
const getCategoryDetails = asyncHandler(async (req, res) => {
  const { id } = req.params
  try {
    // Query to fetch the category by id
    const [rows] = await db.pool.query(
      'SELECT * FROM categories WHERE _id = ?',
      [id]
    )

    if (rows.length === 0) {
      res.status(404)
      throw new Error('Category not found')
    }

    res.status(200).json(rows[0]) // Send the category data
  } catch (error) {
    console.error(`Error fetching category: ${error.message}`)
    res.status(500)
    throw new Error('Error fetching category')
  }
})

module.exports = {
  createCategory,
  updateCategory,
  deleteCategory,
  getCategories,
  getCategoryDetails,
}