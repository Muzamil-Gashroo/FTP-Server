const UploadToken = require("../models/uploadToken.model");

const uploadTokenMiddleware = async (req, res, next) => {
  try {

    const token = req.headers["x-upload-token"];

    if (!token) {
      return res.status(401).json({ message: "Upload token missing" });
    }

    const record = await UploadToken.findOne({ token });

    if (!record) {
      return res.status(401).json({ message: "Invalid upload token" });
    }

    if (record.used) {
      return res.status(401).json({ message: "Upload token already used" });
    }

    if (record.expiresAt < new Date()) {
      return res.status(401).json({ message: "Upload token expired" });
    }

    req.userId = record.userID;
    req.uploadTokenRecord = record;

    next();

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = uploadTokenMiddleware;