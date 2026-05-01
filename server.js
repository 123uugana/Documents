import "dotenv/config";

import bcrypt from "bcrypt";
import cors from "cors";
import express from "express";
import session from "express-session";
import multer from "multer";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
const port = Number(process.env.PORT || 3000);
const rootDir = fileURLToPath(new URL(".", import.meta.url));
const dataFile = resolvePath(process.env.DATA_FILE_PATH || "./data.json");
const uploadsDir = resolvePath(process.env.UPLOADS_DIR || "./uploads");
const sessionSecret = process.env.SESSION_SECRET || "local-dev-session-secret";
const adminUsername = process.env.ADMIN_USERNAME || "";
const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH || "";
const frontendOrigins = (process.env.FRONTEND_ORIGINS || [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
  "https://123uugana.github.io"
].join(","))
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const listNames = ["features", "abouts", "says", "members", "membershipApplications"];
const adminListNames = ["features", "abouts", "says", "members", "membershipApplications"];
const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];
const allowedImageExtensions = [".jpg", ".jpeg", ".png", ".webp"];

const defaultData = {
  stats: {
    members: 0,
    events: 0,
    trips: 0,
    community: 1
  },
  features: [
    {
      id: randomUUID(),
      title: "Хамтын аялал",
      text: "Хотын богино ride-аас эхлээд урт аялал хүртэл аюулгүй, зохион байгуулалттай хөдөлнө.",
      createdAt: new Date().toISOString()
    },
    {
      id: randomUUID(),
      title: "Сургалт ба зөвлөгөө",
      text: "Шинэ rider-уудад хамгаалалт, техник, замын соёлын талаар туршлага хуваалцана.",
      createdAt: new Date().toISOString()
    },
    {
      id: randomUUID(),
      title: "Дэмждэг орчин",
      text: "Нэгнээ урамшуулж, хамтдаа илүү итгэлтэй, илүү чадварлаг болдог community.",
      createdAt: new Date().toISOString()
    }
  ],
  abouts: [
    {
      id: randomUUID(),
      text: "Lady Riders Mongolia бол мото сонирхдог эмэгтэйчүүдийн нээлттэй, эерэг нэгдэл.",
      createdAt: new Date().toISOString()
    }
  ],
  says: [
    {
      id: randomUUID(),
      text: "Анхны аялалдаа ганцаараа биш гэдгээ мэдэрсэн нь хамгийн гоё байсан.",
      name: "Саруул",
      createdAt: new Date().toISOString()
    }
  ],
  members: [],
  membershipApplications: [],
  contact: {
    phone: "-",
    facebook: "Lady Riders Mongolia",
    instagram: "https://www.instagram.com/lady_riders_mongolia_wmc/"
  }
};

