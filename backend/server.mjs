import express from "express";
import path from "path";
import cors from "cors";
import { UserController } from "./controllers/UserController.mjs";
import { AuthenticationController } from "./controllers/AuthenticationController.mjs";
import { BookingController } from "./controllers/BookingController.mjs";
import { SessionController } from "./controllers/SessionController.mjs";
import { ActivityController } from "./controllers/ActivityController.mjs";
import { LocationController } from "./controllers/LocationController.mjs";
import { PostController } from "./controllers/PostController.mjs";
import { ApiController } from "./controllers/api/ApiController.mjs";

const app = express();
const port = 8080;

// Configure CORS to allow requests from the React frontend
const corsOptions = {
  // Allow requests from the frontend running on localhost:5173
  origin: "http://localhost:5173",

  // Allow the specified HTTP methods
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],

  // Allow the headers used by the frontend, including the authentication key
  allowedHeaders: ["Content-Type", "x-auth-key"],
};

// Apply CORS to all routes
app.use(cors(corsOptions));

// Explicitly handle OPTIONS preflight requests for all routes
app.options(/.*/, cors(corsOptions));

app.set("view engine", "ejs");
app.set("views", path.join(import.meta.dirname, "views"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// static
app.use(express.static(path.join(import.meta.dirname, "public")));
app.use(express.static(path.join(import.meta.dirname, "dist")));

// ✅ session middleware
app.use(AuthenticationController.middleware);

// ✅ Routes for controllers
app.use("/authenticate", AuthenticationController.routes);
app.use("/booking", BookingController.routes);
app.use("/user", UserController.routes);
app.use("/session", SessionController.routes);
app.use("/activity", ActivityController.routes);
app.use("/location", LocationController.routes);
app.use("/post", PostController.routes);
app.use("/api", ApiController.routes);

app.get("/", (req, res) => {
  res.redirect("/session/view");
});

app.listen(port, () => {
  console.log("Backend started on http://localhost:" + port);
});
