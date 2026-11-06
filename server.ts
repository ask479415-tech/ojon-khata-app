
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

// CORS CONFIGURATION
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

const PORT = Number(process.env.PORT || 3000);

app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ extended: true, limit: "30mb" }));

// GEMINI CLIENT
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY পাওয়া যায়নি। Secrets পরীক্ষা করুন।");
  }

  return new GoogleGenAI({ apiKey });
}



 // GEMINI RETRY WITH FALLBACK MODEL
async function generateWithRetry(request: any) {
  const ai = getGeminiClient();

  const models = [
    "gemini-3.8-flash",
    "gemini-3.7-flash"
  ];

  let lastError: any;

  for (const model of models) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`Trying model: ${model}, attempt: ${attempt}`);

        return await ai.models.generateContent({
          ...request,
          model
        });

      } catch (error: any) {
        lastError = error;

        const status = Number(
          error?.status ||
          error?.statusCode ||
          error?.error?.code ||
          0
        );

        const message = String(error?.message || "");

        const temporary =
          status === 429 ||
          status === 503 ||
          status >= 500 ||
          message.includes("UNAVAILABLE") ||
          message.includes("RESOURCE_EXHAUSTED");

        if (!temporary) {
          throw error;
        }

        console.log(`Temporary Gemini error: ${message}`);

        if (attempt < 2) {
          await new Promise(resolve =>
            setTimeout(resolve, 3000 * attempt)
          );
        }
      }
    }
  }

  throw lastError || new Error("Gemini service unavailable.");
}

// HEALTH CHECK
app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "Ojon Khata API is running"
  });
});

// IMAGE TO WEIGHT OCR
app.post("/api/ocr-weights", async (req, res) => {
  try {
    const {
      imageBase64,
      mimeType = "image/jpeg",
      hint
    } = req.body || {};

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return res.status(400).json({
        success: false,
        error: "ছবি পাওয়া যায়নি। আবার ছবি তুলুন।"
      });
    }

    const cleanBase64 = imageBase64.replace(
      /^data:image\/[a-zA-Z0-9.+-]+;base64,/,
      ""
    );

    if (!cleanBase64) {
      return res.status(400).json({
        success: false,
        error: "ছবির ডেটা খালি।"
      });
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp"
    ];

    if (!allowedTypes.includes(mimeType)) {
      return res.status(400).json({
        success: false,
        error: "JPEG, PNG অথবা WEBP ছবি ব্যবহার করুন।"
      });
    }

    const imagePart = {
      inlineData: {
        mimeType,
        data: cleanBase64
      }
    };

    const prompt = `
You are an expert handwritten weight reader.

Read every handwritten weight from this image.

Both Bengali and English numbers must be recognized.

Examples:
1.5, 2, 3.5, 10
১.৫, ২, ৩.৫, ১০

Rules:

1. Read all visible weights.
2. Read from top to bottom.
3. Read every column.
4. Do not skip any readable weight.
5. Convert Bengali numerals into numeric values.
6. Convert grams into kilograms.
7. Example: 500 gram = 0.5 kg.
8. Example: 1500 gram = 1.5 kg.
9. Example: 1/2 kg = 0.5 kg.
10. Example: 1 1/2 kg = 1.5 kg.
11. Do not count headings, dates or unrelated numbers.
12. Never invent unreadable numbers.
13. Keep duplicate weights if they appear separately.
14. Use low confidence when handwriting is unclear.
15. All returned values must be in kilograms.

User hint: ${hint || "No additional hint"}

Return valid JSON only.
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

        systemInstruction:
          "Read handwritten weight values carefully. " +
          "Recognize Bengali and English numerals. " +
          "Convert all weights to kilograms. " +
          "Never invent numbers. Return valid JSON only.",

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
                    type: Type.STRING,
                    enum: ["high", "medium", "low"]
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

    const responseText = response.text;

    if (!responseText) {
      throw new Error("AI থেকে কোনো ফলাফল পাওয়া যায়নি।");
    }

    const parsedData = JSON.parse(responseText);

    if (!Array.isArray(parsedData.weights)) {
      throw new Error("AI-এর ফলাফল সঠিক নয়।");
    }

    // VALIDATE WEIGHTS
    const weights = parsedData.weights
      .filter((item: any) => {
        return (
          Number.isFinite(Number(item.value)) &&
          Number(item.value) >= 0
        );
      })
      .map((item: any) => ({
        value: Number(item.value),
        originalText: String(item.originalText || ""),
        confidence: ["high", "medium", "low"].includes(item.confidence)
          ? item.confidence
          : "medium",
        note: String(item.note || "")
      }));

    // CALCULATE TOTAL KG
    const totalKg = weights.reduce(
      (sum: number, item: any) => sum + item.value,
      0
    );

    return res.status(200).json({
      success: true,
      data: {
        weights,
        totalKg: Number(totalKg.toFixed(3)),
        totalGram: Math.round(totalKg * 1000),
        count: weights.length,
        detectedLanguage: parsedData.detectedLanguage || "",
        summaryNote: parsedData.summaryNote || ""
      }
    });

  } catch (error: any) {
    console.error("OCR ERROR:", error);

    const message = String(error?.message || "");

    const isApiKeyError =
      error?.status === 403 ||
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
          item.endsWith(".zip") ||
          item === ".env"
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
      compressionOptions: {
        level: 9
      }
    });

    res.setHeader("Content-Type", "application/zip");

    res.setHeader(
      "Content-Disposition",
      'attachment; filename="ojon-khata-app.zip"'
    );

    return res.send(buffer);

  } catch (error) {
    console.error("ZIP ERROR:", error);

    return res.status(500).json({
      success: false,
      error: "ZIP তৈরি করা যায়নি।"
    });
  }
});

// UNKNOWN API ROUTE
app.use("/api", (req, res) => {
  return res.status(404).json({
    success: false,
    error: `API route not found: ${req.method} ${req.originalUrl}`
  });
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer().catch(error => {
  console.error("SERVER START ERROR:", error);
  process.exit(1);
});
