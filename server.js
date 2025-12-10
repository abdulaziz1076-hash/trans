import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import OpenAI from "openai";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

// إنشاء مجلد uploads إذا لم يكن موجود
const uploadFolder = path.join('.', 'uploads');
if (!fs.existsSync(uploadFolder)) fs.mkdirSync(uploadFolder);

// إعداد multer لرفع الفيديو
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadFolder),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

// إعداد OpenAI API
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// تمكين CORS
app.use(cors());

// تقديم ملفات static من مجلد public
app.use(express.static('public'));

// نقطة API لترجمة الفيديو
app.post("/translate", upload.single("video"), async (req, res) => {
  try {
    const filePath = req.file.path;

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: "whisper-1",
      language: "ar"
    });

    fs.unlinkSync(filePath); // حذف الفيديو بعد الترجمة
    res.json({ translation: transcription.text });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// تشغيل السيرفر
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
