// Already correct
const cloudinary = require("cloudinary").v2;
require("dotenv").config();
const multer = require("multer");
const fs = require("fs");
const path = require("path");

// Cloudinary config
cloudinary.config({
    cloud_name: process.env.CLOUDNAME,
    api_key: process.env.CLOUDKEY,
    api_secret: process.env.CLOUDSECRET,
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});

const upload = multer({ storage });

async function uploadFilesToCloudinary(files) {
    const uploadResults = {};
    for (const file of files) {
        try {
            const res = await cloudinary.uploader.upload(file.path, {
                resource_type: 'image',
                folder: 'ticket-receipts',
                public_id: path.parse(file.originalname).name.replace(/\s+/g, '_').toLowerCase()
            });
            uploadResults[file.fieldname] = {
                url: res.secure_url,
                public_id: res.public_id
            };
        } catch (error) {
            console.error(`Failed to upload ${file.fieldname}:`, error);
            throw error;
        } finally {
            fs.unlink(file.path, err => {
                if (err) console.error(`Failed to delete temp file ${file.path}:`, err);
            });
        }
    }
    return uploadResults;
}

module.exports = { upload, uploadFilesToCloudinary };
