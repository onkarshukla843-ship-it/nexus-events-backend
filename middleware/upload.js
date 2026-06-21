const multer = require('multer');
const path = require('path');

// Configure where and how to save the files
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Save it to the folder we just created
    },
    filename: function (req, file, cb) {
        // Create a unique filename: fieldname-timestamp.extension (e.g., image-167890.jpg)
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

// Create the upload middleware
const upload = multer({
    storage: storage,
    limits: { fileSize: 5000000 }, // Set a 5MB file size limit
    fileFilter: function (req, file, cb) {
        // Only accept images!
        const filetypes = /jpeg|jpg|png|webp/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Error: You can only upload image files (JPG, PNG, WEBP)!'));
        }
    }
});

module.exports = upload;