const upload = multer({
  storage: multer.diskStorage({
    destination(request, file, callback) {
      mkdir(uploadsDir, { recursive: true })
        .then(() => callback(null, uploadsDir))
        .catch((error) => callback(error));
    },
    filename(request, file, callback) {
      const extension = extname(file.originalname).toLowerCase();
      callback(null, `${Date.now()}-${randomUUID()}${extension}`);
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter(request, file, callback) {
    const extension = extname(file.originalname).toLowerCase();

    if (!allowedImageTypes.includes(file.mimetype) || !allowedImageExtensions.includes(extension)) {
      callback(new Error("Зөвхөн jpg, png, webp зураг upload хийнэ үү."));
      return;
    }

    callback(null, true);
  }
});

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  credentials: true,
  origin(origin, callback) {
    if (!origin || frontendOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked origin: ${origin}`));
  }
}));
app.use(session({
  name: "lady_riders_admin",
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 4
  }
}));

app.get("/api/auth/me", (request, response) => {
  response.json({
    loggedIn: Boolean(request.session.admin),
    username: request.session.admin?.username || null
  });
});

app.post("/api/auth/login", async (request, response) => {
  const { username, password } = request.body;

  if (!adminUsername || !adminPasswordHash) {
    response.status(500).json({ error: "Admin login тохиргоо дутуу байна." });
    return;
  }

  const usernameOk = username === adminUsername;
  const passwordOk = password
    ? await bcrypt.compare(password, adminPasswordHash)
    : false;

  if (!usernameOk || !passwordOk) {
    response.status(401).json({ error: "Username эсвэл password буруу байна." });
    return;
  }

  request.session.admin = { username: adminUsername };
  response.json({ ok: true, username: adminUsername });
});

app.post("/api/auth/logout", (request, response) => {
  request.session.destroy(() => {
    response.clearCookie("lady_riders_admin", {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production"
    });
    response.json({ ok: true });
  });
});

app.get("/api/data", async (request, response) => {
  const data = await readData();
  response.json(data);
});

app.post("/api/membership", upload.fields([
  { name: "profilePhoto", maxCount: 1 },
  { name: "motorcyclePhoto", maxCount: 1 }
]), async (request, response) => {
  if (!request.body.firstName || !request.body.mobilePhone || !request.body.email) {
    response.status(400).json({ error: "Required fields are missing" });
    return;
  }

  const data = await readData();
  const application = {
    id: randomUUID(),
    ...removeReadonlyFields(request.body),
    profilePhotoPath: getUploadedPath(request.files, "profilePhoto"),
    motorcyclePhotoPath: getUploadedPath(request.files, "motorcyclePhoto"),
    createdAt: new Date().toISOString()
  };

  data.membershipApplications.unshift(application);
  await saveData(data);

  response.status(201).json(application);
});

app.get("/api/:listName", async (request, response) => {
  const listName = request.params.listName;

  if (!isListName(listName)) {
    response.status(404).json({ error: "List not found" });
    return;
  }

  const data = await readData();
  response.json(data[listName]);
});

app.get("/api/:listName/:id", async (request, response) => {
  const { listName, id } = request.params;

  if (!isListName(listName)) {
    response.status(404).json({ error: "List not found" });
    return;
  }

  const data = await readData();
  const item = data[listName].find((currentItem) => currentItem.id === id);

  if (!item) {
    response.status(404).json({ error: "Item not found" });
    return;
  }

  response.json(item);
});

app.post("/api/members", async (request, response) => {
  if (!request.body.name || !request.body.phone || !request.body.bike) {
    response.status(400).json({ error: "Required fields are missing" });
    return;
  }

  const data = await readData();
  const member = {
    id: randomUUID(),
    ...removeReadonlyFields(request.body),
    createdAt: new Date().toISOString()
  };

  data.members.unshift(member);
  data.stats.members = Number(data.stats.members || 0) + 1;
  await saveData(data);

  response.status(201).json(member);
});

app.post("/api/:listName", requireAdmin, async (request, response) => {
  const listName = request.params.listName;

  if (!isAdminListName(listName)) {
    response.status(404).json({ error: "List not found" });
    return;
  }

  const data = await readData();
  const item = {
    id: randomUUID(),
    ...removeReadonlyFields(request.body),
    createdAt: new Date().toISOString()
  };

  data[listName].unshift(item);
  await saveData(data);

  response.status(201).json(item);
});

app.put("/api/:listName/:id", requireAdmin, async (request, response) => {
  const { listName, id } = request.params;

  if (!isAdminListName(listName)) {
    response.status(404).json({ error: "List not found" });
    return;
  }

  const data = await readData();
  const itemIndex = data[listName].findIndex((item) => item.id === id);

  if (itemIndex === -1) {
    response.status(404).json({ error: "Item not found" });
    return;
  }

  data[listName][itemIndex] = {
    ...data[listName][itemIndex],
    ...removeReadonlyFields(request.body),
    updatedAt: new Date().toISOString()
  };

  await saveData(data);
  response.json(data[listName][itemIndex]);
});

app.delete("/api/:listName/:id", requireAdmin, async (request, response) => {
  const { listName, id } = request.params;

  if (!isAdminListName(listName)) {
    response.status(404).json({ error: "List not found" });
    return;
  }

  const data = await readData();
  const itemIndex = data[listName].findIndex((item) => item.id === id);

  if (itemIndex === -1) {
    response.status(404).json({ error: "Item not found" });
    return;
  }

  const [deletedItem] = data[listName].splice(itemIndex, 1);
  await saveData(data);

  response.json(deletedItem);
});

app.patch("/api/stats/:key", requireAdmin, async (request, response) => {
  const key = request.params.key;
  const amount = Number(request.body.amount || 0);

  if (!Object.hasOwn(defaultData.stats, key)) {
    response.status(404).json({ error: "Stat not found" });
    return;
  }

  const data = await readData();
  const minimum = key === "community" ? 1 : 0;
  const currentValue = Number(data.stats[key] || 0);

  data.stats[key] = Math.max(minimum, currentValue + amount);
  await saveData(data);

  response.json(data.stats);
});

app.put("/api/contact", requireAdmin, async (request, response) => {
  const data = await readData();
  data.contact = {
    phone: request.body.phone || "-",
    facebook: request.body.facebook || "-",
    instagram: request.body.instagram || "-"
  };

  await saveData(data);
  response.json(data.contact);
});

app.use("/uploads", express.static(uploadsDir, {
  etag: false,
  setHeaders(response) {
    response.setHeader("Cache-Control", "public, max-age=86400");
  }
}));

app.use(blockPrivateFiles);
app.use(express.static(rootDir, {
  dotfiles: "ignore",
  etag: false,
  setHeaders(response) {
    response.setHeader("Cache-Control", "no-store");
  }
}));

app.use((error, request, response, next) => {
  if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
    response.status(400).json({ error: "Зураг 5MB-аас бага байх ёстой." });
    return;
  }

  if (error) {
    response.status(400).json({ error: error.message || "Upload алдаа гарлаа." });
    return;
  }

  next();
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

async function readData() {
  try {
    const fileContent = await readFile(dataFile, "utf8");
    const savedData = JSON.parse(fileContent);
    return mergeWithDefaultData(savedData);
  } catch {
    const firstData = clone(defaultData);
    await saveData(firstData);
    return firstData;
  }
}

async function saveData(data) {
  await mkdir(dirname(dataFile), { recursive: true });
  await writeFile(dataFile, JSON.stringify(data, null, 2), "utf8");
}

function requireAdmin(request, response, next) {
  if (!request.session.admin) {
    response.status(401).json({ error: "Admin login шаардлагатай." });
    return;
  }

  next();
}

function isListName(value) {
  return listNames.includes(value);
}

function isAdminListName(value) {
  return adminListNames.includes(value);
}

function getUploadedPath(files, fieldName) {
  const file = files?.[fieldName]?.[0];
  return file ? `/uploads/${file.filename}` : "";
}

function removeReadonlyFields(item = {}) {
  const { id, createdAt, updatedAt, profilePhoto, motorcyclePhoto, ...editableFields } = item;
  return editableFields;
}

function mergeWithDefaultData(savedData) {
  return {
    ...clone(defaultData),
    ...savedData,
    stats: {
      ...defaultData.stats,
      ...(savedData.stats || {})
    },
    contact: {
      ...defaultData.contact,
      ...(savedData.contact || {})
    }
  };
}

function blockPrivateFiles(request, response, next) {
  const blockedPaths = [
    "/.env",
    "/data.json",
    "/package.json",
    "/package-lock.json",
    "/server.js",
    "/render.yaml"
  ];

  if (blockedPaths.includes(request.path) || request.path.startsWith("/node_modules")) {
    response.status(404).send("Not found");
    return;
  }

  next();
}

function resolvePath(pathValue) {
  return resolve(rootDir, pathValue);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}
