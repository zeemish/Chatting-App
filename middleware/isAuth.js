const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader = req.get("Authorization");
  if (!authHeader) {
    const error = new Error("Not authenticated.");
    error.statusCode = 401;
    // throw error;
    return res.status(401).json({ error: error.message, status: 401 });
  }
  const token = authHeader.split(" ")[1];
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, "pd_JWTSecret_123");
  } catch (err) {
    err.statusCode = 500;
    // throw err;
    return res.status(500).json({ error: err.message, status: 500 });
  }
  if (!decodedToken) {
    const error = new Error("Not authenticated.");
    error.statusCode = 401;
    // throw error;
    return res.json({ error: error.message, status: 401 });
  }
  req.userId = decodedToken.id;
  console.log("token ------>", decodedToken);
  // console.log("userId ---------------->", req.userId);
  next();
};
