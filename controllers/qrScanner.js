const Jimp = require("jimp");
const QrCode = require("qrcode-reader");

const fs = require("fs");

const QRCode = require("../models/qrCode");

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

// exports.scanQrCode = async (req, res, next) => {
//   const qrId = req.params.qrId;
//   try {
//     var buffer = fs.readFileSync(__dirname + "/Capture.PNG");
//     Jimp.read(buffer, function (err, image) {
//       if (err) {
//         console.error(err);
//       }
//       const qrcode = new QrCode();
//       qrcode.callback = async (err, value) => {
//         if (err) {
//           console.error(err);
//         }
//         // console.log(value);
//         const qr_Code = await QRCode.findOne({
//           where: {
//             // qr_Code: qrId,
//             qr_Code: req.body.qr_Code,
//           },
//         });

//         if (!qr_Code) {
//           return res.json({ success: false, error: "No Qr Code Found" });
//         } else {
//           res.json({
//             success: true,
//             msg: "Qr Code scanned successfully...",
//             qrId: qr_Code.id,
//           });
//         }
//       };
//       qrcode.decode(image.bitmap);
//     });
//   } catch (error) {
//     console.log(error);
//   }
// };

// exports.qrcode = async (req, res, next) => {
//   const qr_Code = req.body.qr_Code;
//   const qrID = req.params.qrID;
//   try {
//     if (!qr_Code) {
//       return res.json({ msg: "No QR Code found" });
//     } else {
//       const finding = QRCode.findOne({ id: qrID });
//       // const newUser = await QRCode.create({ qr_Code });
//       res.status(200).json({ msg: "Fetched", finding });
//     }
//   } catch (error) {
//     console.log(error);
//   }
// };

// exports.addQRcode = async (req, res, next) => {
//   const qr_Code = req.body.qr_Code;
//   try {
//     if (!qr_Code) {
//       return res.status(404).json({ msg: "QR Code cannot be empty" });
//     }
//     const newUser = await QRCode.create({ qr_Code });
//     res.json({ msg: "Qr Code Scanned", newUser });
//   } catch (error) {
//     console.log(error);
//   }
// };
