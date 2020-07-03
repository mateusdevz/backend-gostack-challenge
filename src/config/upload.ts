import path from 'path';
import multer from 'multer';
import crypto from 'crypto';

const tempFolder = path.resolve(__dirname, '..', '..', 'tmp');

export default {
  directory: tempFolder,
  storage: multer.diskStorage({
    destination: tempFolder,
    filename(req, file, callback) {
      const fileHash = crypto.randomBytes(8).toString('hex');
      const fileName = `${fileHash}-${file.originalname}`;

      callback(null, fileName);
    },
  }),
};
