const express = require("express");
const filesController = require("../controllers/files.controller");
const upload = require("../utils/multer.classifictaion");
const apiKeyMiddleware = require("../middleware/apiKey.authenticator");
const apiLimiter = require("../middleware/rateLimiter");
const uploadTokenMiddleware = require("../middleware/uploadToken.middleware");


const router = express.Router();


router.get("/list", apiKeyMiddleware, filesController.listFiles);

// v1 sdk endpoints ---------------
// apiLimiteer
router.post("/sdk/uploads", apiKeyMiddleware, upload.array("files", 10), filesController.uploads);

// apiLimiteer
router.get("/sdk/downloads/:fileId", apiKeyMiddleware, filesController.initiateDownload);
// -------------------------

// uploads
// apiLimiteer
router.post("/uploads", uploadTokenMiddleware, upload.array("files", 10), filesController.uploads);

// apiLimiteer
router.post("/generate-upload-token", apiKeyMiddleware, filesController.generateUploadToken );

//downloads
// apiLimiteer
router.post("/generate-signed-url/:fileId", apiKeyMiddleware, filesController.generateSignedUrl);

// apiLimiteer
router.get("/signed-download", filesController.signedDownload);


// apiLimiteer
router.delete("/delete/:fileId", apiKeyMiddleware, filesController.deleteFile);

// apiLimiteer
router.delete("/delete-all", apiKeyMiddleware, filesController.deleteMultipleFiles);

// apiLimiteer
router.patch("/rename/:fileId",  apiKeyMiddleware, filesController.renameFile);


module.exports = router;
