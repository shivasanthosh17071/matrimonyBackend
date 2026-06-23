// File: src/routes/masterRoutes.js
// Public routes — no auth required. Frontend caches these on app load.

const router = require("express").Router();
const c = require("../controllers/masterController");

router.get("/dropdowns", c.getAllDropdowns);
router.get("/districts", c.getDistricts);

module.exports = router;
