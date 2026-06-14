import express from "express";
import { LocationModel } from "../models/LocationModel.mjs";
import { AuthenticationController } from "./AuthenticationController.mjs";

/**
 * LocationController
 *
 * Handles all location management features including:
 * - Viewing all locations
 * - Searching locations
 * - Selecting a location by ID
 * - Creating, updating, and deleting locations (CRUD)
 *
 * Access Control:
 * Only admin and trainer roles are allowed to access this controller.
 */
export class LocationController {
  static routes = express.Router();

  static {
    /**
     * GET /location
     * View all locations with optional search
     */
    this.routes.get(
      "/",
      AuthenticationController.restrict(["admin", "trainer"]),
      this.viewLocations,
    );

    /**
     * GET /location/:id
     * View all locations and select a specific location by ID
     */
    this.routes.get(
      "/:id",
      AuthenticationController.restrict(["admin", "trainer"]),
      this.viewLocations,
    );

    /**
     * POST /location
     * Handle create, update, delete operations for locations
     */
    this.routes.post(
      "/",
      AuthenticationController.restrict(["admin", "trainer"]),
      this.handleLocations,
    );

    /**
     * POST /location/:id
     * Handle update or delete operations for a specific location
     */
    this.routes.post(
      "/:id",
      AuthenticationController.restrict(["admin", "trainer"]),
      this.handleLocations,
    );
  }

  /**
   * View all locations
   * Supports search by location name and selecting a location by ID
   *
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  static async viewLocations(req, res) {
    try {
      const search = req.query.search || "";

      let locations = await LocationModel.getAll();

      if (search.trim() !== "") {
        locations = locations.filter(
          (l) =>
            l.name.toLowerCase().includes(search.toLowerCase()) ||
            l.description.toLowerCase().includes(search.toLowerCase()),
        );
      }

      const selectedId = req.params.id;

      const selectedLocation =
        locations.find((l) => l.id == selectedId) ||
        new LocationModel(null, "", "");

      return res.render("location_management.ejs", {
        authenticatedUser: req.session.user,
        locations,
        selectedLocation,
        search,
        error: null,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).send("Failed to load locations");
    }
  }

  /**
   * Handle CRUD operations for locations
   *
   * Supported actions:
   * - create
   * - update
   * - delete
   *
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  static async handleLocations(req, res) {
    // To prevent XSS attacks, we can check if the input contains HTML tags and reject it
    function containsHTML(input = "") {
      return /<[^>]*>/g.test(input);
    }
    const { action } = req.body;
    const id = req.params.id || req.body.id;
    const name = req.body.name?.trim();
    const description = req.body.description?.trim();

    let error = null;

    // validation
    if (containsHTML(name)) {
      error = "Location name  not allowed HTML scripts";
    } else if (containsHTML(description)) {
      error = "Location description contains invalid characters";
    } else if (/\d/.test(name)) {
      error = "Location name must not contain numbers";
    } else if (!/^[A-Z]/.test(name)) {
      error = "Location name must start with an uppercase letter";
    } else if (!name || name.length < 2) {
      error = "Location name is too short";
    } else if (name.length > 50) {
      error = "Location name is too long";
    }

    // Validation for descriptions
    if (description && description.length > 200) {
      error = "Description is too long (max 200 characters)";
    }

    if (error) {
      const locations = await LocationModel.getAll();
      const selectedLocation = new LocationModel(id, name, description);

      return res.render("location_management.ejs", {
        authenticatedUser: req.session.user,
        locations,
        selectedLocation,
        search: "",
        error, // ✅ send error to EJS
      });
    }

    const location = new LocationModel(id, name, description);

    try {
      if (action === "create") {
        await LocationModel.create(location);
      }

      if (action === "update") {
        await LocationModel.update(location);
      }

      if (action === "delete") {
        await LocationModel.delete(id);
      }

      return res.redirect("/location");
    } catch (err) {
      console.error(err);
      return res.status(500).send("Database error");
    }
  }
}
