import express from 'express';
import multer from 'multer';
import ocrController from './controllers/ocrController.js'

const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

router.get('/', ocrController.healthCheck);
router.post('/ocr/generate', upload.single('file'), ocrController.genrateOcr)


export default router;
