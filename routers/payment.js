const express = require("express");
const isAuth = require("../middleware/isAuth");

const router = express.Router();

const paymentController = require("../controllers/payment");

router.get("/getPrices", isAuth, paymentController.getPrices);

router.post("/subscribe", isAuth, paymentController.createSubscription);

router.post("/session", isAuth, paymentController.createSession);

router.get("/my-subs", isAuth, paymentController.fetchMySubscription);

router.delete("/delete", isAuth, paymentController.cancelSubscription);

module.exports = router;
