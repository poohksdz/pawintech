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

router.route("/").get(getVats).post(createVat);
router.route("/:id").get(getVatById).put(updateVat).delete(deleteVat);

module.exports = router;
