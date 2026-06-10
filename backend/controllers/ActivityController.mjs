import express from "express";
import { ActivityModel } from "../models/ActivityModel.mjs";
import { AuthenticationController } from "./AuthenticationController.mjs";

/**
 * ActivityController
 *
 * Handles all activity management operations including:
 * - Viewing all activities
 * - Searching activities by name
 * - Selecting a specific activity by ID
 * - Creating, updating, and deleting activities (CRUD)
 *
 * Access Control:
 * Only users with admin or trainer roles can access this controller.
 */
export class ActivityController {
  static routes = express.Router();

  static {
    /**
     * GET /activity
     * View all activities with optional search
     */
    this.routes.get(
      "/",
      AuthenticationController.restrict(["admin", "trainer"]),
      this.viewActivities
    );

    /**
     * GET /activity/:id
     * View all activities and select a specific activity by ID
     */
    this.routes.get(
      "/:id",
      AuthenticationController.restrict(["admin", "trainer"]),
      this.viewActivities
    );

    /**
     * POST /activity
     * Handle create, update, delete operations for activities
     */
    this.routes.post(
      "/",
      AuthenticationController.restrict(["admin", "trainer"]),
      this.handleActivities
    );

    /**
     * POST /activity/:id
     * Handle update or delete operations for a specific activity
     */
    this.routes.post(
      "/:id",
      AuthenticationController.restrict(["admin", "trainer"]),
      this.handleActivities
    );
  }

  /**
   * View all activities
   * Supports search by activity name and selecting a specific activity by ID
   *
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  static async viewActivities(req, res) {
    try {
      const search = req.query.search || "";

      let activities = await ActivityModel.getAll();

      if (search.trim() !== "") {
        activities = activities.filter(a =>
          a.name.toLowerCase().includes(search.toLowerCase())
        );
      }

      const selectedId = req.params.id;

      const selectedActivity =
        activities.find(a => a.id == selectedId) ||
        new ActivityModel(null, "");

      return res.render("activity_management.ejs", {
        authenticatedUser: req.session.user,
        activities,
        selectedActivity,
        search,
        error: null,
      });

    } catch (err) {
      console.error(err);
      return res.status(500).send("Failed to load activities");
    }
  }

  /**
   * Handle CRUD operations for activities
   *
   * Supported actions:
   * - create
   * - update
   * - delete
   *
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  static async handleActivities(req, res) {
    const { action } = req.body;
    const id = req.params.id || req.body.id;
    const name = req.body.name?.trim();

    let error = null;

    // ✅ SAFETY CHECK FIRST
    if (!name || name.length === 0) {
      error = "Activity name is required";
    } else if (/\d/.test(name)) {
      error = "Activity name must not contain numbers";
    } else if (!/^[A-Z]/.test(name)) {
      error = "Activity name must start with an uppercase letter";
    } else if (name.length < 2) {
      error = "Activity name is too short";
    } else if (name.length > 50) {
      error = "Activity name is too long";
    }

    if (error) {
      const activities = await ActivityModel.getAll();
      const selectedActivity = new ActivityModel(id, name);

      return res.render("activity_management.ejs", {
        authenticatedUser: req.session.user,
        activities,          
        selectedActivity,
        search: "",
        error,              
      });
    }

    const activity = new ActivityModel(id, name);

    try {
      if (action === "create") {
        await ActivityModel.create(activity);
      }

      if (action === "update") {
        await ActivityModel.update(activity);
      }

      if (action === "delete") {
        await ActivityModel.delete(id);
      }

      return res.redirect("/activity");

    } catch (err) {
      console.error(err);
      return res.status(500).send("Database error");
    }
  }
}