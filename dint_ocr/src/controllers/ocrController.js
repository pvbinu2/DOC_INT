import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import Tesseract from 'tesseract.js';
import { execSync } from 'child_process';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';


const Ocr = class OcrController {
    constructor() {
    }

    healthCheck(req, res) {
        res.json({ status: "ok" })
    }

    async genrateOcr(req, res) {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const tempId = uuidv4();
        const tempDir = path.join(os.tmpdir(), `ocr-${tempId}`);
        const pdfPath = path.join(tempDir, 'input.pdf');

        try {

          

            await fs.mkdir(tempDir);
            await fs.writeFile(pdfPath, req.file.buffer);

            const cmd = `pdftoppm -png "${pdfPath}" "${path.join(tempDir, 'page')}"`;
            execSync(cmd);

            const files = await fs.readdir(tempDir);
            const imageFiles = files.filter((f) => f.endsWith('.png')).sort();
            const results = [];

            for (let i = 0; i < imageFiles.length; i++) {
                const imgPath = path.join(tempDir, imageFiles[i]);
                const imgBuffer = await fs.readFile(imgPath);

                const {
                    data: { text },
                } = await Tesseract.recognize(imgBuffer, 'eng');

                results.push({ pageNumber: i + 1, text });
            }

            res.json(results);

        } catch (err) {
            console.error('OCR error:', err);
            res.status(500).json({ error: 'OCR failed', detail: err.message });
        } finally {
            // Clean up
            try {
                await fs.rm(tempDir, { recursive: true, force: true });
            } catch (cleanupErr) {
                console.warn('Failed to clean up temp folder:', cleanupErr.message);
            }
        }
    }
}

const ocrObject = new Ocr()

export default ocrObject;
