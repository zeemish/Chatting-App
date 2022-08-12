const express = require("express");
const sequelize = require("./util/db");
const bodyParser = require("body-parser");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const dl = require("delivery");
const path = require("path");

require("dotenv").config();

//  -------------------- ROUTES -------------------
const qrScannerRoutes = require("./routers/qrScanner");
const userDetailsRoutes = require("./routers/userDetails");
const locationRoutes = require("./routers/location");

//  ----------------------- MODELS ---------------------
const User = require("./models/user");
const QRCode = require("./models/qrCode");
const Picture = require("./models/picture");
const Location = require("./models/location");
const ChatRoom = require("./models/chatRoom");

const { uploadFile, uploadChatMedia } = require("./s3");

const app = express();
const http = require("http").createServer(app);

const io = require("socket.io")(http, {
  cors: {
    origin: "*",
  },
});

// app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use("/images", express.static(path.join(__dirname, "images")));
// app.use(multer({ storage: storage, fileFilter: fileFilter }).single("file"));

// ------------------- MIDDLEWARE TO HANDLE CORS ISSUE --------------------------
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "OPTIONS, GET, POST, PUT, PATCH, DELETE"
  );
  // res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  // OR below LOC to set all headers
  res.setHeader("Access-Control-Allow-Headers", "*");
  next();
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}_${file.originalname}`);
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    if (ext !== ".jpg" && ext !== ".png" && ext !== ".mp4") {
      return cb(res.status(400).end("only jpg, png, mp4 is allowed"), false);
    } else {
      cb(null, true);
    }
  },
});

const upload = multer({ storage: storage }).single("file");

app.get("/", (req, res) => {
  console.log(req.userId);
  res.json({ msg: "Hello from Jaun App" });
});

app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.status(status).json({ message: message, data: data });
});

app.use("/api/qrScanner", qrScannerRoutes);
app.use("/api/users", userDetailsRoutes);
app.use("/api/location", locationRoutes);

const PORT = 8000;

const crypto = require("crypto");
const randomId = () => crypto.randomBytes(8).toString("hex");

const { MemorySessionStore } = require("./sessionStore");
const sessionStore = new MemorySessionStore();

io.use((socket, next) => {
  const sessionID = socket.handshake.auth.sessionID;
  if (sessionID) {
    const session = sessionStore.findSession(sessionID);
    if (session) {
      socket.sessionID = sessionID;
      socket.userID = session.userID;
      socket.username = session.username;
      return next();
    }
  }
  const username = socket.handshake.auth.username;
  if (!username) {
    return next(new Error("invalid username"));
  }
  socket.sessionID = randomId();
  socket.userID = randomId();
  socket.username = username;
  next();
});

io.on("connection", async (socket) => {
  // persist session
  sessionStore.saveSession(socket.sessionID, {
    userID: socket.userID,
    username: socket.username,
    connected: true,
  });
  // const newSession = await Session.create({
  //   userID: socket.userID,
  //   username: socket.username,
  //   connected: true,
  // });
  // use where condition with findone method (may be it'll work) in session store, then update in db
  console.log(
    `User '${socket.userID}' -> with name "(${socket.username})" connected `
  );

  // emit session details
  socket.emit("session", {
    sessionID: socket.sessionID,
    userID: socket.userID,
  });

  // join the "userID" room
  socket.join(socket.userID);

  // fetch existing users
  const users = [];
  const msgs = ChatRoom.findOne({ where: { senderId: socket.userID } });
  sessionStore.findAllSessions().forEach((session) => {
    users.push({
      userID: session.userID,
      username: session.username,
      connected: session.connected,
    });
  });
  socket.emit("users", users);

  // notify existing users
  socket.broadcast.emit("user connected", {
    userID: socket.userID,
    username: socket.username,
    connected: true,
  });

  // forward the private message to the right recipient (and to other tabs of the sender)
  socket.on("private message", async ({ content, to }) => {
    socket.to(to).to(socket.userID).emit("private message", {
      content,
      from: socket.userID,
      to,
    });
    const chat = await ChatRoom.create({
      senderId: socket.userID,
      receiverId: to,
      message: content,
      mediaURL: null,
      type: "Text Message",
    });
  });

  socket.on("sendImage", async (data) => {
    socket.to(data.to).to(socket.userID).emit("receiveImage", {
      content: data.content,
      from: socket.userID,
      to: data.to,
    });
    console.log(data.file);
    const result = await uploadChatMedia(data.file);
    const chat = await ChatRoom.create({
      senderId: socket.userID,
      receiverId: to,
      message: null,
      mediaURL: result.Location,
      type: "Media Message",
    });
    // cb({ message: err ? "failure" : "success" });
  });

  var delivery = dl.listen(socket);
  delivery.on("receive.success", function (file, info) {
    datainfo = file.params;
    buf = file.buffer;

    io.to(users[datainfo.to]).emit("image", {
      image: true,
      buffer: buf.toString("base64"),
      datainfo,
    });
    console.log(datainfo);
    // console.log(buf.toString("base64"));
    io.to(users[datainfo.from]).emit("image", {
      image: true,
      buffer: buf.toString("base64"),
      datainfo,
    });
    console.log(datainfo);
  });

  // notify users upon disconnection
  socket.on("disconnect", async () => {
    const matchingSockets = await io.in(socket.userID).allSockets();
    const isDisconnected = matchingSockets.size === 0;
    if (isDisconnected) {
      // notify other users
      socket.broadcast.emit("user disconnected", socket.userID);
      // update the connection status of the session
      sessionStore.saveSession(socket.sessionID, {
        userID: socket.userID,
        username: socket.username,
        connected: false,
      });
    }
  });
});

app.post("/api/chat/uploadFiles", (req, res, next) => {
  upload(req, res, (err) => {
    if (err) {
      console.log(err);
      return res.json({ success: false, err: "Bad Request" });
    }
    // console.log(res.req.file.path);
    const chat = ChatRoom.create({
      senderId: req.username,
      receiverId: req.username,
      type: "Media Message",
      message: null,
      mediaURL: res.req.file.path,
    });
    return res.json({ success: true, url: res.req.file.path });
  });
});

User.hasOne(Picture);
Picture.belongsTo(User);
QRCode.hasMany(User);
User.belongsTo(QRCode);
User.belongsToMany(Location, { through: "USER_LOCATION", timestamps: false });
Location.belongsToMany(User, { through: "USER_LOCATION", timestamps: false });
QRCode.hasMany(Location);

sequelize
  // .sync({ force: true })
  // .sync({ alter: true })
  .sync()
  .then((result) => {
    http.listen(PORT, () => {
      console.log(`Server Listening at port: ${process.env.PORT || PORT}`);
    });
  })
  .catch((error) => {
    console.log(error);
  });
