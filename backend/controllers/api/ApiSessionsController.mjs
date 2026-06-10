import express from "express";
import { ApiAuthenticationController } from "./ApiAuthenticationController.mjs";

export class ApiSessionsController {
  static routes = express.Router();

  static {
    this.routes.use(ApiAuthenticationController.middleware);
    this.routes.get("/", this.viewSessions);
    this.routes.get("/xml", this.getSessionsXML);
    this.routes.get("/trainer/:id", this.getTrainerSessionsById);
    this.routes.delete("/:id", this.deleteTrainerSessions);
  }

  static async viewSessions(req, res) {
    return res.status(501).json({
      message: "Not implemented",
    });
  }

  static async getSessionsXML(req, res) {
    res.status(501).json({
      message: "Not implemented",
    });
  }

  static async getTrainerSessionsById(req, res) {
    return res.status(501).json({
      message: "Not implemented",
    });
  }

  static async deleteTrainerSessions(req, res) {
    return res.status(501).json({
      message: "Not implemented",
    });
  }
}
