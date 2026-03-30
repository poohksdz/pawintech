const express = require("express");
const router = express.Router();

// เรียก Controller
const blogController = require("../controllers/blogController.js");

//  เช็คดูว่า Import มาครบไหม (จะโชว์ในจอดำตอนรัน)
if (!blogController.getBlogs)
  console.error("❌ ERROR: หา getBlogs ไม่เจอ! เช็คไฟล์ Controller ด่วน");
if (!blogController.getBlogById)
  console.error("❌ ERROR: หา getBlogById ไม่เจอ! เช็คไฟล์ Controller ด่วน");

const {
  getBlogs,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
  updateShowFrontBlog,
} = blogController;

const { protect, admin } = require("../middleware/authMiddleware.js");

// Route: /api/blogs
router.route("/").get(getBlogs).post(protect, admin, createBlog);

// Route: /api/blogs/:id
router
  .route("/:id")
  .get(getBlogById)
  .put(protect, admin, updateBlog)
  .delete(protect, admin, deleteBlog);

// Route: /api/blogs/:id/showfront
router.route("/:id/showfront").put(protect, admin, updateShowFrontBlog);

module.exports = router;
