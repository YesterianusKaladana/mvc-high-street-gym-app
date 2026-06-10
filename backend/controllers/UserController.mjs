import express from "express";
import bcrypt from "bcryptjs";
import { UserModel } from "../models/UserModel.mjs";
import { AuthenticationController } from "./AuthenticationController.mjs";

/**
 * UserController
 * Handles all user management operations:
 * - View users (with search & role filtering)
 * - Create user
 * - Update user
 * - Delete user
 *
 * Access Control:
 * - Admin: full access
 * - Trainer: view only
 */
export class UserController {
  static routes = express.Router();

  static {
    /**
     * GET /user
     * View all users with optional search and role filter
     */
    this.routes.get(
      "/",
      AuthenticationController.restrict(["admin", "trainer"]),
      this.viewUserManagement,
    );

    /**
     * GET /user/:id
     * View users + select a specific user by ID
     */
    this.routes.get(
      "/:id",
      AuthenticationController.restrict(["admin", "trainer"]),
      this.viewUserManagement,
    );

    /**
     * POST /user
     * Create user
     */
    this.routes.post(
      "/",
      AuthenticationController.restrict(["admin"]),
      this.handleUserManagement,
    );

    /**
     * POST /user/:id
     * Update or delete user by ID
     */
    this.routes.post(
      "/:id",
      AuthenticationController.restrict(["admin"]),
      this.handleUserManagement,
    );
  }

  /**
   * View user management page
   * Supports:
   * - Search by name or email
   * - Filter by role
   * - Select specific user by ID
   *
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  static async viewUserManagement(req, res) {
    const selectedUserId = req.params.id;
    const search = req.query.search || "";
    const roleFilter = req.query.role || "";

    try {
      let users = await UserModel.getAll();

      /**
       * SEARCH FILTER
       * Matches firstName + lastName OR email
       */
      if (search) {
        users = users.filter(
          (u) =>
            (u.firstName + " " + u.lastName)
              .toLowerCase()
              .includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase()),
        );
      }

      /**
       * ROLE FILTER
       */
      if (roleFilter) {
        users = users.filter((u) => u.role === roleFilter);
      }

      /**
       * SELECTED USER
       * If invalid ID → return empty user model
       */
      const selectedUser =
        users.find((u) => u.id == selectedUserId) ||
        new UserModel(null, "", "", "", "", "");

      return res.render("user_management.ejs", {
        users,
        selectedUser,
        authenticatedUser: req.user,
        search,
        roleFilter,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).render("status.ejs", {
        status: "Error",
        message: "Failed to load users",
      });
    }
  }

  /**
   * Handle user CRUD actions:
   * - create
   * - update
   * - delete
   *
   * Includes:
   * - validation (email, password, name format)
   * - password hashing using bcrypt
   *
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  static async handleUserManagement(req, res) {
    const selectedUserId = req.params.id;
    const formData = req.body;
    const action = formData.action;

    try {
      const user = new UserModel(
        selectedUserId,
        formData.firstName,
        formData.lastName,
        formData.role,
        formData.email,
        formData.password,
      );

      /**
       * SAFE PASSWORD CHECK
       * Avoid double hashing bcrypt passwords
       */
      if (user.password && !user.password.startsWith("$2")) {
        user.password = await bcrypt.hash(user.password, 10);
      }

      // ======================================================
      // CREATE USER
      // ======================================================
      if (action === "create") {
        const { firstName, lastName, role, email, password } = formData;

        /**
         * NAME VALIDATION
         * Must start with uppercase letter
         */
        const nameRegex = /^([A-Z][a-z]+)( [A-Z][a-z]+)*$/;

        if (!nameRegex.test(firstName) || !nameRegex.test(lastName)) {
          return res.status(400).render("status.ejs", {
            status: "Error",
            message:
              "Invalid name format - first name and last name must be uppercase",
          });
        }

        /**
         * EMAIL VALIDATION
         */
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
          return res.status(400).render("status.ejs", {
            status: "Error",
            message: "Invalid email format",
          });
        }

        /**
         * PASSWORD VALIDATION
         */
        if (password.length < 6) {
          return res.status(400).render("status.ejs", {
            status: "Error",
            message: "Password must be at least 6 characters",
          });
        }

        /**
         * HASH PASSWORD BEFORE SAVE
         */
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new UserModel(
          null,
          firstName,
          lastName,
          role,
          email,
          hashedPassword,
        );

        await UserModel.create(user);
        return res.redirect("/user");
      }

      // ======================================================
      // UPDATE USER
      // ======================================================
      if (action === "update") {
        const existingUser = await UserModel.getById(selectedUserId);

        existingUser.firstName = formData.firstName;
        existingUser.lastName = formData.lastName;
        existingUser.role = formData.role;
        existingUser.email = formData.email;

        // Only update password if provided
        if (formData.password) {
          existingUser.password = await bcrypt.hash(formData.password, 10);
        }

        await UserModel.update(existingUser);
        return res.redirect("/user");
      }

      // ======================================================
      // DELETE USER
      // ======================================================
      if (action === "delete") {
        const result = await UserModel.delete(selectedUserId);

        if (result.affectedRows > 0) {
          return res.redirect("/user");
        }

        return res.status(404).render("status.ejs", {
          status: "Error",
          message: "User not found",
        });
      }

      return res.status(400).render("status.ejs", {
        status: "Invalid action",
        message: "Unsupported form action",
      });
    } catch (error) {
      console.error(error);
      return res.status(500).render("status.ejs", {
        status: "Database error",
        message: "Operation failed",
      });
    }
  }
}
