const express = require("express");
const isAuth = require("../middleware/isAuth");

const router = express.Router();

const locationController = require("../controllers/location");

router.post("/addLocation/:qrId", isAuth, locationController.addLocation);

router.get("/getLocation/:qrId", isAuth, locationController.getAllLocations);

// router.post("/addUser/:locationId", locationController.addUserToLocation);

// router.post("/addNewUser", locationController.newUserLocation);

module.exports = router;
