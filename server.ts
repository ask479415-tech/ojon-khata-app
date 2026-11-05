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

// Support base64 image uploads up to 25MB
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Server-side Gemini API client initialization
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in the environment.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Automatic retry for temporary Gemini errors
async function generateWithRetry(request: any) {
  const ai = getGeminiClient();

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await ai.models.generateContent(request);
    } catch (error: any) {
      const status = error?.status || error?.statusCode;
      const message = String(error?.message || "");

      const temporaryError =
        status === 503 ||
        status === 429 ||
        status >= 500 ||
        message.includes("UNAVAILABLE") ||
        message.includes("RESOURCE_EXHAUSTED");

      if (!temporaryError || attempt === 3) {
        throw error;
      }

      await new Promise(resolve =>
        setTimeout(resolve, attempt * 2000)
      );
    }
  }

  throw new Error("Gemini service unavailable");
} {
    const { imageBase64, mimeType = "image/jpeg", hint } = req.body;

    if (!imageBase64) {
      return res.status(400).json({
        success: false,
        error: "ছবি পাওয়া যায়নি (No image data received).",
      });
    }

    // Clean base64 string if it contains data URL prefix
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+]+;base64,/, "");

    const ai = getGeminiClient();

    const imagePart = {
      inlineData: {
        mimeType: mimeType || "image/jpeg",
        data: cleanBase64,
      },
    };

    const promptText = `Analyze this image containing handwritten weight entries (e.g., 1.5, 2, 3.5, 10, etc., or Bengali numerals ১.৫, ২, ৩.৫, ১০ etc.).
${hint ? `User hint: ${hint}` : ""}

Task:
1. Detect ALL handwritten weight numbers written on the paper, diary, note, sack, board, or slate.
2. Read both English numerals (0,1,2,3,4,5,6,7,8,9) and Bengali numerals (০,১,২,৩,৪,৫,৬,৭,৮,৯).
3. If fractions or half weights are written (e.g. 1 1/2 or ১ ১/২ or 1/2 or .5 or ১/২), convert to decimals (1.5, 0.5).
4. If weights are listed in multiple columns or separated by commas, plus signs, dashes, or spaces, extract each individual weight as a separate entry in order.
5. If units like 'kg', 'কেজি', 'g', 'গ্রাম', 'মন' (40 kg) are indicated, normalize the numeric 'value' to Kilograms (KG).
6. Set confidence ('high', 'medium', 'low') based on visual clarity and handwriting legibility.
7. Return a clean JSON output following the schema.`;

    const textPart = {
      text: promptText,
    };
const response = await generateWithRetry({({
      model: "gemini-3.8-flash",
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        systemInstruction: `You are an expert OCR reader specialized in reading handwritten numbers and weight measurements from papers, notebooks, diaries, bags, boards, or delivery receipts.
The handwriting may be in English numerals (0, 1, 2, 3, 4, 5, 6, 7, 8, 9) or Bengali numerals (০, ১, ২, ৩, ৪, ৫, ৬, ৭, ৮, ৯) or mixed.
Common patterns in weight tallies:
- Single decimals like 1.5, 2, 3.5, 10.25, 0.75 or ১.৫, ২, ৩.৫, ১০.২৫
- Values listed in vertical columns, horizontal rows, or separated by commas, plus signs, dashes, slashes, or tally ticks.
- Fractions like '1 1/2' which is 1.5, '1/2' which is 0.5, '1/4' which is 0.25.
- Sometimes accompanied by 'kg', 'কেজি', 'gm', 'গ্রাম', 'mon', 'মন', 'বস্তা', 'bag', 'tally'.
- If a unit is specified (e.g. grams like 500g), convert it to KG (e.g. 0.5 kg) or mark value as decimal KG.
Carefully inspect every handwritten stroke. If a number looks ambiguous (e.g. 1 vs 7, 4 vs 9, 3 vs 8, ১ vs ৪, ৪ vs ৮), set confidence to "medium" or "low" so the user can verify it during the verification step!
Extract all handwritten weight figures in reading order (top-to-bottom, left-to-right, or by columns).`,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            weights: {
              type: Type.ARRAY,
              description: "List of all recognized individual weight numbers in KG.",
              items: {
                type: Type.OBJECT,
                properties: {
                  value: {
                    type: Type.NUMBER,
                    description: "The numeric weight value converted to float (e.g., 1.5, 2, 3.5)",
                  },
                  originalText: {
                    type: Type.STRING,
                    description: "The raw text or handwritten representation as seen (e.g. '১.৫', '1.5', '3.5 kg')",
                  },
                  confidence: {
                    type: Type.STRING,
                    description: "Confidence level: 'high' for very clear digits, 'medium' for slightly faded/ambiguous, 'low' for guessed/scratched digits",
                  },
                  note: {
                    type: Type.STRING,
                    description: "Optional brief label or location hint, e.g., 'কলাম ১, সারি ২'",
                  },
                },
                required: ["value", "originalText", "confidence"],
              },
            },
            detectedLanguage: {
              type: Type.STRING,
              description: "Script style detected: 'bengali', 'english', or 'mixed'",
            },
            summaryNote: {
              type: Type.STRING,
              description: "Short informative summary in Bengali explaining how many items were found and any notes on handwriting clarity",
            },
          },
          required: ["weights"],
        },
      },
    });

    const responseText = response.text || "{}";
    let parsedData: any;
    try {
      parsedData = JSON.parse(responseText);
    } catch (parseErr) {
      console.error("Failed to parse Gemini JSON:", responseText);
      return res.status(500).json({
        success: false,
        error: "ওজন তালিকা পার্স করতে ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।",
      });
    }

    return res.json({
      success: true,
      data: parsedData,
    });
  } catch (error: any) {
    console.error("Error in /api/ocr-weights:", error);
    const isApiKeyError =
      error?.status === 403 ||
      error?.status === 400 ||
      error?.message?.includes("API_KEY_INVALID") ||
      error?.message?.includes("PERMISSION_DENIED");

    return res.status(500).json({
      success: false,
      error: isApiKeyError
        ? "API Key সমস্যা হয়েছে। অনুগ্রহ করে Settings > Secrets প্যানেলে আপনার GEMINI_API_KEY যাচাই করুন।"
        : error?.message || "ছবি থেকে ওজন পড়তে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।",
    });
  }
});

// Endpoint to download the full app project as a zip file
app.get("/api/download-app-zip", async (_req, res) => {
  try {
    const zip = new JSZip();

    function addDirToZip(currentPath: string, zipFolder: any) {
      const items = fs.readdirSync(currentPath);
      for (const item of items) {
        if (
          item === "node_modules" ||
          item === ".git" ||
          item === "dist" ||
          item === ".aistudio" ||
          item === ".DS_Store" ||
          item.endsWith(".zip")
        ) {
          continue;
        }

        const fullPath = path.join(currentPath, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          const subFolder = zipFolder.folder(item);
          if (subFolder) addDirToZip(fullPath, subFolder);
        } else {
          const content = fs.readFileSync(fullPath);
          zipFolder.file(item, content);
        }
      }
    }

    addDirToZip(__dirname, zip);

    const buffer = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 9 },
    });

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", 'attachment; filename="ojon-khata-app.zip"');
    res.send(buffer);
  } catch (err: any) {
    console.error("Error creating zip:", err);
    res.status(500).json({ success: false, error: "Failed to create app zip." });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== "true",
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
