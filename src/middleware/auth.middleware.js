const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {

  const authHeader = req.headers.authorization;
  
  console.log("Auth Middleware Hit:", req.originalUrl);
  console.log("Auth Header:", authHeader);

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("No Bearer token found");
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    console.log("Token Verified. UserID:", req.userId);
    next();
  } catch (err) {
    console.log("Token Verification Failed:", err.message);
    return res.status(401).json({ message: "Invalid token" });
  }
};
