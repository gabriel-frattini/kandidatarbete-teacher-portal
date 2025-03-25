import express from "express";
import { initializeApp, cert } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import { readFile } from "fs/promises";
import dotenv from "dotenv";
import session from "express-session";
import multer from "multer";
import { PDFDocument } from "pdf-lib";
import fs from "fs";
import { ref, get, set, update, push } from "firebase/database";
import path from "path";

dotenv.config();
const app = express();
const PORT = 3000;
const __dirname = path.dirname(new URL(import.meta.url).pathname);
const upload = multer({ dest: path.join(__dirname, "public", "uploads") });

app.use(express.static("public"));
app.use(express.static("uploads"));
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

const uploadsDir = path.join(__dirname, "public", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

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
    res.redirect("/");
  });
});

app.get("/getExam", async (req, res) => {
  console.log(req.query);
  const tenta = await getTenta(req.query["courseCode"]);
  if (!tenta) {
    return res.json({ Error: "No such exam" });
  }
  const student = tenta.students.filter(
    (s) => req.query["anonymousCode"] === s.anonymousCode
  );

  if (student.length) {
    return res.json({
      examID: tenta.course,
      anonymousCode: student[0],
      questions: Array.isArray(tenta.questions) ? tenta.questions : [tenta.questions],
      examStartTime: tenta.examStartTime,
      examEndTime : tenta.examEndTime,
      examDate: tenta.examDate,
    });
  } else {
    return res.json({ Error: "Not a valid student" });
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
    const pdfDoc = await PDFDocument.load(fileBuffer);

    // Save the file as a PDF in the "public/uploads" directory
    const destinationPath = path.join(uploadsDir, `${course}_${username}.pdf`);
    fs.renameSync(file.path, destinationPath);

    console.log("File:", file);
    console.log("Course:", course);
    console.log("Username:", username);
    addStudentToSubmitted(course, username);
    res.status(200).send("PDF uploaded successfully");
  } catch (error) {
    console.error("File is not a valid PDF:", error.message);
    fs.unlinkSync(file.path);
    res.status(400).send("Uploaded file is not a valid PDF");
  }
});

async function addStudentToSubmitted(courseId, studentName) {
  const courseRef = ref(db, `submitted/${courseId}/students`);

  try {
    // Fetch the current list of students for the course
    const snapshot = await get(courseRef);

    if (snapshot.exists()) {
      // If the course exists, add or update the student's name as a key
      await update(courseRef, {
        [studentName]: true,
      });
      console.log(
        `Added or updated student ${studentName} in course ${courseId}`
      );
    } else {
      // If the course does not exist, create the course and add the student
      await set(courseRef, {
        [studentName]: true,
      });
      console.log(
        `Created course ${courseId} and added first student ${studentName}`
      );
    }
  } catch (error) {
    console.error("Error adding student to submitted:", error);
  }
}

app.get("/new", isLoggedIn, (req, res) => {
  res.render("new.ejs");
});
app.post("/new", isLoggedIn, async (req, res) => {
  let message = "Added tenta";
  try {
    const data = req.body;
    console.log("data in", data);


    // `questions` and `types` can be either a string or an array from the form data
    const questionTexts = Array.isArray(data.questions) ? data.questions : [data.questions];
    const questionTypes = Array.isArray(data.types) ? data.types : [data.types];

    const questions = []
    for (let i = 0; i < questionTexts.length; i++) {
      questions[i] = { text: questionTexts[i], type: questionTypes[i] };
    }

    const tenta = { course: data.course, questions, students };

    let taken = []
    for (let i = 0; i < tenta.students.length; i++) {
      let digits = Math.floor(1000 + Math.random() * 9000);
      let letters = () => [...Array(3)].map(() => String.fromCharCode(97 + Math.floor(Math.random() * 26))).join('');
      
      let code = `${tenta.course}-${digits}-${letters()}`
      code = code.toUpperCase();
      
      if (taken.includes(code)) {
        i--;
      } else {
        tenta.students[i].anonymousCode = code
      }
    }

    const newRef = await db.ref("tentor").push(tenta);
  } catch (error) {
    message = error.message;
    res.status(500);
  }
  res.render("admin.ejs", { message: message });
});

app.get("/showall", isLoggedIn, async (req, res) => {
  const data = await getTentor();
  if (data) {
    const dataArray = Object.keys(data).map((key) => ({
      ...data[key],
      id: key,
    }));
    console.log(dataArray);
    res.render("showall.ejs", { data: dataArray });
  } else {
    res.render("showall.ejs");
  }
});

app.get("/students/:course?", isLoggedIn, async (req, res) => {
  const course = req.params.course;
  try {
    const snapshot = await db.ref("submitted").once("value");
    const data = snapshot.val();

    const students = Object.keys(data[course].students);
    console.log(students);
    if (!students) {
    }
    const info = {
      course: course,
      students: students,
    };
    console.log("Info Object:", info);

    res.render("students.ejs", info);
  } catch (error) {
    console.log(`Error: ${error.message}`);
    res.render("students.ejs", { course: course });
  }
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
