
import multer from "multer";
// import path from "path";
// import { fileURLToPath } from 'url'; 
// import { dirname } from 'path'; 

// // Define __dirname for ES Modules if not already defined (it likely isn't in a module)
// const __filename = fileURLToPath(import.meta.url); // ADD this line
// const __dirname = dirname(__filename); // ADD this line

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', '..', 'public', 'temp'));
  },
  filename: function (req, file, cb) {
  
    cb(null, Date.now() + '-' + file.originalname);
  }
})

export const upload = multer({
    storage,
})
