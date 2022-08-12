const Location = require("../models/location");
const QRCode = require("../models/qrCode");
const User = require("../models/user");

exports.addLocation = async (req, res, next) => {
  const location = req.body.location;
  const qrId = req.params.qrId;

  try {
    const qrCode = await QRCode.findByPk(qrId);
    if (!qrCode) {
      return res.json({
        msg: "No such QR or QRcode may be not scanned correctly",
      });
    }
    if (!location) {
      return res.json({ msg: "please enter your location" });
    }
    // const qrCode = QRCode.findByPk(qrId);
    const newLocation = await qrCode.createLocation({
      location,
      qrCodeId: qrId,
    });
    res.json({ msg: "Location Added", newLocation });
  } catch (error) {
    console.log(error);
  }
};

// exports.getAllLocations = async (req, res, next) => {
//   try {
//     const getLocation = await Location.findAll({
//       include: { model: User, attributes: ["name", "age"] },
//     });

//     res.json({ msg: "Locations Fetched", getLocation });
//   } catch (error) {
//     console.log(error);
//   }
// };

exports.getAllLocations = async (req, res, next) => {
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
    const getLocation = await Location.findAll(
      { where: { qrCodeId: qrId } },
      {
        include: { model: User, attributes: ["name", "age"] },
      }
    );
    console.log(getLocation.length);
    if (getLocation.length === 0) {
      return res.status(404).json({ msg: "No Location in this bar" });
    }

    res.json({ msg: "Locations Fetched", getLocation });
  } catch (error) {
    error.statusCode = 403;
    // throw error.message;
    return res.status(500).json({ error: "Something went wrong on our side" });
  }
};

// exports.addUserToLocation = async (req, res, next) => {
//   const locationId = req.params.locationId;
//   const {
//     name,
//     identity,
//     interest,
//     age,
//     favDrink,
//     favSong,
//     hobbies,
//     petPeeve,
//   } = req.body;
//   try {
//     if (
//       !name &&
//       !identity &&
//       !interest &&
//       !age &&
//       !favDrink &&
//       !favSong &&
//       !hobbies &&
//       !petPeeve
//     ) {
//       return res.status(400).json({ msg: "Please fill all the fields" });
//     }
//     const user = await User.create(
//       {
//         name,
//         identity,
//         interest,
//         age,
//         favDrink,
//         favSong,
//         hobbies,
//         petPeeve,
//       },
//       { include: Location }
//     );

//     await user.addLocation(locationId, { through: "USER_LOCATION" });
//     const result = await User.findOne({
//       where: { name: name },
//     });
//     res.json({ msg: "send", result });
//   } catch (error) {
//     console.log(error);
//   }
// };

// exports.newUserLocation = async (req, res, next) => {
//   const {
//     name,
//     identity,
//     interest,
//     age,
//     favDrink,
//     favSong,
//     hobbies,
//     petPeeve,
//   } = req.body;

//   const user = User.create({
//     name,
//     identity,
//     interest,
//     age,
//     favDrink,
//     favSong,
//     hobbies,
//     petPeeve,
//   });
//   const location = Location.create({ location: " Location2" });
//   await user.addLocation(location.id);

//   res.json({ msg: "send" });
// };
