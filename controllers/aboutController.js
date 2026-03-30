const asyncHandler = require("../middleware/asyncHandler.js");
const db = require("../config/db.js");
// const { connection } = require('../config/db.js')

// @desc    Fetch all abouts
// @route   GET /api/abouts
// @access  Public
const getAbouts = asyncHandler(async (req, res) => {
  try {
    // Connect to the database

    // Query to fetch all abouts
    const [rows] = await db.pool.query("SELECT * FROM abouts");
    res.status(200).json({ abouts: rows }); // Send the results as a JSON response
  } catch (error) {
    console.error(`Error fetching abouts: ${error.message}`);
    res.status(500);
    throw new Error("Error fetching abouts");
  }
});

// @desc    Fetch single about
// @route   GET /api/abouts/:id
// @access  Public
const getAboutById = asyncHandler(async (req, res) => {
  const { ID } = req.params;

  try {
    // Connect to the database

    // Query to fetch the about by ID
    const [rows] = await db.pool.query("SELECT * FROM abouts WHERE ID = ?", [
      ID,
    ]);

    if (rows.length === 0) {
      res.status(404);
      throw new Error("About not found");
    }

    res.status(200).json(rows[0]); // Send the about data
  } catch (error) {
    console.error(`Error fetching about: ${error.message}`);
    res.status(500);
    throw new Error("Error fetching about");
  }
});

// @desc    Create a about
// @route   POST /api/abouts
// @access  Private/Admin
const createAbout = asyncHandler(async (req, res) => {
  const { aboutContentEng, aboutContentThai } = req.body;

  // console.log(req.body)

  // Validate input data
  if ((!aboutContentEng, !aboutContentThai)) {
    res.status(400);
    throw new Error("Content is required!");
  }

  try {
    // Connect to the database

    // Prepare the query with a default `NOW()` for the `created_at` field
    const query = `
      INSERT INTO abouts (aboutContentEng, aboutContentThai)
      VALUES (?, ?)
    `;

    const [result] = await db.pool.query(query, [
      aboutContentEng,
      aboutContentThai,
    ]);

    // Log result to verify successful insertion
    // console.log(result)

    // Send a successful response with the about data
    res.status(201).json({
      message: "About created successfully",
      about: {
        ID: result.insertId,
        aboutContentEng,
        aboutContentThai,
      },
    });
  } catch (error) {
    console.error(`Error creating about: ${error.message}`);
    res.status(500);
    throw new Error("Error creating about");
  }
});

// @desc    Update a about
// @route   PUT /api/abouts/:id
// @access  Private/Admin
const updateAbout = asyncHandler(async (req, res) => {
  const { ID } = req.params;
  const { aboutContentEng, aboutContentThai } = req.body;
  // ValIDate input data
  if ((!aboutContentEng, !aboutContentThai)) {
    res.status(400).json({ message: "Content are required" });
    return;
  }

  try {
    // Connect to the database

    // Check if the about exists
    const [existingAbout] = await db.pool.query(
      "SELECT * FROM abouts WHERE ID = ?",
      [ID],
    );

    if (existingAbout.length === 0) {
      res.status(404).json({ message: "About not found" });
      return;
    }

    // Prepare the update query
    const query = `
      UPDATE abouts
      SET aboutContentEng = ? , aboutContentThai = ?
      WHERE ID = ?
    `;

    const [result] = await db.pool.query(query, [
      aboutContentEng,
      aboutContentThai,
      ID,
    ]);

    if (result.affectedRows === 0) {
      res.status(400).json({ message: "No changes made to the about" });
      return;
    }

    res.status(200).json({
      message: "About updated successfully",
      about: {
        ID,
        aboutContentEng,
        aboutContentThai,
      },
    });
  } catch (error) {
    console.error(`Error updating about: ${error.message}`);
    res.status(500).json({ message: "Error updating about" });
  }
});

// @desc    Delete a about
// @route   DELETE /api/abouts/:ID
// @access  Private/Admin
const deleteAbout = asyncHandler(async (req, res) => {
  const { ID } = req.params;

  try {
    // Connect to the database

    // Check if the about exists
    const [existingAbout] = await db.pool.query(
      "SELECT * FROM abouts WHERE ID = ?",
      [ID],
    );

    if (existingAbout.length === 0) {
      res.status(404);
      throw new Error("About not found");
    }

    // Delete the about
    await db.pool.query("DELETE FROM abouts WHERE ID = ?", [ID]);

    res.status(200).json({ message: "About deleted successfully" });
  } catch (error) {
    console.error(`Error deleting about: ${error.message}`);
    res.status(500);
    throw new Error("Error deleting about");
  }
});

module.exports = {
  getAbouts,
  getAboutById,
  createAbout,
  updateAbout,
  deleteAbout,
};
