import express from "express";
import { initializeApp, cert } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import { readFile } from "fs/promises";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const PORT = 3000;

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const serviceAccount = JSON.parse(
  await readFile(new URL("./tentamina.json", import.meta.url), "utf-8")
);

initializeApp({
  credential: cert(serviceAccount),
  databaseURL: process.env.DATABASE_URL,
});

const db = getDatabase();

app.get("/", (req, res) => {
  res.render("index.ejs");
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (username === "admin" && password == "notAdmin") {
    res.render("admin.ejs");
  } else {
    res.render("index.ejs", { error: "Not a valid User" });
  }
});

app.get("/new", (req, res) => {
  res.render("new.ejs");
});
app.post("/new", async (req, res) => {
  let message = "Added tenta";
  try {
    const newRef = await db.ref("tentor").push(req.body);
  } catch (error) {
    message = error.message;
    res.status(500);
  }
  res.render("admin.ejs", { message: message });
});

app.get("/showall", async (req, res) => {
  try {
    const snapshot = await db.ref("tentor").once("value");
    const data = snapshot.val();
    // Convert the object of objects to an array of objects
    const dataArray = Object.keys(data).map((key) => ({
      ...data[key],
      id: key,
    }));
    res.render("showall.ejs", { data: dataArray });
  } catch (error) {}
});

app.listen(PORT, () => {
  console.log(`Server is on port: ${PORT}`);
});
