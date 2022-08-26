const PricePlan = require("../models/pricePlan");
const User = require("../models/user");

require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_API);

exports.getPrices = async (req, res) => {
  const prices = await stripe.prices.list({
    apiKey: process.env.STRIPE_API,
  });
  return res.status(200).json({ msg: "fetched prices from stripe", prices });
};

exports.createSession = async (req, res, next) => {
  try {
    const user = await User.findOne({ where: { id: req.userId } });
    // console.log("userId Session -----------------", user.id);
    // console.log(stripe.checkout.sessions.create);
    const session = await stripe.checkout.sessions.create(
      {
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            price: req.body.priceId,
            // For metered billing, do not pass quantity
            quantity: 1,
          },
        ],
        success_url: `http://localhost:8000/?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `http://localhost:8000?canceled=true`,
        customer: user.stripeCustomerId,
      },
      {
        apiKey: process.env.STRIPE_API,
      }
    );
    return res.json({ session });
  } catch (error) {
    console.log(error);
  }
};

const createSubscription = (customerId, items) => {
  return stripe.subscriptions.create({
    customer: customerId,
    items: items,
  });
};

exports.createSubscription = async (req, res) => {
  const { customerId, items } = req.body;
  try {
    const subscription = await createSubscription(customerId, items);
    res.json({ response: subscription });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ error: error.message });
  }
};

exports.fetchMySubscription = async (req, res, next) => {
  const user = await User.findOne({ where: { id: req.userId } });
  if (!user) {
    return res.status(403).json({ msg: "No user found" });
  }
  const mySubscriptions = await stripe.subscriptions.list(
    {
      customer: user.stripeCustomerId,
      status: "all",
      expand: ["data.default_payment_method"],
      // limit: 1,
    },
    {
      apiKey: process.env.STRIPE_API,
    }
  );
  console.log(mySubscriptions.data[0].id);
  if (!mySubscriptions.data.length) {
    return res.status(400).json({ msg: `You Haven't subscribed to any plan` });
  }

  res.status(200).json({ msg: "Fetched subscriptions", mySubscriptions });
};

exports.cancelSubscription = async (req, res, next) => {
  const user = await User.findOne({ where: { id: req.userId } });
  if (!user) {
    return res.status(403).json({ msg: "No user found" });
  }
  const mySubscriptions = await stripe.subscriptions.list(
    {
      customer: user.stripeCustomerId,
      status: "all",
      expand: ["data.default_payment_method"],
      // limit: 1,
    },
    {
      apiKey: process.env.STRIPE_API,
    }
  );
  console.log(mySubscriptions.data[0].id);
  const deleted = await stripe.subscriptions.del(mySubscriptions.data[0].id);
  console.log(deleted);
  if (!deleted) {
    return res.json({ Error: "No such subscription" });
  }
  res.json({ msg: "Subscription canceled", deleted });
};

exports.oneTimePayment = async (req, res, next) => {
  try {
    const user = await User.findOne({ where: { id: req.userId } });
    // console.log("userId Session -----------------", user.id);
    // console.log(stripe.checkout.sessions.create);
    const oneTimePay = await stripe.charges.create({
      amount: 25 * 100, // Charging Rs 25
      description: "One Time Payment to see the details of a single user",
      currency: "USD",
      customer: user.stripeCustomerId,
    });
    res.json({ msg: "Successfully paid the amount", oneTimePay: oneTimePay });
  } catch (error) {
    console.log(error);
  }
};

exports.subscription = async (req, res) => {
  try {
    let priceId = req.params.priceId;
    const userr = await User.findByPk(req.userId);
    const priceplan = await PricePlan.findByPk(1);
    const paymentMethod = await stripe.paymentMethods.create({
      type: "card",
      card: {
        number: req.body.card_number,
        exp_month: req.body.exp_month,
        exp_year: req.body.exp_year,
        cvc: req.body.cvc,
      },
    });
    // console.log('==========>',paymentMethod);
    // const customer = await stripe.customers.create({
    //   payment_method: paymentMethod.id,
    //   invoice_settings: {
    //     default_payment_method: paymentMethod.id,
    //   },
    //   email: userr.email,
    //   name: userr.fullname,
    // });
    // console.log('customer id',customer.id);
    // const prices = await stripe.prices.list()
    // // console.log(req.body.price);
    // let pricePlan = prices.data.filter(item=> item.unit_amount * 0.01 === req.body.price)
    // console.log('price id',);
    const subscription = await stripe.subscriptions.create({
      payment_settings: {
        payment_method_types: [
          // "ach_credit_transfer",
          // "ach_debit",
          // "acss_debit",
          // "au_becs_debit",
          // "bacs_debit",
          // "bancontact",
          // "boleto",
          "card",
          // "customer_balance",
          // "eps",
          // "fpx",
          // "giropay",
          // "grabpay",
          // "ideal",
          // "konbini",
          // "link",
          // "p24",
          // "paynow",
          // "promptpay",
          // "sepa_debit",
          // "sofort",
          // "us_bank_account",
          // "wechat_pay",
        ],
      },
      default_payment_method: "card",
      customer: userr.stripeCustomerId,
      items: [{ price: priceplan.stripePriceId }],
    });
    // console.log("subs=>", subscription);
    console.log("payment", paymentMethod);
    res.json({ msg: "send" });
  } catch (e) {
    console.log(e);
  }
};

exports.addPricePlan = async (req, res) => {
  // console.log("body", req.body.unit_amount);
  try {
    let unit_amount = req.body.price * 100;
    const price = await stripe.prices.create({
      unit_amount: unit_amount,
      currency: "usd",
      recurring: { interval: "month" },
      product: process.env.PRODUCT_ID,
    });
    let obj = {
      stripePriceId: price.id,
      title: req.body.title,
      description: req.body.description,
      stripeProductId: process.env.PRODUCT_ID,
      price: req.body.price,
    };
    let newPriceplan = await PricePlan.create(obj);

    return res.status(200).json({
      statusCode: 0,
      message: "success",
      data: newPriceplan,
    });
  } catch (err) {
    console.log("error", err);
    return res.status(500).json({
      statusCode: 1,
      message: "Something went wrong",
      data: err,
    });
  }
};
