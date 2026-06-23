// File: src/controllers/masterController.js
// Purpose: Serve all dropdown/select option data to the frontend.
// Frontend fetches once on app load and caches. No more hardcoded lists in UI.

const { getAllDropdowns, AP_DISTRICTS } = require("../constants/masterData");
const { sendSuccess } = require("../utils/apiResponse");

// GET /api/master/dropdowns
// Returns every dropdown list the frontend needs — call once and cache.
exports.getAllDropdowns = (req, res) => {
  return sendSuccess(
    res,
    { dropdowns: getAllDropdowns() },
    "Dropdown data fetched.",
    200,
  );
};

// GET /api/master/districts?region=andhra
// Returns districts filtered by region (optional)
exports.getDistricts = (req, res) => {
  const { region } = req.query;
  const districts = region
    ? AP_DISTRICTS.filter((d) => d.region === region)
    : AP_DISTRICTS;
  return sendSuccess(res, { districts }, "Districts fetched.", 200);
};
