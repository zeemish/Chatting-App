const Jimp = require("jimp");
const QrCode = require("qrcode-reader");
const sequelize = require("../util/db");
const User_QrCode = require("../models/user_qrCode");
const User = require("../models/user");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const schedule = require("node-schedule");

const QRCode = require("../models/qrCode");
const { QueryTypes } = require("sequelize");

exports.readQRCode = async (req, res, next) => {
  var buffer = fs.readFileSync(__dirname + "/Capture.PNG");
  Jimp.read(buffer, function (err, image) {
    if (err) {
      console.error(err);
    }
    const qrcode = new QrCode();
    qrcode.callback = async (err, value) => {
      if (err) {
        console.error(err);
      }
      const qr_Code = await QRCode.create({
        qr_Code: value.result,
      });
      console.log(value.result);
      res.json({ msg: "read", readImage: value.result, qr_Code });
    };
    qrcode.decode(image.bitmap);
  });
};

exports.scanQrCode = async (req, res, next) => {
  try {
    const qr_Code = await QRCode.findOne({
      where: {
        // qr_Code: qrId,
        qr_Code: req.body.qr_Code,
      },
    });

    if (!qr_Code) {
      return res
        .status(404)
        .json({ success: false, error: "No Qr Code Found" });
    } else {
      res.json({
        success: true,
        msg: "Qr Code scanned successfully...",
        qrId: qr_Code.id,
      });
    }
  } catch (error) {
    console.log(error);
  }
};

exports.scanCode = async (req, res, next) => {
  const { qrId, userId } = req.params;
  const {
    name,
    identity,
    interest,
    age,
    favDrink,
    favSong,
    hobbies,
    petPeeve,
    relationPreference,
  } = req.body;
  const qr = await QRCode.findOne({ where: { id: qrId } });
  if (!qr) {
    res.status(402).json({ success: false, msg: "No QR Found" });
  }
  try {
    if (qr && !userId) {
      //user null should be create

      // console.log(qrId);
      var user = await qr.createUser({
        name: null,
        identity: null,
        interest: null,
        age: null,
        relationPreference: null,
        favDrink: null,
        favSong: null,
        hobbies: null,
        petPeeve: null,
      });
      res
        .status(200)
        .json({ success: true, userId: user.id, msg: "User has been created" });
      const userInBar = await User_QrCode.create({
        userID: user.id,
        qrId: qr,
      });
      console.log(userInBar);
      // res.json({ msg: "send" });
    }

    if (qr && userId) {
      //user null should be update
      const findId = await User.findByPk(userId);
      // console.log("id", findId.id);
      if (!findId) {
        return res.status(404).json({ msg: "User not found", success: false });
      }
      const updatedUser = await User.update(
        {
          name,
          identity,
          interest,
          age,
          relationPreference,
          favDrink,
          favSong,
          hobbies,
          petPeeve,
        },
        {
          where: { id: userId, qrCodeId: qr.id },
        }
      );
      const token = jwt.sign({ id: userId }, "pd_JWTSecret_123", {
        expiresIn: "6h",
      });
      res
        .status(200)
        .json({ success: true, msg: "User has been updated", token });
    }
  } catch (error) {
    console.log(error);
  }
};

// exports.scanCode = async (req, res, next) => {
//   const { qrId, userId } = req.params;
//   const {
//     name,
//     identity,
//     interest,
//     age,
//     favDrink,
//     favSong,
//     hobbies,
//     petPeeve,
//     relationPreference,
//   } = req.body;
//   const qr = await QRCode.findOne({ where: { id: qrId } });
//   if (!qr) {
//     res.status(402).json({ success: false, msg: "No QR Found" });
//   }
//   try {
//     if (qr && !userId) {
//       //user null should be create

//       // console.log(qrId);
//       var user = await qr.createUser({
//         name: null,
//         identity: null,
//         interest: null,
//         age: null,
//         relationPreference: null,
//         favDrink: null,
//         favSong: null,
//         hobbies: null,
//         petPeeve: null,
//       });
//       res
//         .status(200)
//         .json({ success: true, userId: user.id, msg: "User has been created" });
//       const userInBar = await User_QrCode.create({
//         userID: user.id,
//         qrId: qr.id,
//       });
//       console.log(userInBar);
//       // res.json({ msg: "send" });
//     }

//     if (qr && userId) {
//       //user null should be update
//       const findId = await User.findByPk(userId);
//       // console.log("id", findId.id);
//       if (!findId) {
//         return res.status(404).json({ msg: "User not found", success: false });
//       }
//       const updatedUser = await User.update(
//         {
//           name,
//           identity,
//           interest,
//           age,
//           relationPreference,
//           favDrink,
//           favSong,
//           hobbies,
//           petPeeve,
//         },
//         {
//           where: { id: userId, qrCodeId: qr.id },
//         }
//       );
//       const token = jwt.sign({ id: userId }, "pd_JWTSecret_123", {
//         expiresIn: "6h",
//       });
//       res
//         .status(200)
//         .json({ success: true, msg: "User has been updated", token });
//     }
//     if (qr && userId) {
//       console.log("QRID <<<<------------------------>>>>", qr.id);
//       console.log("USERID <<<<------------------------>>>>", userId);
//       const userCheck = User_QrCode.findOne({
//         where: {
//           userID: userId,
//           qrId: qr.id,
//         },
//       });
//       if (userCheck && userCheck.qrId !== qr.id) {
//         schedule.scheduleJob("*/5 * * * * *", async function () {
//           const deleteUser = await User_QrCode.destroy({
//             where: { userID: userId, qrId: qr.id },
//           });
//           console.log(`${deleteUser} Pic Deleted: with id: -> ${deleteUser}`);
//           schedule.gracefulShutdown();
//         });
//       }
//     }
//   } catch (error) {
//     console.log(error);
//   }
// };
