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
  { anonymousCode: "ALI123", fullName: "Ali Smith", birthYear: 1998 },
  { anonymousCode: "HUS456", fullName: "Hussein Ahmed", birthYear: 1995 },
  { anonymousCode: "CHE789", fullName: "Chelsea Johnson", birthYear: 2001 },
  { anonymousCode: "OME234", fullName: "Omar Brown", birthYear: 1996 },
  { anonymousCode: "KIT567", fullName: "Kit Williams", birthYear: 2000 },
  { anonymousCode: "JOH981", fullName: "John Doe", birthYear: 1997 },
  { anonymousCode: "MAR345", fullName: "Martha Clarke", birthYear: 1999 },
  { anonymousCode: "DAV763", fullName: "David Taylor", birthYear: 2002 },
  { anonymousCode: "SUS854", fullName: "Susan Green", birthYear: 2003 },
  { anonymousCode: "PET901", fullName: "Peter White", birthYear: 2000 },
  { anonymousCode: "NAN472", fullName: "Nancy Clark", birthYear: 1998 },
  { anonymousCode: "PAU369", fullName: "Paul Roberts", birthYear: 1995 },
  { anonymousCode: "LIN620", fullName: "Linda Lee", birthYear: 2001 },
  { anonymousCode: "GEO853", fullName: "George Harris", birthYear: 1999 },
  { anonymousCode: "STE542", fullName: "Steven Walker", birthYear: 1997 },
  { anonymousCode: "JAM765", fullName: "James White", birthYear: 2000 },
  { anonymousCode: "KAR908", fullName: "Karla Johnson", birthYear: 2002 },
  { anonymousCode: "MAR134", fullName: "Marion Jackson", birthYear: 1996 },
  { anonymousCode: "BET276", fullName: "Beth Evans", birthYear: 2003 },
  { anonymousCode: "BRI492", fullName: "Brian Anderson", birthYear: 2002 },
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
  console.log(req.query);
  const tenta = await getTenta(req.query["courseCode"]);
  if (!tenta) {
    res.json({ Error: "No such exam" });
  }
  const student = tenta.students.filter(
    (s) => req.query["anonymousCode"] === s.anonymousCode
  );

  if (student.length) {
    res.json({
      examID: tenta.course,
      anonymousCode: student[0],
      questions: tenta.questions,
    });
  } else {
    res.json({ Error: "Not a valid student" });
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
