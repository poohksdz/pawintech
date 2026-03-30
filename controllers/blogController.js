const asyncHandler = require("../middleware/asyncHandler");
const { pool } = require("../config/db.js");
const deleteFile = require("../utils/fileUtils");

// @desc    Fetch all blogs
// @route   GET /api/blogs
// @access  Public
const getBlogs = asyncHandler(async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM blogs");
    // แถมฟิลด์ _id ให้ Frontend เพื่อไม่ให้โค้ด React พัง
    const processedBlogs = rows.map((blog) => ({
      ...blog,
      _id: blog.id,
    }));
    res.status(200).json({ blogs: processedBlogs });
  } catch (error) {
    console.error(`Error fetching blogs: ${error.message}`);
    res.status(500);
    throw new Error("Error fetching blogs");
  }
});

// @desc    Fetch single blog
// @route   GET /api/blogs/:id
// @access  Public
const getBlogById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    //  แก้จาก _id เป็น id ให้ตรงกับ phpMyAdmin
    const [rows] = await pool.query("SELECT * FROM blogs WHERE id = ?", [id]);

    if (rows.length === 0) {
      res.status(404);
      throw new Error("Blog not found");
    }

    //  ส่งข้อมูลกลับพร้อมแถมฟิลด์ _id เพื่อรองรับ Frontend เดิม
    res.status(200).json({
      ...rows[0],
      _id: rows[0].id,
    });
  } catch (error) {
    console.error(`Error fetching blog: ${error.message}`);
    if (res.statusCode === 200) res.status(500);
    throw new Error("Error fetching blog");
  }
});

// @desc    Create a blog
// @route   POST /api/blogs
// @access  Private/Admin
const createBlog = asyncHandler(async (req, res) => {
  const { title, content, titleThai, contentThai, image } = req.body;

  if (!title || !content || !titleThai || !contentThai || !image) {
    res.status(400);
    throw new Error(
      "Title, content, titleThai, contentThai, and image are required",
    );
  }

  try {
    const query = `
      INSERT INTO blogs (title, content, titleThai, contentThai, image, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `;
    const [result] = await pool.query(query, [
      title,
      content,
      titleThai,
      contentThai,
      image,
    ]);

    res.status(201).json({
      message: "Blog created successfully",
      blog: {
        _id: result.insertId, // ส่ง insertId กลับไปในชื่อ _id
        id: result.insertId,
        title,
        content,
        titleThai,
        contentThai,
        image,
        created_at: new Date(),
      },
    });
  } catch (error) {
    console.error(`Error creating blog: ${error.message}`);
    res.status(500);
    throw new Error("Error creating blog");
  }
});

// @desc    Update a blog
// @route   PUT /api/blogs/:id
// @access  Private/Admin
const updateBlog = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, content, titleThai, contentThai, image } = req.body;

  if (!title || !content) {
    res.status(400);
    throw new Error("Title and content are required");
  }

  try {
    //  แก้เป็น WHERE id
    const [existingBlog] = await pool.query(
      "SELECT * FROM blogs WHERE id = ?",
      [id],
    );

    if (existingBlog.length === 0) {
      res.status(404);
      throw new Error("Blog not found");
    }

    const query = `
      UPDATE blogs
      SET title = ?, content = ?, titleThai = ?, contentThai = ?, image = ?, updated_at = NOW()
      WHERE id = ?
    `;
    await pool.query(query, [
      title,
      content,
      titleThai,
      contentThai,
      image,
      id,
    ]);

    res.status(200).json({
      message: "Blog updated successfully",
      blog: { _id: id, id, title, content, titleThai, contentThai, image },
    });
  } catch (error) {
    console.error(`Error updating blog: ${error.message}`);
    res.status(500);
    throw new Error("Error updating blog");
  }
});

// @desc    Delete a blog
// @route   DELETE /api/blogs/:id
// @access  Private/Admin
const deleteBlog = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    //  แก้เป็น WHERE id
    const [existingBlog] = await pool.query(
      "SELECT * FROM blogs WHERE id = ?",
      [id],
    );

    if (existingBlog.length === 0) {
      res.status(404);
      throw new Error("Blog not found");
    }

    if (existingBlog[0].image) {
      deleteFile(existingBlog[0].image);
    }

    await pool.query("DELETE FROM blogs WHERE id = ?", [id]);
    res.status(200).json({ message: "Blog deleted successfully" });
  } catch (error) {
    console.error(`Error deleting blog: ${error.message}`);
    res.status(500);
    throw new Error("Error deleting blog");
  }
});

// @desc    Update showFront blog
// @route   PUT /api/blogs/:id/showfront
// @access  Private/Admin
const updateShowFrontBlog = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { showFront } = req.body;
  try {
    //  แก้เป็น WHERE id
    const [blog] = await pool.query("SELECT * FROM blogs WHERE id = ?", [id]);

    if (blog.length === 0) {
      res.status(404);
      throw new Error("Blog not found");
    }

    await pool.query("UPDATE blogs SET showFront = ? WHERE id = ?", [
      showFront,
      id,
    ]);
    res.status(200).json({ message: "Blog visibility updated successfully" });
  } catch (error) {
    console.error(`Error updating showFront: ${error.message}`);
    res.status(500);
    throw new Error("Error updating showFront");
  }
});

module.exports = {
  getBlogs,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
  updateShowFrontBlog,
};
