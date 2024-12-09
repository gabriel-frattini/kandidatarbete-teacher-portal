import express from "express";
import { initializeApp, cert } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import { readFile } from "fs/promises";
import dotenv from "dotenv";
import session from "express-session";
import multer from "multer";
import { PDFDocument } from "pdf-lib";
import fs from "fs";
import { Tenant } from "firebase-admin/auth";

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

const students = [
  "ALI123",
  "HUS456",
  "CHE789",
  "OME234",
  "KIT567",
  "JOH981",
  "MAR345",
  "DAV763",
  "SUS854",
  "PET901",
  "NAN472",
  "PAU369",
  "LIN620",
  "GEO853",
  "STE542",
  "JAM765",
  "KAR908",
  "MAR134",
  "BET276",
  "BRI492",
];

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

app.get("/getExam", async (req, res) => {
  //console.log(req.query);
  const tenta = await getTenta(req.query["course"]);
  if (!tenta) {
    res.json({ Error: "No such exam" });
  }
  const student = tenta.students.filter(
    (s) => req.query["anonymousCode"] === s
  );
  if (student.length) {
    console.log("suf");
    res.json({
      examID: tenta.course,
      anonymousCode: student[0],
      questions: tenta.questions,
    });
  } else {
    res.json({ Error: "No a valid student" });
  }
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
    const newRef = await db.ref("tentor").push({ ...req.body, students });
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

const getTenta = async (examID) => {
  const tentor = await getTentor();
  const tenta = Object.keys(tentor).filter(
    (exam) => tentor[exam].course === examID
  );
  return tentor[tenta];
};

function isLoggedIn(req, res, next) {
  if (req.session && req.session.user) {
    return next(); // Proceed to the protected route
  }

  return res.status(401).send("You must be logged in to view this page");
}
