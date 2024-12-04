import express from "express";
import { initializeApp, cert } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import { readFile } from "fs/promises";
import dotenv from "dotenv";
import session from "express-session";
import multer from "multer";
import { PDFDocument } from "pdf-lib";
import fs from "fs";

const upload = multer({ dest: "uploads/" });
dotenv.config();
const app = express();
const PORT = 3000;

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // In production, set secure: true
  })
);

const serviceAccount = JSON.parse(
  await readFile(new URL("./tentamina.json", import.meta.url), "utf-8")
);

initializeApp({
  credential: cert(serviceAccount),
  databaseURL: process.env.DATABASE_URL,
});

const db = getDatabase();

const users = [{ username: "admin", password: "notAdmin" }];

app.get("/", (req, res) => {
  res.render("index.ejs");
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const user = users.find(
    (u) => u.username === username && u.password === password
  );
  if (user) {
    req.session.user = user;
    res.render("admin.ejs");
  } else {
    return res.status(401).render("index.ejs", { error: "Not a valid User" });
  }
});

app.get("/logout", isLoggedIn, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send("Failed to log out");
    }
    res.send("Logged out successfully");
  });
});

// Needs check student validifty e.g
app.post("/submit", upload.single("file"), async (req, res) => {
  const { course, username } = req.body;
  const file = req.file;

  if (!file || !course || !username) {
    return res.status(400).send("Invalid request");
  }

  // Check if the file is a PDF
  try {
    const fileBuffer = fs.readFileSync(file.path);
    const pdfDoc = await PDFDocument.load(fileBuffer); // Validate if it can load as a PDF

    // Save the file as a PDF in a permanent location
    const destinationPath = `uploads/${file.originalname}`;
    fs.renameSync(file.path, destinationPath); // Move file to permanent location

    console.log("File:", file);
    console.log("Course:", course);
    console.log("Username:", username);
    res.status(200).send("PDF uploaded successfully");
  } catch (error) {
    // Handle non-PDF file
    console.error("File is not a valid PDF:", error.message);
    fs.unlinkSync(file.path); // Remove the invalid file
    res.status(400).send("Uploaded file is not a valid PDF");
  }
});

app.get("/new", isLoggedIn, (req, res) => {
  res.render("new.ejs");
});
app.post("/new", isLoggedIn, async (req, res) => {
  let message = "Added tenta";
  try {
    const newRef = await db.ref("tentor").push(req.body);
  } catch (error) {
    message = error.message;
    res.status(500);
  }
  res.render("admin.ejs", { message: message });
});

app.get("/showall", isLoggedIn, async (req, res) => {
  const data = await getTentor();
  const dataArray = Object.keys(data).map((key) => ({
    ...data[key],
    id: key,
  }));
  res.render("showall.ejs", { data: dataArray });
});

app.listen(PORT, () => {
  console.log(`Server is on port: ${PORT}`);
});

const getTentor = async () => {
  try {
    const snapshot = await db.ref("tentor").once("value");
    return snapshot.val();
  } catch (error) {
    console.log(`Error: ${error.message}`);
    return {};
  }
};

function isLoggedIn(req, res, next) {
  if (req.session && req.session.user) {
    return next(); // Proceed to the protected route
  }

  return res.status(401).send("You must be logged in to view this page");
}
