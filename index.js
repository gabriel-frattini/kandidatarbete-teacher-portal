import express from "express";

const app = express();
const PORT = 3000;

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

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
app.post("/new", (req, res) => {
  console.log(req.body);
  res.render("admin.ejs");
});
app.get("/showall", (req, res) => {
  res.send("showall");
});

app.listen(PORT, () => {
  console.log(`Server is on port: ${PORT}`);
});
