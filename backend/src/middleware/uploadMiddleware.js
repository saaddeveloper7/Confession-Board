const multer = require('multer');

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_AVATAR_BYTES,
    files: 1,
  },
});

const uploadAvatar = upload.single('avatar');

module.exports = { uploadAvatar };
