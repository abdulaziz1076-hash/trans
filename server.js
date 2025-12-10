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

// إعداد OpenAI API باستخدام متغير البيئة
if (!process.env.OPENAI_API_KEY) {
  console.error("❌ مفتاح OpenAI API غير موجود! ضع OPENAI_API_KEY في Environment Variables على Render.");
  process.exit(1); // إيقاف السيرفر إذا المفتاح مفقود
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(cors());
app.use(express.static('public'));

// نقطة API لترجمة الفيديو
app.post("/translate", upload.single("video"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "لم يتم رفع أي فيديو" });
    }

    const filePath = req.file.path;

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: "whisper-1",
      language: "ar"
    });

    fs.unlinkSync(filePath); // حذف الفيديو بعد الترجمة

    if (transcription && transcription.text) {
      res.json({ translation: transcription.text });
    } else {
      res.json({ error: "لم يتمكن Whisper من استخراج النص" });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "خطأ في الترجمة: " + err.message });
  }
});

// تشغيل السيرفر
app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
