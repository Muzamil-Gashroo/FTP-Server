const express = require("express");
const filesController = require("../controllers/files.controller");
const upload = require("../utils/multer.classifictaion");
const apiKeyMiddleware = require("../middleware/apiKey.authenticator");
const authCheck = require("../middleware/auth.middleware");
const apiLimiter = require("../middleware/rateLimiter");


const router = express.Router();


router.get("/list", apiKeyMiddleware, filesController.listFiles);

// apiLimiteer
router.post("/uploads", apiKeyMiddleware, upload.array("files", 10), filesController.uploads);

// apiLimiteer
router.get("/downloads/:fileId", apiKeyMiddleware, filesController.initiateDownload);

// apiLimiteer
router.delete("/delete/:fileId", apiKeyMiddleware, filesController.deleteFile);

// apiLimiteer
router.delete("/delete-all", apiKeyMiddleware, filesController.deleteMultipleFiles);

// apiLimiteer
router.patch("/rename/:fileId",  apiKeyMiddleware, filesController.renameFile);


module.exports = router;
