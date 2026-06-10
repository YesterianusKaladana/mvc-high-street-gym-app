import express from "express";
import path from "path";
import cors from 'cors';
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

//Enable cross-origin resource sharing (CORS) and preflight OPTIONS requests
app.use(
  cors({
    origin: true,
  }),
);

app.set("view engine", "ejs");
app.set("views", path.join(import.meta.dirname, "views"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// static
app.use(express.static(path.join(import.meta.dirname, "public")));
app.use(express.static(path.join(import.meta.dirname, "dist")));

// ✅ session middleware
app.use(AuthenticationController.middleware);

// ✅ routes (order matters!)
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