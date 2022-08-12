const express = require("express");

const router = express.Router();

const qrScannerController = require("../controllers/qrScanner");

router.get("/qrCode", qrScannerController.readQRCode);

router.post("/scan", qrScannerController.scanQrCode);

// router.post("/addqrCode", qrScannerController.addQRcode);

module.exports = router;
