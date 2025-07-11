// src/middlewares/multer.middleware.js

import multer from "multer";
import path from "path"; // ADD this line
import { fileURLToPath } from 'url'; // ADD this line
import { dirname } from 'path'; // ADD this line

// Define __dirname for ES Modules if not already defined (it likely isn't in a module)
const __filename = fileURLToPath(import.meta.url); // ADD this line
const __dirname = dirname(__filename); // ADD this line

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // CHANGE this line: Use an absolute path for reliability
    // path.join() ensures correct path separators across OS
    // '__dirname' is the current directory (middlewares), '..' goes up to 'src', '..' again goes to project root
    cb(null, path.join(__dirname, '..', '..', 'public', 'temp'));
  },
  filename: function (req, file, cb) {
    // CHANGE this line: Make filename unique to prevent overwrites
    cb(null, Date.now() + '-' + file.originalname);
  }
})

export const upload = multer({
    storage,
})
