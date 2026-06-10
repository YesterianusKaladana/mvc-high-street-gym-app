import express from "express";
import { PostModel } from "../models/PostModel.mjs";
import { AuthenticationController } from "./AuthenticationController.mjs";

/**
 * PostController
 * Handles all post-related routes including:
 * - Viewing posts
 * - Searching posts
 * - Viewing a single post
 * - Creating, updating, deleting posts (CRUD)
 *
 * Access is controlled based on user roles:
 * admin, trainer, member
 */
export class PostController {
  static routes = express.Router();

  static {
    /**
     * GET /
     * View all posts + optional search
     */
    this.routes.get(
      "/",
      AuthenticationController.restrict(["admin", "trainer", "member"]),
      this.viewPosts,
    );

    /**
     * POST /
     * Handles create, update, delete actions for posts
     */
    this.routes.post(
      "/",
      AuthenticationController.restrict(["admin", "trainer", "member"]),
      this.handlePosts,
    );

    /**
     * GET /:id
     * View a single post by ID (with permission checks)
     */
    this.routes.get(
      "/:id",
      AuthenticationController.restrict(["admin", "trainer", "member"]),
      this.viewPostById,
    );
  }

  /**
   * View all posts
   * Supports optional search by title
   * @type {express.Request}
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  static async viewPosts(req, res) {
    try {
      let posts = await PostModel.getAll();
      const search = req.query.search || "";

      // Filter posts by title if search query exists
      if (search) {
        posts = posts.filter((p) =>
          p.title.toLowerCase().includes(search.toLowerCase()),
        );
      }

      return res.render("post_management.ejs", {
        authenticatedUser: req.user,
        posts,
        selectedPost: null,
        search,
        error: null,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).send("Failed to load posts");
    }
  }

  /**
   * View a single post by ID
   * Includes authorization:
   * - Admin: full access
   * - Trainer: full access
   * - Owner: can view their own post
   *
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  static async viewPostById(req, res) {
    try {
      const posts = await PostModel.getAll();
      const selectedPost = await PostModel.getById(req.params.id);
      const user = req.user || req.authenticatedUser;

      if (!user) {
        return res.status(401).send("Not authenticated");
      }

      if (!selectedPost) {
        return res.status(404).send("Post not found");
      }

      const isOwner = selectedPost.user_id === user.id;
      const isAdmin = user.role === "admin";
      const isTrainer = user.role === "trainer";

      // Access control: admin + trainer + owner only
      if (!isOwner && !isAdmin && !isTrainer) {
        return res.status(403).send("You cannot access this post");
      }

      return res.render("post_management.ejs", {
        authenticatedUser: user,
        posts,
        selectedPost,
        search: "",
        error: null,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).send("Failed to load post");
    }
  }

  /**
   * Handle all CRUD actions for posts
   * Supported actions:
   * - create → create new post
   * - update → update existing post (owner only)
   * - delete → delete post (admin or owner)
   * @type {express.RequestHandler}
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  static async handlePosts(req, res) {
    const { action, id, date, title, content } = req.body;
    const user = req.user;

    if (!user) {
      return res.status(401).send("Not authenticated");
    }

    const cleanTitle = title?.trim();

    let error = null;

    // ✅ VALIDATION
    if (!cleanTitle || cleanTitle.length === 0) {
      error = "Post title is required";
    } else if (/\d/.test(cleanTitle)) {
      error = "Post title must not contain numbers";
    } else if (!/^[A-Z]/.test(cleanTitle)) {
      error = "Post title must start with an uppercase letter";
    } else if (cleanTitle.length < 2) {
      error = "Post title is too short";
    } else if (cleanTitle.length > 50) {
      error = "Post title must not exceed 50 characters";
    }

    try {
      const existingPost = id ? await PostModel.getById(id) : null;

      /**
       * CREATE
       */
      if (action === "create") {
        if (error) {
          const posts = await PostModel.getAll();

          return res.render("post_management.ejs", {
            authenticatedUser: user,
            posts,
            selectedPost: null,
            search: "",
            error,
          });
        }

        const post = new PostModel(null, user.id, date, cleanTitle, content);
        await PostModel.create(post);

        return res.redirect("/post");
      }

      /**
       * UPDATE
       */
      if (action === "update") {
        if (!existingPost) {
          return res.status(404).send("Post not found");
        }

        const isOwner = existingPost.user_id === user.id;

        if (!isOwner) {
          return res.status(403).send("You can only edit your own posts");
        }

        if (error) {
          const posts = await PostModel.getAll();

          return res.render("post_management.ejs", {
            authenticatedUser: user,
            posts,
            selectedPost: existingPost,
            search: "",
            error,
          });
        }

        const post = new PostModel(
          id,
          existingPost.user_id,
          date,
          cleanTitle,
          content,
        );
        await PostModel.update(post);

        return res.redirect("/post");
      }

      /**
       * DELETE
       */
      if (action === "delete") {
        if (!existingPost) {
          return res.status(404).send("Post not found");
        }

        const isOwner = existingPost.user_id === user.id;
        const isAdmin = user.role === "admin";

        if (!isOwner && !isAdmin) {
          return res.status(403).send("You cannot delete this post");
        }

        await PostModel.delete(id);

        return res.redirect("/post");
      }

      return res.status(400).send("Invalid action");
    } catch (err) {
      console.error(err);
      return res.status(500).send("Database error");
    }
  }
}
