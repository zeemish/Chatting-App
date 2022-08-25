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
