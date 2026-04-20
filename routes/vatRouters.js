const express = require("express");
const router = express.Router();

const {
  getVats,
  getVatById,
  createVat,
  updateVat,
  deleteVat,
} = require("../controllers/vatController.js");

const { protect, admin } = require("../middleware/authMiddleware.js");

router.route("/").get(getVats).post(protect, admin, createVat);
router.route("/:id").get(getVatById).put(protect, admin, updateVat).delete(protect, admin, deleteVat);

module.exports = router;
