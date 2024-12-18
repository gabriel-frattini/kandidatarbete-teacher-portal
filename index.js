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

const students = [
  {
    anonymousCode: "ALI123",
    fullName: "Ali Smith",
    birthID: "1998-12-15-7482",
  },
  {
    anonymousCode: "HUS456",
    fullName: "Hussein Ahmed",
    birthID: "1995-09-22-3617",
  },
  {
    anonymousCode: "CHE789",
    fullName: "Chelsea Johnson",
    birthID: "2001-02-14-5193",
  },
  {
    anonymousCode: "OME234",
    fullName: "Omar Brown",
    birthID: "1996-03-05-2301",
  },
  {
    anonymousCode: "KIT567",
    fullName: "Kit Williams",
    birthID: "2000-05-21-8532",
  },
  { anonymousCode: "JOH981", fullName: "John Doe", birthID: "1997-12-30-4861" },
  {
    anonymousCode: "MAR345",
    fullName: "Martha Clarke",
    birthID: "1999-08-14-7276",
  },
  {
    anonymousCode: "DAV763",
    fullName: "David Taylor",
    birthID: "2002-04-22-1934",
  },
  {
    anonymousCode: "SUS854",
    fullName: "Susan Green",
    birthID: "2003-03-01-6247",
  },
  {
    anonymousCode: "PET901",
    fullName: "Peter White",
    birthID: "2000-02-15-4856",
  },
  {
    anonymousCode: "NAN472",
    fullName: "Nancy Clark",
    birthID: "1998-12-07-9321",
  },
  {
    anonymousCode: "PAU369",
    fullName: "Paul Roberts",
    birthID: "1995-09-05-1789",
  },
  {
    anonymousCode: "LIN620",
    fullName: "Linda Lee",
    birthID: "2001-01-10-3032",
  },
  {
    anonymousCode: "GEO853",
    fullName: "George Harris",
    birthID: "1999-08-25-6523",
  },
  {
    anonymousCode: "STE542",
    fullName: "Steven Walker",
    birthID: "1997-12-14-4892",
  },
  {
    anonymousCode: "JAM765",
    fullName: "James White",
    birthID: "2000-01-30-7265",
  },
  {
    anonymousCode: "KAR908",
    fullName: "Karla Johnson",
    birthID: "2002-08-16-5021",
  },
  {
    anonymousCode: "MAR134",
    fullName: "Marion Jackson",
    birthID: "1996-03-07-6819",
  },
  {
    anonymousCode: "BET276",
    fullName: "Beth Evans",
    birthID: "2003-03-12-3467",
  },
  {
    anonymousCode: "BRI492",
    fullName: "Brian Anderson",
    birthID: "2002-04-09-3982",
  },
];
