const express = require("express");
const isAuth = require("../middleware/isAuth");

const router = express.Router();

const paymentController = require("../controllers/payment");

router.get("/getPrices", isAuth, paymentController.getPrices);

router.post("/subscribe", isAuth, paymentController.createSubscription);

router.post("/session", isAuth, paymentController.createSession);

router.get("/my-subs", isAuth, paymentController.fetchMySubscription);

router.delete("/cancel-subs", isAuth, paymentController.cancelSubscription);

router.post("/one-time-payment", isAuth, paymentController.oneTimePayment);

router.post("/subscription/:priceId", isAuth, paymentController.subscription);

router.post("/price-plan", isAuth, paymentController.addPricePlan);

module.exports = router;
