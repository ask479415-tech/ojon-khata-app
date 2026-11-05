
import express from "express";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import JSZip from "jszip";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  return new GoogleGenAI({ apiKey });
}

async function generateWithRetry(request: any) {
  const ai = getGeminiClient();

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await ai.models.generateContent(request);
    } catch (error: any) {
      const status = Number(error?.status || error?.statusCode || 0);
      const message = String(error?.message || "");

      const temporary =
        status === 429 ||
        status === 503 ||
        status >= 500 ||
        message.includes("UNAVAILABLE") ||
        message.includes("RESOURCE_EXHAUSTED");

      if (!temporary || attempt === 3) {
        throw error;
      }

      await new Promise(resolve =>
        setTimeout(resolve, attempt * 2000)
      );
    }
  }

  throw new Error("Gemini service unavailable.");
}

// IMAGE TO WEIGHT OCR API
app.post("/api/ocr-weights", async (req, res) => {
  try {
    const {
      imageBase64,
      mimeType = "image/jpeg",
      hint
    } = req.body;

    if (!imageBase64) {
      return res.status(400).json({
        success: false,
        error: "ছবি পাওয়া যায়নি।"
      });
    }

    const cleanBase64 = imageBase64.replace(
      /^data:image\/[^;]+;base64,/,
      ""
    );

    const imagePart = {
      inlineData: {
        mimeType,
        data: cleanBase64
      }
    };

    const prompt = `
ছবিতে হাতে লেখা ওজনের সংখ্যা পড়ুন।

English এবং Bengali দুই ধরনের সংখ্যা চিনুন।

উদাহরণ:
1.5, 2, 3.5, 10
১.৫, ২, ৩.৫, ১০

নিয়ম:
1. ছবির সব ওজন খুঁজে বের করুন।
2. উপর থেকে নিচে পড়ুন।
3. একাধিক কলাম থাকলে সব পড়ুন।
4. 1/2 হলে 0.5 করুন।
5. 1 1/2 হলে 1.5 করুন।
6. গ্রাম থাকলে KG-তে রূপান্তর করুন।
7. কোনো সংখ্যা পরিষ্কার না হলে confidence low দিন।
8. একই সংখ্যা দুবার থাকলে দুবারই রাখুন।
9. কোনো সংখ্যা অনুমান করে বানাবেন না।

সব ফলাফল JSON আকারে দিন।
${hint ? `User hint: ${hint}` : ""}
`;

    const response = await generateWithRetry({
      model: "gemini-3.8-flash",
      contents: [
        {
          role: "user",
          parts: [
            imagePart,
            { text: prompt }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        systemInstruction: `
You are an expert handwritten weight OCR reader.
Read English and Bengali handwritten numbers carefully.
Convert all weights into kilograms.
Never invent unreadable numbers.
Return valid JSON only.
`,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            weights: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  value: {
                    type: Type.NUMBER
                  },
                  originalText: {
                    type: Type.STRING
                  },
                  confidence: {
                    type: Type.STRING
                  },
                  note: {
                    type: Type.STRING
                  }
                },
                required: [
                  "value",
                  "originalText",
                  "confidence"
                ]
              }
            },
            detectedLanguage: {
              type: Type.STRING
            },
            summaryNote: {
              type: Type.STRING
            }
          },
          required: ["weights"]
        }
      }
    });

    const responseText = response.text || "{}";
    const parsedData = JSON.parse(responseText);

    if (!Array.isArray(parsedData.weights)) {
      throw new Error("Invalid weight data returned by AI.");
    }

    // Calculate total automatically
    const totalKg = parsedData.weights.reduce(
      (sum: number, item: any) => {
        const value = Number(item.value);
        return sum + (
          Number.isFinite(value) && value >= 0 ? value : 0
        );
      },
      0
    );

    return res.json({
      success: true,
      data: {
        ...parsedData,
        totalKg: Number(totalKg.toFixed(3))
      }
    });

  } catch (error: any) {
    console.error("OCR ERROR:", error);

    const message = String(error?.message || "");

    const isApiKeyError =
      error?.status === 403 ||
      error?.status === 400 ||
      message.includes("API_KEY_INVALID") ||
      message.includes("PERMISSION_DENIED");

    return res.status(500).json({
      success: false,
      error: isApiKeyError
        ? "Gemini API Key সমস্যা। Settings > Secrets পরীক্ষা করুন।"
        : message || "ছবি থেকে ওজন পড়তে সমস্যা হয়েছে।"
    });
  }
});

// DOWNLOAD APP ZIP
app.get("/api/download-app-zip", async (_req, res) => {
  try {
    const zip = new JSZip();

    function addDirToZip(currentPath: string, zipFolder: any) {
      const items = fs.readdirSync(currentPath);

      for (const item of items) {
        if (
          [
            "node_modules",
            ".git",
            "dist",
            ".aistudio",
            ".DS_Store"
          ].includes(item) ||
          item.endsWith(".zip")
        ) {
          continue;
        }

        const fullPath = path.join(currentPath, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          const subFolder = zipFolder.folder(item);
          if (subFolder) {
            addDirToZip(fullPath, subFolder);
          }
        } else {
          zipFolder.file(item, fs.readFileSync(fullPath));
        }
      }
    }

    addDirToZip(__dirname, zip);

    const buffer = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 9 }
    });

    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="ojon-khata-app.zip"'
    );

    res.send(buffer);

  } catch (error) {
    console.error("ZIP ERROR:", error);
    res.status(500).json({
      success: false,
      error: "ZIP তৈরি করা যায়নি।"
    });
  }
});

// START SERVER
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer } = await import("vite");

    const vite = await createServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== "true"
      },
      appType: "spa"
    });

    app.use(vite.middlewares);

  } else {
    app.use(express.static(path.join(__dirname, "dist")));

    app.get("*", (_req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(
      `Server listening on port ${PORT}`
    );
  });
}

startServer().catch(error => {
  console.error("SERVER START ERROR:", error);
  process.exit(1);
});
          
