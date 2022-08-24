const express = require("express");

const router = express.Router();

const qrScannerController = require("../controllers/qrScanner");
const isAuth = require("../middleware/isAuth");

router.get("/qrCode", qrScannerController.readQRCode);

router.post("/scan", qrScannerController.scanQrCode);

router.post("/scanQR/:qrId/:userId?", qrScannerController.scanCode);

// router.post("/addqrCode", qrScannerController.addQRcode);

module.exports = router;
