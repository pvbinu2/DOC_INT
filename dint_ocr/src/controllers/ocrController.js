import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createWorker } from 'tesseract.js';
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

            const cmd = `pdftoppm -png -r 300 "${pdfPath}" "${path.join(tempDir, 'page')}"`;
            execSync(cmd);

            const files = await fs.readdir(tempDir);
            const imageFiles = files.filter((f) => f.endsWith('.png')).sort();
            const results = [];

            const worker = await createWorker("eng", 1);
            await worker.setParameters({
                ttessedit_create_tsv: "1"
            })

            for (let i = 0; i < imageFiles.length; i++) {
                const imgPath = path.join(tempDir, imageFiles[i]);
                const imgBuffer = await fs.readFile(imgPath);

                const result = await worker.recognize(imgBuffer, {}, { tsv: "1" })
                const data = result.data;
                const text = data.text;
                const confidence = data.confidence;

                const lines = data.tsv.trim().split('\n');

                const words = lines
                    .slice(1)
                    .map(l => l.split('\t'))
                    .filter(cols => cols[0] === '5' && cols[11]?.trim())
                    .map(cols => ({
                        text: cols[11],
                        bbox: {
                            x0: parseInt(cols[6]),
                            y0: parseInt(cols[7]),
                            x1: parseInt(cols[6]) + parseInt(cols[8]),
                            y1: parseInt(cols[7]) + parseInt(cols[9]),
                        },
                        confidence: parseFloat(cols[10]),
                    }));

                results.push({ pageNumber: i + 1, text, confidence, words: words });
            }

            await worker.terminate();
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
