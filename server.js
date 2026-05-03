import "dotenv/config";

import bcrypt from "bcrypt";
import cors from "cors";
import express from "express";
import session from "express-session";
import multer from "multer";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
const port = Number(process.env.PORT || 3000);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = __dirname;
const distDir = join(__dirname, "dist");
const distIndexFile = join(distDir, "index.html");
const dataFile = resolvePath(process.env.DATA_FILE_PATH || "./data.json");
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = supabaseUrl && supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false
    }
  })
  : null;
const isProduction = process.env.NODE_ENV === "production";
const sessionSecret = process.env.SESSION_SECRET || "local-dev-session-secret";
const adminUsername = process.env.ADMIN_USERNAME || "";
const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH || "";
const frontendOriginConfig = process.env.FRONTEND_ORIGINS || [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
  "https://123uugana.github.io"
].join(",");
const frontendOrigins = normalizeOrigins([
  frontendOriginConfig,
  process.env.RENDER_EXTERNAL_URL || ""
].join(","));
const corsOptions = {
  credentials: true,
  origin(origin, callback) {
    if (!origin || frontendOrigins.includes(normalizeOrigin(origin))) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked origin: ${origin}`));
  }
};

const listNames = ["features", "abouts", "says", "members"];
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
  users: [],
  membershipApplications: [],
  contact: {
    phone: "-",
    facebook: "Lady Riders Mongolia",
    instagram: "https://www.instagram.com/lady_riders_mongolia_wmc/"
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
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

if (isProduction) {
  app.set("trust proxy", 1);
}

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(session({
  name: "lady_riders_admin",
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
    maxAge: 1000 * 60 * 60 * 4
  }
}));

app.get("/api/auth/me", (request, response) => {
  response.json({
    loggedIn: Boolean(request.session.admin),
    username: request.session.admin?.username || null
  });
});

app.post("/api/auth/login", asyncRoute(async (request, response) => {
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
}));

app.post("/api/auth/logout", (request, response) => {
  request.session.destroy(() => {
    response.clearCookie("lady_riders_admin", {
      httpOnly: true,
      sameSite: isProduction ? "none" : "lax",
      secure: isProduction
    });
    response.json({ ok: true });
  });
});

app.post("/api/users/register", asyncRoute(async (request, response) => {
  const name = String(request.body.name || "").trim();
  const email = normalizeEmail(request.body.email || "");
  const password = String(request.body.password || "");

  if (!name || !email || password.length < 6) {
    response.status(400).json({ error: "Name, email, 6+ тэмдэгт password шаардлагатай." });
    return;
  }

  const data = await readData();
  const emailTaken = data.users.some((user) => normalizeEmail(user.email) === email);

  if (emailTaken) {
    response.status(409).json({ error: "Энэ email бүртгэлтэй байна." });
    return;
  }

  const user = {
    id: randomUUID(),
    name,
    email,
    passwordHash: await bcrypt.hash(password, 12),
    role: "user",
    status: "pending",
    createdAt: new Date().toISOString()
  };

  data.users.unshift(user);
  await saveData(data);

  request.session.user = { id: user.id };
  response.status(201).json({ user: sanitizeUser(user) });
}));

app.post("/api/users/login", asyncRoute(async (request, response) => {
  const email = normalizeEmail(request.body.email || "");
  const password = String(request.body.password || "");
  const data = await readData();
  const user = data.users.find((currentUser) => normalizeEmail(currentUser.email) === email);
  const passwordOk = user && password
    ? await bcrypt.compare(password, user.passwordHash)
    : false;

  if (!user || !passwordOk) {
    response.status(401).json({ error: "Email эсвэл password буруу байна." });
    return;
  }

  request.session.user = { id: user.id };
  response.json({ user: sanitizeUser(user) });
}));

app.post("/api/users/logout", (request, response) => {
  delete request.session.user;
  response.json({ ok: true });
});

app.get("/api/users/me", asyncRoute(async (request, response) => {
  if (!request.session.user?.id) {
    response.json({ loggedIn: false, user: null });
    return;
  }

  const data = await readData();
  const user = findUserById(data, request.session.user.id);

  if (!user) {
    delete request.session.user;
    response.json({ loggedIn: false, user: null });
    return;
  }

  response.json({ loggedIn: true, user: sanitizeUser(user) });
}));

app.get("/api/data", asyncRoute(async (request, response) => {
  const data = await readData();
  response.json(sanitizeDataForPublic(data));
}));

app.post("/api/membership", requireUser, upload.fields([
  { name: "profilePhoto", maxCount: 1 },
  { name: "motorcyclePhoto", maxCount: 1 }
]), asyncRoute(async (request, response) => {
  if (!request.body.firstName || !request.body.mobilePhone || !request.body.email) {
    response.status(400).json({ error: "Required fields are missing" });
    return;
  }

  const data = await readData();
  const user = findUserById(data, request.session.user.id);

  if (!user) {
    response.status(401).json({ error: "User login шаардлагатай." });
    return;
  }

  const application = {
    id: randomUUID(),
    userId: user.id,
    status: "pending",
    ...removeReadonlyFields(request.body),
    profilePhotoPath: getUploadedPath(request.files, "profilePhoto"),
    motorcyclePhotoPath: getUploadedPath(request.files, "motorcyclePhoto"),
    createdAt: new Date().toISOString()
  };

  user.status = "pending";
  data.membershipApplications.unshift(application);
  await saveData(data);

  response.status(201).json(application);
}));

app.get("/api/admin/applications", requireAdmin, asyncRoute(async (request, response) => {
  const data = await readData();
  response.json(data.membershipApplications.map((application) => ({
    ...application,
    user: sanitizeUser(findUserById(data, application.userId))
  })));
}));

app.patch("/api/admin/applications/:id/status", requireAdmin, asyncRoute(async (request, response) => {
  const status = String(request.body.status || "").trim();

  if (!["approved", "rejected"].includes(status)) {
    response.status(400).json({ error: "Status approved эсвэл rejected байх ёстой." });
    return;
  }

  const data = await readData();
  const application = data.membershipApplications.find((item) => item.id === request.params.id);

  if (!application) {
    response.status(404).json({ error: "Application not found" });
    return;
  }

  application.status = status;
  application.reviewedAt = new Date().toISOString();
  application.reviewedBy = request.session.admin.username;

  const user = findUserById(data, application.userId);

  if (user) {
    user.status = status;
  }

  await saveData(data);
  response.json({
    ...application,
    user: sanitizeUser(user)
  });
}));

app.get("/api/:listName", asyncRoute(async (request, response) => {
  const listName = request.params.listName;

  if (!isListName(listName)) {
    response.status(404).json({ error: "List not found" });
    return;
  }

  const data = await readData();
  response.json(data[listName]);
}));

app.get("/api/:listName/:id", asyncRoute(async (request, response) => {
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
}));

app.post("/api/members", asyncRoute(async (request, response) => {
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
}));

app.post("/api/:listName", requireAdmin, asyncRoute(async (request, response) => {
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
}));

app.put("/api/:listName/:id", requireAdmin, asyncRoute(async (request, response) => {
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
}));

app.delete("/api/:listName/:id", requireAdmin, asyncRoute(async (request, response) => {
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
}));

app.patch("/api/stats/:key", requireAdmin, asyncRoute(async (request, response) => {
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
}));

app.put("/api/contact", requireAdmin, asyncRoute(async (request, response) => {
  const data = await readData();
  data.contact = {
    phone: request.body.phone || "-",
    facebook: request.body.facebook || "-",
    instagram: request.body.instagram || "-"
  };

  await saveData(data);
  response.json(data.contact);
}));

app.use("/api", (request, response) => {
  response.status(404).json({ error: "API route not found" });
});

app.use(blockPrivateFiles);
app.use(express.static(distDir, {
  etag: false,
  setHeaders(response) {
    response.setHeader("Cache-Control", "no-store");
  }
}));

app.get("*", (request, response, next) => {
  if (request.path.startsWith("/api")) {
    next();
    return;
  }

  response.sendFile(distIndexFile, (error) => {
    if (error) {
      next(error);
    }
  });
});

app.use((error, request, response, next) => {
  if (response.headersSent) {
    next(error);
    return;
  }

  if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
    response.status(400).json({ error: "Зураг 5MB-аас бага байх ёстой." });
    return;
  }

  if (error) {
    const statusCode = error.message?.startsWith("CORS blocked origin") ? 403 : 500;
    response.status(statusCode).json({ error: error.message || "Server алдаа гарлаа." });
    return;
  }

  next();
});

await initializeStorage();

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

async function readData() {
  if (supabase) {
    return readDataFromSupabase();
  }

  if (isProduction) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in production.");
  }

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
  if (supabase) {
    await saveDataToSupabase(data);
    return;
  }

  if (isProduction) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in production.");
  }

  await mkdir(dirname(dataFile), { recursive: true });
  await writeFile(dataFile, JSON.stringify(data, null, 2), "utf8");
}

async function readDataFromSupabase() {
  const [
    features,
    abouts,
    says,
    members,
    users,
    membershipApplications,
    stats,
    contact
  ] = await Promise.all([
    selectRows("features"),
    selectRows("abouts"),
    selectRows("says"),
    selectRows("members"),
    selectRows("users"),
    selectRows("membership_applications"),
    selectSingleRow("stats", 1),
    selectSingleRow("contact", 1)
  ]);

  return mergeWithDefaultData({
    features: features.map(rowToFeature),
    abouts: abouts.map(rowToAbout),
    says: says.map(rowToSay),
    members: members.map(rowToMember),
    users: users.map(rowToUser),
    membershipApplications: membershipApplications.map(rowToApplication),
    stats: stats ? rowToStats(stats) : defaultData.stats,
    contact: contact ? rowToContact(contact) : defaultData.contact
  });
}

async function saveDataToSupabase(data) {
  await syncRows("users", data.users.map(userToRow));
  await syncRows("features", data.features.map(featureToRow));
  await syncRows("abouts", data.abouts.map(aboutToRow));
  await syncRows("says", data.says.map(sayToRow));
  await syncRows("members", data.members.map(memberToRow));
  await syncRows(
    "membership_applications",
    data.membershipApplications.map(applicationToRow)
  );

  await upsertRows("stats", [statsToRow(data.stats)]);
  await upsertRows("contact", [contactToRow(data.contact)]);
}

async function selectRows(tableName) {
  const { data, error } = await supabase
    .from(tableName)
    .select("*")
    .order("created_at", { ascending: false });

  throwIfSupabaseError(error);
  return data || [];
}

async function selectSingleRow(tableName, id) {
  const { data, error } = await supabase
    .from(tableName)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  throwIfSupabaseError(error);
  return data || null;
}

async function syncRows(tableName, rows) {
  const { data: existingRows, error } = await supabase
    .from(tableName)
    .select("id");

  throwIfSupabaseError(error);

  const nextIds = new Set(rows.map((row) => row.id));
  const deletedIds = (existingRows || [])
    .map((row) => row.id)
    .filter((id) => !nextIds.has(id));

  if (deletedIds.length) {
    const { error: deleteError } = await supabase
      .from(tableName)
      .delete()
      .in("id", deletedIds);

    throwIfSupabaseError(deleteError);
  }

  await upsertRows(tableName, rows);
}

async function upsertRows(tableName, rows) {
  if (!rows.length) {
    return;
  }

  const { error } = await supabase
    .from(tableName)
    .upsert(rows, { onConflict: "id" });

  throwIfSupabaseError(error);
}

function throwIfSupabaseError(error) {
  if (error) {
    throw new Error(`Supabase error: ${error.message}`);
  }
}

async function initializeStorage() {
  if (!supabase && !isProduction) {
    await mkdir(dirname(dataFile), { recursive: true });
  }
  await readData();
}

function asyncRoute(handler) {
  return (request, response, next) => {
    Promise.resolve(handler(request, response, next)).catch(next);
  };
}

function requireAdmin(request, response, next) {
  if (!request.session.admin) {
    response.status(401).json({ error: "Admin login шаардлагатай." });
    return;
  }

  next();
}

function requireUser(request, response, next) {
  if (!request.session.user?.id) {
    response.status(401).json({ error: "User login шаардлагатай." });
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
  return files?.[fieldName]?.[0] ? "" : "";
}

function rowToFeature(row) {
  return {
    id: row.id,
    title: row.title,
    text: row.text,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function featureToRow(item) {
  return {
    id: item.id,
    title: item.title || "",
    text: item.text || "",
    created_at: item.createdAt,
    updated_at: item.updatedAt || null
  };
}

function rowToAbout(row) {
  return {
    id: row.id,
    text: row.text,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function aboutToRow(item) {
  return {
    id: item.id,
    text: item.text || "",
    created_at: item.createdAt,
    updated_at: item.updatedAt || null
  };
}

function rowToSay(row) {
  return {
    id: row.id,
    text: row.text,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function sayToRow(item) {
  return {
    id: item.id,
    text: item.text || "",
    name: item.name || "",
    created_at: item.createdAt,
    updated_at: item.updatedAt || null
  };
}

function rowToMember(row) {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    bike: row.bike,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function memberToRow(item) {
  return {
    id: item.id,
    name: item.name || "",
    phone: item.phone || "",
    bike: item.bike || "",
    created_at: item.createdAt,
    updated_at: item.updatedAt || null
  };
}

function rowToUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function userToRow(user) {
  return {
    id: user.id,
    name: user.name || "",
    email: normalizeEmail(user.email || ""),
    password_hash: user.passwordHash || "",
    role: user.role || "user",
    status: user.status || "pending",
    created_at: user.createdAt,
    updated_at: user.updatedAt || null
  };
}

function rowToApplication(row) {
  return {
    id: row.id,
    userId: row.user_id,
    status: row.status,
    ...(row.application_data || {}),
    profilePhotoPath: row.profile_photo_path || "",
    motorcyclePhotoPath: row.motorcycle_photo_path || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    reviewedAt: row.reviewed_at,
    reviewedBy: row.reviewed_by
  };
}

function applicationToRow(application) {
  const {
    id,
    userId,
    status,
    profilePhotoPath,
    motorcyclePhotoPath,
    createdAt,
    updatedAt,
    reviewedAt,
    reviewedBy,
    ...applicationData
  } = application;

  return {
    id,
    user_id: userId,
    status: status || "pending",
    application_data: applicationData,
    profile_photo_path: profilePhotoPath || "",
    motorcycle_photo_path: motorcyclePhotoPath || "",
    created_at: createdAt,
    updated_at: updatedAt || null,
    reviewed_at: reviewedAt || null,
    reviewed_by: reviewedBy || null
  };
}

function rowToStats(row) {
  return {
    members: row.members,
    events: row.events,
    trips: row.trips,
    community: row.community
  };
}

function statsToRow(stats = {}) {
  return {
    id: 1,
    members: Number(stats.members || 0),
    events: Number(stats.events || 0),
    trips: Number(stats.trips || 0),
    community: Math.max(1, Number(stats.community || 1))
  };
}

function rowToContact(row) {
  return {
    phone: row.phone,
    facebook: row.facebook,
    instagram: row.instagram
  };
}

function contactToRow(contact = {}) {
  return {
    id: 1,
    phone: contact.phone || "-",
    facebook: contact.facebook || "-",
    instagram: contact.instagram || "-"
  };
}

function removeReadonlyFields(item = {}) {
  const {
    id,
    userId,
    role,
    status,
    createdAt,
    updatedAt,
    reviewedAt,
    reviewedBy,
    passwordHash,
    profilePhoto,
    motorcyclePhoto,
    ...editableFields
  } = item;
  return editableFields;
}

function mergeWithDefaultData(savedData) {
  return {
    ...clone(defaultData),
    ...savedData,
    users: Array.isArray(savedData.users) ? savedData.users : [],
    membershipApplications: Array.isArray(savedData.membershipApplications)
      ? savedData.membershipApplications
      : [],
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

function sanitizeDataForPublic(data) {
  return {
    ...data,
    users: [],
    membershipApplications: []
  };
}

function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

function findUserById(data, id) {
  return data.users.find((user) => user.id === id) || null;
}

function normalizeEmail(value) {
  return String(value).trim().toLowerCase();
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

function normalizeOrigins(value) {
  return value
    .split(",")
    .map((origin) => normalizeOrigin(origin))
    .filter(Boolean);
}

function normalizeOrigin(value) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return "";
  }

  try {
    return new URL(trimmedValue).origin;
  } catch {
    return trimmedValue.replace(/\/$/, "");
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}
