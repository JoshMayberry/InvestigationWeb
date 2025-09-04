import cors from "cors"
import express from "express"
import bodyParser from "body-parser"
import fs from "fs/promises"
import path from "path"
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express()
app.use(cors())
app.use(bodyParser.json())

const DATA_ROOT = path.resolve(__dirname, "data");

function resolveFilePath(folder: string, filename: string) {
  const dirPath = path.resolve(DATA_ROOT, folder);
  const hasExt = path.extname(filename) !== "";
  const fname = hasExt ? filename : filename + ".json";
  return { dirPath, filePath: path.resolve(dirPath, fname) };
}

async function loadFile(folder: string, filename: string) {
  try {
    const { filePath } = resolveFilePath(folder, filename);
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

async function saveFile(folder: string, filename: string, data: any) {
  const { dirPath, filePath } = resolveFilePath(folder, filename);
  await fs.mkdir(dirPath, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

app.get("/api/ping", (req, res) => {
  res.json({ ok: true });
});

// GET /data?folder=soundboard&filename=persona5
app.get("/api/data", async (req, res) => {
  const folder = req.query.folder as string;
  const filename = req.query.filename as string;
  if (!folder || !filename) {
    return res.status(400).json({ error: "Missing folder or filename" });
  }

  console.log("Loading file:", folder, filename);
  const data = await loadFile(folder, filename);
  res.json(data);
});

// POST /data  { folder, filename, data }
app.post("/api/data", async (req, res) => {
  const { folder, filename, data } = req.body;
  if (!folder || !filename || !data) {
    return res.status(400).json({ error: "Missing folder, filename, or data" });
  }

  console.log("Saving file:", folder, filename);
  await saveFile(folder, filename, data);
  res.sendStatus(200);
});

console.log("Serving api")
export default app
