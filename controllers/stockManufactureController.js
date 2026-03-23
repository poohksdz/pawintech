const asyncHandler = require('../middleware/asyncHandler.js')
const db = require('../config/db.js') // ✅ แก้เป็นบรรทัดนี้

// @desc    Get all manufacture
// @route   GET /api/Stockmanufacture
// @access  Private/Admin
const getStockManufacture = asyncHandler(async (req, res) => {
  try {
    // ✅ ใช้ db.query ได้เลย (ลบ connectToDatabase ทิ้ง)
    const [rows] = await db.pool.query(
      'SELECT * FROM tbl_manufacture ORDER BY `namemanufacture` ASC'
    )
    res.status(200).json(rows)
  } catch (error) {
    console.error(`Error fetching manufacture: ${error.message}`)
    res.status(500)
    throw new Error('Error fetching manufacture')
  }
})

// @desc    Get manufacture by ID
// @route   GET /api/Stockmanufacture/:id
// @access  Private/Admin
const getStockManufactureDetails = asyncHandler(async (req, res) => {
  const { id } = req.params
  try {
    const [rows] = await db.pool.query(
      'SELECT * FROM tbl_manufacture WHERE ID = ?',
      [id]
    )

    if (rows.length === 0) {
      res.status(404)
      throw new Error('Manufacture not found')
    }

    res.status(200).json(rows[0])
  } catch (error) {
    console.error(`Error fetching manufacture: ${error.message}`)
    res.status(500)
    throw new Error('Error fetching manufacture')
  }
})

// @desc    Create a new manufacture
// @route   POST /api/Stockmanufacture
// @access  Public
const createStockManufacture = asyncHandler(async (req, res) => {
  const { namemanufacture, createuser } = req.body

  if (!namemanufacture) {
    res.status(400)
    throw new Error('Manufacture name is required')
  }

  try {
    const query = `
      INSERT INTO tbl_manufacture (namemanufacture, createuser)
      VALUES (?, ?)
    `
    const [result] = await db.pool.query(query, [
      namemanufacture,
      createuser,
    ])

    const manufactureID = String(result.insertId).padStart(4, '0')

    await db.pool.query(
      `UPDATE tbl_manufacture SET manufactureID = ? WHERE id = ?`,
      [manufactureID, result.insertId]
    )

    res.status(201).json({
      message: 'Manufacture created successfully',
      manufacture: {
        id: result.insertId,
        manufactureID,
        namemanufacture,
        createuser,
      },
    })
  } catch (error) {
    console.error(`Error creating manufacture: ${error.message}`)
    res.status(500)
    throw new Error('Error creating manufacture')
  }
})

// @desc    Update manufacture
// @route   PUT /api/Stockmanufacture/:id
// @access  Private/Admin
const updateStockManufacture = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { namemanufacture, createuser } = req.body

  if (!namemanufacture) {
    res.status(400)
    throw new Error('Manufacture name are required')
  }

  try {
    const [existingManufacture] = await db.pool.query(
      'SELECT * FROM tbl_manufacture WHERE ID = ?',
      [id]
    )

    if (existingManufacture.length === 0) {
      res.status(404)
      throw new Error('Manufacture not found')
    }

    const query = `
      UPDATE tbl_manufacture
      SET  namemanufacture = ?, createuser = ? 
      WHERE ID = ?
    `

    const [result] = await db.pool.query(query, [
      namemanufacture,
      createuser,
      id,
    ])

    if (result.affectedRows === 0) {
      res.status(404)
      throw new Error('No changes made to the manufacture')
    }

    res.status(200).json({
      message: 'Manufacture updated successfully',
      manufacture: {
        id,
        namemanufacture,
        createuser,
      },
    })
  } catch (error) {
    console.error(`Error updating manufacture: ${error.message}`)
    res.status(500)
    throw new Error('Error updating manufacture')
  }
})

// @desc    Delete manufacture
// @route   DELETE /api/Stockmanufacture/:id
// @access  Private/Admin
const deleteStockManufacture = asyncHandler(async (req, res) => {
  const { id } = req.params

  try {
    const [existingManufacture] = await db.pool.query(
      'SELECT * FROM tbl_manufacture WHERE ID = ?',
      [id]
    )

    if (existingManufacture.length === 0) {
      res.status(404)
      throw new Error('Manufacture not found')
    }

    await db.pool.query('DELETE FROM tbl_manufacture WHERE ID = ?', [id])

    res.status(200).json({ message: 'Manufacture deleted successfully' })
  } catch (error) {
    console.error(`Error deleting manufacture: ${error.message}`)
    res.status(500)
    throw new Error('Error deleting manufacture')
  }
})

module.exports = {
  createStockManufacture,
  updateStockManufacture,
  deleteStockManufacture,
  getStockManufacture,
  getStockManufactureDetails,
}