require("dotenv").config();
const express = require("express");
const path = require("path");
const session = require("express-session");
const { PrismaClient } = require("./generated/prisma");
const { PrismaSessionStore } = require("@quixo3/prisma-session-store");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const { faker } = require('@faker-js/faker'); // เพิ่มการ import faker
const generatedName = faker.person.firstName();
console.log("Generated Name: ", generatedName);

const index = require("./routes/index");
const loginRoute = require("./routes/login");
const registerRoute = require("./routes/register");
const projectRoute = require("./routes/project");
const adminRoute = require("./routes/admin");
const profileRoute = require("./routes/profile");
const endpointRoute = require("./routes/api-endpoint");

const app = express();

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create adapter
const adapter = new PrismaPg(pool);

// Initialize Prisma Client with adapter (required in Prisma 7)
const prisma = new PrismaClient({ adapter });

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
app.use(require("express-ejs-layouts"));
app.set("layout", "layouts/default");

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session with Prisma Store
app.use(
  session({
    name: "sid",
    secret: process.env.SESSION_SECRET || "work hard",
    resave: true,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24,
    },
    store: new PrismaSessionStore(prisma, {
      checkPeriod: 2 * 60 * 1000,
      dbRecordIdIsSessionId: true,
    }),
  }),
);

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

app.use("/", index);
app.use("/login", loginRoute);
app.use("/projects", projectRoute);
app.use("/register", registerRoute);
app.use("/dashboard", adminRoute);
app.use("/profile", profileRoute);
app.use("/", endpointRoute)

module.exports = app;
