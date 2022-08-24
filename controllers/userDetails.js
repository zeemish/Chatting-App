const jwt = require("jsonwebtoken");
require("dotenv").config();

const stripe = require("stripe")(process.env.STRIPE_API);
const schedule = require("node-schedule");

const Location = require("../models/location");
const Picture = require("../models/picture");
const QRCode = require("../models/qrCode");
const User = require("../models/user");
const { uploadSelfie } = require("../s3");

exports.newUser = async (req, res, next) => {
  const qrId = req.params.qrId;
  console.log("params---", req.params);
  const {
    email,
    name,
    identity,
    interest,
    age,
    favDrink,
    favSong,
    hobbies,
    petPeeve,
  } = req.body;

  try {
    if (
      !email &&
      !name &&
      !identity &&
      !interest &&
      !age &&
      !favDrink &&
      !favSong &&
      !hobbies &&
      !petPeeve
    ) {
      const error = new Error("You must fill all fields");
      error.statusCode = 403;
      // throw error.message;
      return res.status(403).json({ error: error.message });
    }

    const validateEmail = (email) => {
      return email.match(
        /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
    };
    if (!validateEmail(email)) {
      const error = new Error("Email is not valid");
      error.statusCode = 403;
      // throw error.message;
      return res.status(403).json({ error: error.message });
    }

    if (!email) {
      const error = new Error("Email cannot be empty");
      error.statusCode = 403;
      // throw error.message;
      return res.status(403).json({ error: error.message });
    }

    if (!name) {
      const error = new Error("Name cannot be empty");
      error.statusCode = 403;
      // throw error.message;
      return res.status(403).json({ error: error.message });
    }
    if (!age) {
      const error = new Error("Please enter your age");
      error.statusCode = 403;
      // throw error.message;
      return res.status(403).json({ error: error.message });
    }
    const qrCode = await QRCode.findByPk(qrId);
    if (!qrCode) {
      return res.status(404).json({
        msg: "No such QR or QRcode may be not scanned correctly",
      });
    }

    const customer = await stripe.customers.create(
      {
        email,
      },
      { apiKey: process.env.STRIPE_API }
    );
    const existsUser = await User.findOne({ where: { email: email } });

    if (existsUser) {
      return res.json({ message: "A user with that email already exists!" });
    }
    const newUser = await qrCode.createUser(
      {
        email,
        name,
        identity,
        interest,
        age,
        favDrink,
        favSong,
        hobbies,
        petPeeve,
        stripeCustomerId: customer.id,
      },
      { include: Picture }
    );
    const token = jwt.sign({ id: newUser.id }, "pd_JWTSecret_123", {
      expiresIn: "6h",
    });

    res.status(200).json({
      msg: "User Data Stored",
      newUser,
      token,
      stripeCustomerId: customer.id,
    });
  } catch (error) {
    error.statusCode = 403;
    // throw error.message;
    console.log(error);
    return res.status(500).json({ error: "Something went wrong on our side" });
  }
};

exports.getUser = async (req, res, next) => {
  const userId = req.params.userId;
  try {
    const user = await User.findByPk(userId, { include: Picture });
    if (!user) {
      return res.status(404).json({ msg: "No User Found" });
    }
    res.json({ msg: "user Fetched", user, customerId: user.stripeCustomerId });
  } catch (error) {
    error.statusCode = 403;
    // throw error.message;
    return res.status(500).json({ error: "Something went wrong on our side" });
  }
};

exports.updateUser = async (req, res, next) => {
  const userId = req.params.userId;
  const {
    name,
    identity,
    interest,
    age,
    favDrink,
    favSong,
    hobbies,
    petPeeve,
  } = req.body;

  try {
    const fetchUser = await User.findOne({ where: { id: userId } });
    if (!fetchUser) {
      const error = new Error("No User found!");
      error.statusCode = 403;
      // throw error.message;
      return res.status(403).json({ error: error.message });
    }
    const singleUser = await fetchUser.update({
      name,
      identity,
      interest,
      age,
      favDrink,
      favSong,
      hobbies,
      petPeeve,
    });
    res.json({ msg: "User Updated", singleUser });
  } catch (error) {
    error.statusCode = 403;
    // throw error.message;
    return res.status(500).json({ error: "Something went wrong on our side" });
  }
};

exports.getAllUsers = async (req, res, next) => {
  const qrId = req.params.qrId;
  try {
    if (!qrId) {
      const error = new Error(
        "No such QR or QRcode may be not scanned correctly "
      );
      error.statusCode = 404;
      // throw error.message;
      return res.status(404).json({ error: error.message });
    }
    const allUsers = await User.findAll(
      { where: { qrCodeId: qrId } },
      { include: Picture }
    );
    if (!allUsers) {
      const error = new Error("No users in this Bar at the moment");
      error.statusCode = 403;
      // throw error.message;
      return res.status(403).json({ error: error.message });
    }
    res.status(200).json({ msg: "all users", allUsers });
  } catch (error) {
    error.statusCode = 403;
    // throw error.message;
    return res.status(500).json({ error: "Something went wrong on our side" });
  }
};

exports.uploadSelfie = async (req, res) => {
  const file = req.file;
  console.log(file);
  // const userId = req.params.userId;
  try {
    if (!file) {
      return res.status(400).json({
        msg: "Please Provide your image",
      });
    }

    if (
      file.mimetype !== "image/png" &&
      file.mimetype !== "image/jpg" &&
      file.mimetype !== "image/jpeg"
    ) {
      return res
        .status(422)
        .json({ error: "Image must be in jpeg OR png format" });
    }

    const result = await uploadSelfie(file);

    const user = await User.findByPk(req.userId);
    if (!user) {
      res.status(400).json({ error: "No User found" });
    }

    const image = await user.createPicture({
      imageUrl: result.Location,
    });

    const job = schedule.scheduleJob("0 5 * * *", async function () {
      const currPic = image.id;
      const deletedPic = await Picture.destroy({
        where: { id: currPic, userId: user.id },
      });
      console.log(`${deletedPic} Pic Deleted: with id: -> ${currPic}`);
      schedule.gracefulShutdown();
    });
    console.log("ressssssssssssss ------------->", req.userId);

    res.status(200).json({ msg: "Image uploaded", result, image });
  } catch (error) {
    error.statusCode = 403;
    // throw error.message;
    return res.status(500).json({ error: "Something went wrong on our side" });
  }
};

exports.updateSelfie = async (req, res) => {
  const file = req.file;
  try {
    if (!file) {
      return res.json({
        msg: "Please Provide your image (must be in jpeg/jpg/png format) ",
      });
    }
    const result = await uploadSelfie(file);
    const findImage = await Picture.findOne({ where: { userId: req.userId } });
    const image = await findImage.update(
      {
        imageUrl: result.Location,
        // userId: userId,
      },
      { where: { id: req.userId } }
    );
    res.status(200).json({ msg: "Image updated", result, image });
  } catch (error) {
    error.statusCode = 403;
    // throw error.message;
    return res.status(500).json({ error: "Something went wrong on our side" });
  }
};

exports.addUserToLocation = async (req, res, next) => {
  try {
    if (!req.body.locationId) {
      return res.json({ error: "Location Cannot be Empty" });
    }
    const user = await User.findByPk(req.userId);

    if (!user) {
      return res.status(404).json({ msg: "No User with that id exists" });
    }

    const location = await Location.findOne({
      where: { id: req.body.locationId },
    });
    const getLocation = await location.addUser(user);

    res.json({
      msg: `Added user to Location ${location.location}`,
      location: location.location,
    });
  } catch (error) {
    error.statusCode = 403;
    // throw error.message;
    return res.status(500).json({ error: "Something went wrong on our side" });
  }
};

exports.updateUserLocation = async (req, res, next) => {
  // const userId = req.params.userId;
  const locationId = req.params.locationId;
  try {
    if (!req.userId) {
      return res.status(404).json({ msg: "No User with that id exists" });
    }

    const user = await User.findByPk(req.userId);
    if (!user) {
      res.status(400).json({ error: "No User found" });
    }

    const location = await Location.findOne({
      where: { id: locationId },
    });

    if (!location) {
      return res.status(404).json({ error: "No Such Location" });
    }

    const newLocation = await user.setLocations(location);
    res.json({ msg: "Location updated", newLocation });
  } catch (error) {
    error.statusCode = 403;
    // throw error.message;
    return res.status(500).json({ error: "Something went wrong on our side" });
  }
};

exports.getLocationUser = async (req, res, next) => {
  const locationId = req.params.locationId;
  const qrId = req.params.qrId;

  try {
    if (!locationId) {
      const error = new Error("No Such location");
      error.statusCode = 403;
      // throw error.message;
      return res.status(404).json({ error: error.message });
    }
    const users = await Location.findByPk(locationId, {
      include: [
        {
          model: User,
          attributes: ["name", "age"],
        },
        // { where: { qrCodeId: qrId } },
      ],
    });
    if (users.dataValues.users.length === 0) {
      return res.status(404).json({ msg: "No Users in this location" });
    }
    console.log(users.dataValues.users);
    res.json({ msg: `users for id: ${locationId} fetched`, users });
  } catch (error) {
    error.statusCode = 403;
    // throw error.message;
    return res.status(500).json({ error: "Something went wrong on our side" });
  }
};
