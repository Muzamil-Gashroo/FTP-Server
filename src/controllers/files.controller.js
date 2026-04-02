const files = require('../models/files.model');
const UploadToken = require('../models/uploadToken.model');
const crypto = require('crypto');
const path = require('path');
const QRCode = require('qrcode');
const fs = require('fs').promises;

function getMaxSize(type) {
  if (type.startsWith("image/")) return 200 * 1024 * 1024; // 200MB
  if (type.startsWith("video/")) return 5000 * 1024 * 1024; // 5000MB
  if (type === "application/pdf") return 2000 * 1024 * 1024; // 2000MB
  return 10 * 1024 * 1024;
}

const filesController = {

uploads: async (req, res) => {

  try {

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const uploadedFiles = [];
    
    for (const file of req.files) {
       
      if (file.size > getMaxSize(file.mimetype)) {
        return res.status(400).json({
         message: `File ${file.originalname} exceeds allowed size`
       });
       
      }
    }

    for (const file of req.files) {

      const fileId = crypto.randomUUID();

      const fileData = new files({
       
        userID: req.userId,
        fileId,
        filename: file.filename,
        folder: path.basename(file.destination),
        type: file.mimetype,
        displayName: file.originalname,
        size: file.size
      
      });

      await fileData.save();

      uploadedFiles.push({
        fileId,
        displayName: file.originalname,
        size: file.size
      });
    }

    if (req.uploadTokenRecord) {
    
      await UploadToken.deleteOne({ token: req.uploadTokenRecord.token });
    
    };

    return res.json({
      message: "Files uploaded successfully",
      count: uploadedFiles.length,
      files: uploadedFiles
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
},

generateUploadToken: async (req, res) => {
   
  try {
     
    const existingToken = await UploadToken.findOne({

       userID: req.userId,
       used: false,
       expiresAt: { $gt: new Date() }

    });

    if (existingToken) {
      
        return res.json({
        uploadToken: existingToken.token,
        expiresIn: Math.floor((existingToken.expiresAt - new Date()) / 1000)
      });
    }

    const token = crypto.randomBytes(32).toString("hex");

    await UploadToken.create({

      userID: req.userId,
      token,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000) 

    });

    return res.json({

      uploadToken: token,
      expiresIn: 300
    
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }

},

  renameFile: async (req, res) => {

    try {
      const { fileId } = req.params;
      const { newName } = req.body;
      const userId = req.userId;

      if (!newName) {
        return res.status(400).json({ message: "New name is required" });
      }

      const file = await files.findOne({ fileId, userID: userId });

      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }

      if (file.userID !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      file.displayName = newName;
      await file.save();

      res.status(200).json({
        message: "File renamed successfully",
        file: file
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  initiateDownload: async (req, res) => {

    try {
      const fileId = req.params.fileId;
      const userId = req.userId;

      const file = await files.findOne({ fileId });

      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }

      if (file.userID !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const filePath = path.join(
        process.cwd(),
        'public',
        file.folder,
        file.filename
      );


      return res.download(filePath, file.filename, (err) => {
        if (err) {
          return res.status(500).json({ message: err.message });
        }
      });

    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  listFiles: async (req, res) => {
    try {
      const userFiles = await files.find({ userID: req.userId }).sort({ createdAt: -1 });
      res.status(200).json(userFiles);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  deleteFile: async (req, res) => {

    try {
      
      const userID = req.userId;
      const { fileId } = req.params;

      const file = await files.findOne({ fileId });

      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }

      if (file.userID !== userID) {
        return res.status(403).json({ message: "Access denied" });
      }

      const filePath = path.join(
        process.cwd(),
        'public',
        file.folder,
        file.filename
      );

      try {

        await fs.unlink(filePath);

      } catch (err) {

        console.error("Disk deletion failed:", err.message);

        return res.status(500).json({
          message: "Failed to delete file from disk. Aborting database deletion."
        });
      }

      await files.deleteOne({ fileId });

      return res.json({
        message: "File deleted successfully"
      });

    } catch (error) {
      return res.status(500).json({ message: error.message });
    }

  },

  deleteMultipleFiles: async (req, res) => {
  
    try {

    const userID = req.userId;
    const { fileIds } = req.body;

    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return res.status(400).json({ message: "No file IDs provided" });
    }

    const userFiles = await files.find({
      fileId: { $in: fileIds },
      userID: userID
    });

    if (userFiles.length === 0) {
      return res.status(404).json({ message: "No matching files found" });
    }

    const failedDeletes = [];

    for (const file of userFiles) {

      const filePath = path.join(
        process.cwd(),
        "public",
        file.folder,
        file.filename
      );

      try {
        await fs.unlink(filePath);
      } catch (err) {
        console.error("Disk deletion failed:", err.message);
        failedDeletes.push(file.fileId);
      }
    }

    const successfulIds = userFiles
      .map(f => f.fileId)
      .filter(id => !failedDeletes.includes(id));

    await files.deleteMany({
      fileId: { $in: successfulIds },
      userID: userID
    });

    return res.json({
      message: " delete operation completed",
      deletedCount: successfulIds.length,
      failed: failedDeletes
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
},

generateSignedUrl: async (req, res) => {

  try {
    const { fileId } = req.params;
    const userID = req.userId;

    const file = await files.findOne({ fileId, userID });

    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    const expiresInSeconds = 300; // 5 minutes
    const expires = Math.floor(Date.now() / 1000) + expiresInSeconds;

    const data = `${fileId}:${expires}`;

    const signature = crypto
      .createHmac("sha256", process.env.SIGNED_URL_SECRET)
      .update(data)
      .digest("hex");

    const url = `${process.env.BACKEND_DOMAIN}/v1/files/signed-download?fileId=${fileId}&expires=${expires}&signature=${signature}`;
    
    const qrCode = await QRCode.toDataURL(url);
  
    return res.json({
      url,
      qrCode,
      expiresIn: expiresInSeconds
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
},

signedDownload: async (req, res) => {
  
  try {

    const { fileId, expires, signature } = req.query;

    if (!fileId || !expires || !signature) {
      return res.status(400).json({ message: "Missing parameters" });
    }

    const currentTime = Math.floor(Date.now() / 1000);

    if (currentTime > parseInt(expires)) {
      return res.status(403).json({ message: "Link expired" });
    }

    const data = `${fileId}:${expires}`;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.SIGNED_URL_SECRET)
      .update(data)
      .digest("hex");

    if (expectedSignature !== signature) {
      return res.status(403).json({ message: "Invalid signature" });
    }

    const file = await files.findOne({ fileId });

    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    const filePath = path.join(
      process.cwd(),
      "public",
      file.folder,
      file.filename
    );

    // return res.download(filePath, file.filename);

    res.setHeader('Content-Type', file.type);
    res.setHeader('Content-Disposition', `inline; filename="${file.filename}"`);
    return res.sendFile(filePath);

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
},


};

module.exports = filesController;