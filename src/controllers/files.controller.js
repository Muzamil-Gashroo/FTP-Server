const files = require('../models/files.model');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs').promises;

function getMaxSize(type) {
  if (type.startsWith("image/")) return 10 * 1024 * 1024; // 10MB
  if (type.startsWith("video/")) return 50 * 1024 * 1024; // 50MB
  if (type === "application/pdf") return 20 * 1024 * 1024; // 20MB
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

      const fileId = uuidv4();

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

    return res.json({
      message: "Files uploaded successfully",
      count: uploadedFiles.length,
      files: uploadedFiles
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

      const file = await files.findOne({ fileId });

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

      if (file.userID !== req.userId) {
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
}  



};

module.exports = filesController;