const express = require("express");
const path = require("path");

const app = express();
const expressLayouts = require("express-ejs-layouts");

const loginRoute = require("./routes/login")

const rootDir =
    process.env.NODE_ENV === "production"
        ? path.join(__dirname, "..")
        : __dirname;

// View engine
app.set("view engine", "ejs");
app.set("views", path.join(rootDir, "views"));

// Static files
app.use(express.static(path.join(rootDir, "public")));

// Layouts
app.use(expressLayouts);
app.set("layout", "layouts/default");

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Routes
app.get("/", (_req, res) => {
    res.render("index", {
        title: "สวัสดีครับจารย์ดุล",
    });
});

app.use("/login", loginRoute)

module.exports = app;
