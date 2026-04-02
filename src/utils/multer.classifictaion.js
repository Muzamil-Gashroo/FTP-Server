const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb,) => {

    const type = file.mimetype;

    let folder = "others";

    if (type.startsWith("image/")) {
      folder = "images";
    }
    else if (type.startsWith("video/")) {
      folder = "videos";
    }
    else if (type === "application/pdf") {
      folder = "documents";
    }
    else {
      folder = "others";
    }

    const uploadPath = path.join(__dirname, "..", "..", "public", folder);

    cb(null, uploadPath);
  },

  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },

});

module.exports = multer({
  storage,
  limits: {
    fileSize: 5000 * 1024 * 1024 // hard global cap (5000MB)
  }
});

 
