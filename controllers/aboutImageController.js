const asyncHandler = require('../middleware/asyncHandler.js')
const db = require('../config/db.js')
const deleteFile = require('../utils/fileUtils')
// const { connection } = require('../config/db.js')

// @desc    Fetch all aboutimages
// @route   GET /api/aboutimages
// @access  Public
const getAboutImages = asyncHandler(async (req, res) => {
  try {
    // Connect to the database


    // Query to fetch all aboutimages
    const [rows] = await db.pool.query('SELECT * FROM aboutimages')
    res.status(200).json({ aboutimages: rows }) // Send the results as a JSON response
  } catch (error) {
    console.error(`Error fetching about images: ${error.message}`)
    res.status(500)
    throw new Error('Error fetching about images')
  }
})

// @desc    Fetch single aboutimage
// @route   GET /api/aboutimages/:id
// @access  Public
const getAboutImageById = asyncHandler(async (req, res) => {
  const { ID } = req.params
  try {
    // Connect to the database


    // Query to fetch the aboutimage by ID
    const [rows] = await db.pool.query(
      'SELECT * FROM aboutimages WHERE ID = ?',
      [ID]
    )

    if (rows.length === 0) {
      res.status(404)
      throw new Error('About image not found')
    }

    res.status(200).json(rows[0]) // Send the aboutimage data
  } catch (error) {
    console.error(`Error fetching about image: ${error.message}`)
    res.status(500)
    throw new Error('Error fetching about image')
  }
})

// @desc    Create a aboutimage
// @route   POST /api/aboutimages
// @access  Private/Admin
const createAboutImage = asyncHandler(async (req, res) => {
  const { title, images } = req.body

  // Validate input data
  if (!images) {
    res.status(400)
    throw new Error('Title and images are required')
  }

  try {
    // Connect to the database


    // Prepare the query with a default `NOW()` for the `created_at` field
    const query = `
      INSERT INTO aboutimages (title, images)
      VALUES (?, ?)
    `

    const [result] = await db.pool.query(query, [title, images])

    // Log result to verify successful insertion
    // console.log(result)

    // Send a successful response with the aboutimage data
    res.status(201).json({
      message: 'About image created successfully',
      aboutimage: {
        ID: result.insertId,
        title,
        images,
      },
    })
  } catch (error) {
    console.error(`Error creating about image: ${error.message}`)
    res.status(500)
    throw new Error('Error creating about image')
  }
})

// @desc    Update a aboutimage
// @route   PUT /api/aboutimages/:id
// @access  Private/Admin
const updateAboutImage = asyncHandler(async (req, res) => {
  // const { ID } = req.params
  const { ID, title, images } = req.body

  // ValIDate input data
  if (!images) {
    res.status(400).json({ message: 'Images are required' })
    return
  }

  try {
    // Connect to the database


    // Check if the aboutimage exists
    const [existingaboutimage] = await db.pool.query(
      'SELECT * FROM aboutimages WHERE ID = ?',
      [ID]
    )

    if (existingaboutimage.length === 0) {
      res.status(404).json({ message: 'About image not found' })
      return
    }

    // Prepare the update query
    const query = `
      UPDATE aboutimages
      SET title = ?, images = ? 
      WHERE ID = ?
    `

    const [result] = await db.pool.query(query, [title, images, ID])

    if (result.affectedRows === 0) {
      res.status(400).json({ message: 'No changes made to the about image' })
      return
    }

    res.status(200).json({
      message: 'About image updated successfully',
      aboutimage: {
        ID,
        title,
        images,
      },
    })
  } catch (error) {
    console.error(`Error updating aboutimage: ${error.message}`)
    res.status(500).json({ message: 'Error updating about image' })
  }
})

// @desc    Delete a aboutimage
// @route   DELETE /api/aboutimages/:id
// @access  Private/Admin
const deleteAboutImage = asyncHandler(async (req, res) => {
  const { ID } = req.params

  try {
    // Connect to the database


    // Check if the aboutimage exists
    const [existingaboutimage] = await db.pool.query(
      'SELECT * FROM aboutimages WHERE ID = ?',
      [ID]
    )

    if (existingaboutimage.length === 0) {
      res.status(404)
      throw new Error('About image not found')
    }

    // ✅ ลบไฟล์ภาพออกจากเครื่อง
    try {
      const imagesArr = JSON.parse(existingaboutimage[0].images)
      if (Array.isArray(imagesArr)) {
        imagesArr.forEach(img => deleteFile(img.image))
      }
    } catch (e) {
      console.error('Error parsing images for deletion:', e.message)
    }

    // Delete the aboutimage
    await db.pool.query('DELETE FROM aboutimages WHERE ID = ?', [ID])

    res.status(200).json({ message: 'about image deleted successfully' })
  } catch (error) {
    console.error(`Error deleting about image: ${error.message}`)
    res.status(500)
    throw new Error('Error deleting about image')
  }
})

// @desc    Update showFront aboutimage
// @route   PUT /api/aboutimages/:ID/showfront
// @access  Private/Admin
const updateShowFrontAboutImage = asyncHandler(async (req, res) => {
  // const { } = req.params
  const { ID, showFront } = req.body

  // console.log(ID, showFront)

  try {
    // Connect to the database


    // Find the aboutimage by its ID
    const [aboutimage] = await db.pool.query(
      'SELECT * FROM aboutimages WHERE ID = ?',
      [ID]
    )

    if (aboutimage.length === 0) {
      res.status(404)
      throw new Error('About image not found')
    }

    // Query to update the aboutimage
    const query = `
      UPDATE aboutimages SET showFront = ? WHERE ID = ?`

    // Execute the update query
    await db.pool.query(query, [showFront, ID])

    // Send the response
    res.status(200).json({ message: 'About image to show successfully' })

    // Close the database connection
    // Connection pool does not need to be closed per-request
  } catch (error) {
    console.error(`Error updating about image: ${error.message}`)
    res.status(500)
    throw new Error('Error updating about image')
  }
})

module.exports = {
  getAboutImages,
  getAboutImageById,
  createAboutImage,
  updateAboutImage,
  updateShowFrontAboutImage,
  deleteAboutImage,
}
