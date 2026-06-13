import express from "express";
import { PostModel } from "../models/PostModel.mjs";
import { UserPostModel } from "../models/UserPostModel.mjs";
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
    this.routes.get("/public", this.viewPublicBlog);

    /**
     * GET /
     * View all posts + optional search
     */
    this.routes.get(
      "/",
      AuthenticationController.restrict(["admin"]),
      this.viewPosts,
    );

    this.routes.get(
      "/member",
      AuthenticationController.restrict(["member"]),
      this.viewMemberPosts,
    );

    this.routes.get(
      "/member/create",
      AuthenticationController.restrict(["member"]),
      this.viewCreateMemberPostPage,
    );

    this.routes.post(
      "/member/create",
      AuthenticationController.restrict(["member"]),
      this.handleMemberPost,
    );

    this.routes.get(
      "/trainer",
      AuthenticationController.restrict(["trainer"]),
      this.viewTrainerPosts,
    );

    this.routes.get(
      "/trainer/create",
      AuthenticationController.restrict(["trainer"]),
      this.viewCreateTrainerPostPage,
    );

    this.routes.post(
      "/trainer/create",
      AuthenticationController.restrict(["trainer"]),
      this.handleTrainerPost,
    );

    /**
     * POST /
     * Handles create, update, delete actions for posts
     */
    this.routes.post(
      "/",
      AuthenticationController.restrict(["admin"]),
      this.handlePostsManagement,
    );

    /**
     * GET /:id
     * View a single post by ID (with permission checks)
     */
    this.routes.get(
      "/:id",
      AuthenticationController.restrict(["admin"]),
      this.viewPostById,
    );
  }

  static async viewPublicBlog(req, res) {
    try {
      const posts = await PostModel.getAll();
      return res.render("blog_post", {
        posts,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).render("status.ejs", {
        status: "Failed to load public blog",
        message: "An error occurred while loading the public blog.",
      });
    }
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
    } catch (error) {
      console.error(error);
      return res.status(500).render("status.ejs", {
        status: "Failed to load posts",
        message: "An error occurred while loading the posts.",
      });
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
        return res.status(401).render("status.ejs", {
          status: "Not Authenticated",
          message: "You must be logged in to view this post.",
        });
      }

      if (!selectedPost) {
        return res.status(404).render("status.ejs", {
          status: "Post Not Found",
          message: "The requested post was not found.",
        });
      }

      const isOwner = selectedPost.user_id === user.id;

      return res.render("post_management.ejs", {
        authenticatedUser: user,
        posts,
        selectedPost,
        search: "",
        error: null,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).render("status.ejs", {
        status: "Failed to load post",
        message: "An error occurred while loading the post.",
      });
    }
  }

  static async viewMemberPosts(req, res) {
    try {
      // STRICT ACCESS CONTROL
      if (!req.user || req.user.role !== "member") {
        return res.status(403).render("status.ejs", {
          status: "Access Denied",
          message: "Access denied. Members only.",
        });
      }

      const posts = await PostModel.getAll();

      // Filter posts to only include those created by the authenticated member
      const memberPosts = posts.filter((p) => p.user_id === req.user.id);

      return res.render("member_post.ejs", {
        authenticatedUser: req.user,
        posts: memberPosts,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).render("status.ejs", {
        status: "Failed to load member page",
        message: "An error occurred while loading the member page.",
      });
    }
  }

  static async viewCreateMemberPostPage(req, res) {
    try {
      if (!req.user || req.user.role !== "member") {
        return res.status(403).render("status.ejs", {
          status: "Access Denied",
          message: "Access denied. Members only.",
        });
      }

      return res.render("member_create_post.ejs", {
        authenticatedUser: req.user,
        error: null,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).render("status.ejs", {
        status: "Failed to load create page",
        message: "An error occurred while loading the create page.",
      });
    }
  }

  static async handleMemberPost(req, res) {
    try {
      const user = req.user;

      if (!user || user.role !== "member") {
        return res.status(403).render("status.ejs", {
          status: "Access Denied",
          message: "Access denied. Members only.",
        });
      }

      const { title, content } = req.body;

      const cleanTitle = title?.trim();
      const cleanContent = content?.trim();

      // -------------------------
      // VALIDATION (safe + XSS block)
      // -------------------------
      function containsDangerousHTML(text) {
        return /<\s*script.*?>|<\/?\s*script\s*>|<.*?>/i.test(text);
      }

      if (!cleanTitle || !cleanContent) {
        return res.status(400).render("status.ejs", {
          status: "Invalid Input",
          message: "Title and content are required",
        });
      }

      if (cleanTitle.length < 2 || cleanTitle.length > 50) {
        return res.status(400).render("status.ejs", {
          status: "Invalid Input",
          message: "Title must be between 2 and 50 characters",
        });
      }

      if (cleanContent.length < 5 || cleanContent.length > 2000) {
        return res.status(400).render("status.ejs", {
          status: "Invalid Input",
          message: "Content must be between 5 and 2000 characters",
        });
      }

      // -------------------------
      // CREATE POST
      // -------------------------
      const post = new PostModel(null, user.id, cleanTitle, cleanContent);

      await PostModel.create(post);

      // redirect back to member feed
      return res.redirect("/post/member");
    } catch (error) {
      console.error(error);
      return res.status(500).render("status.ejs", {
        status: "Failed to create post",
        message: "An error occurred while creating the post.",
      });
    }
  }

  static async viewTrainerPosts(req, res) {
    try {
      if (!req.user || req.user.role !== "trainer") {
        return res.status(403).render("status.ejs", {
          status: "Access Denied",
          message: "Access denied. Trainers only.",
        });
      }

      const posts = await PostModel.getAll();
      const trainerPosts = posts.filter((p) => p.user_id === req.user.id);

      return res.render("trainer_post.ejs", {
        authenticatedUser: req.user,
        posts: trainerPosts,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).render("status.ejs", {
        status: "Failed to load trainer page",
        message: "An error occurred while loading the trainer page.",
      });
    }
  }

  static async viewCreateTrainerPostPage(req, res) {
    try {
      if (!req.user || req.user.role !== "trainer") {
        return res.status(403).render("status.ejs", {
          status: "Access Denied",
          message: "Access denied. Trainers only.",
        });
      }

      return res.render("trainer_create_post.ejs", {
        authenticatedUser: req.user,
        error: null,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).render("status.ejs", {
        status: "Failed to load create page",
        message: "An error occurred while loading the create page.",
      });
    }
  }

  static async handleTrainerPost(req, res) {
    try {
      const user = req.user;

      if (!user || user.role !== "trainer") {
        return res.status(403).render("status.ejs", {
          status: "Access Denied",
          message: "Access denied. Trainers only.",
        });
      }

      const { action, id, title, content } = req.body;

      const cleanTitle = title?.trim();
      const cleanContent = content?.trim();

      function containsDangerousHTML(text) {
        return /<\s*script.*?>|<\/?\s*script\s*>|<.*?>/i.test(text);
      }

      // =========================
      // CREATE
      // =========================
      if (!action || action === "create") {
        if (!cleanTitle || !cleanContent) {
          return res.status(400).render("status.ejs", {
            status: "Invalid Input",
            message: "Title and content are required",
          });
        }

        const post = new PostModel(null, user.id, cleanTitle, cleanContent);
        await PostModel.create(post);

        return res.redirect("/post/trainer");
      }

      // =========================
      // UPDATE
      // =========================
      if (action === "update") {
        const post = await PostModel.findById(id);

        if (!post) {
          return res.status(404).render("status.ejs", {
            status: "Post Not Found",
            message: "The requested post was not found.",
          });
        }

        if (post.userId !== user.id && user.role !== "admin") {
          return res.status(403).render("status.ejs", {
            status: "Access Denied",
            message: "You are not the owner of this post.",
          });
        }

        await PostModel.update(id, {
          title: cleanTitle,
          content: cleanContent,
        });

        return res.redirect("/post/trainer");
      }

      // =========================
      // DELETE
      // =========================
      if (action === "delete") {
        const post = await PostModel.getById(id);

        if (!post) {
          return res.status(404).render("status.ejs", {
            status: "Post Not Found",
            message: "The requested post was not found.",
          });
        }

        const isOwner = post.user_id === user.id;
        const isAdmin = user.role === "admin";

        if (!isOwner && !isAdmin) {
          return res.status(403).render("status.ejs", {
            status: "Access Denied",
            message: "You are not allowed to delete this post.",
          });
        }

        await PostModel.delete(id);

        return res.redirect("/post/trainer");
      }
    } catch (error) {
      console.error(error);
      return res.status(500).render("status.ejs", {
        status: "Server Error",
        message: "Something went wrong.",
      });
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
  static async handlePostsManagement(req, res) {
    // This is a function to check for dangerous HTML tags to prevent XSS
    function containsDangerousHTML(text) {
      return /<\s*script.*?>|<\/?\s*script\s*>|<.*?>/i.test(text);
    }

    const { action, id, title, content } = req.body;
    const user = req.user;

    if (!user) {
      return res.status(401).send("Not authenticated");
    }

    const cleanTitle = title?.trim();
    const cleanContent = content?.trim();

    let error = null;

    // TITLE VALIDATION
    if (!cleanTitle || cleanTitle.length === 0) {
      error = "Post title is required";
    } else if (containsDangerousHTML(cleanTitle)) {
      error = "HTML or scripts are not allowed in title";
    } else if (/\d/.test(cleanTitle)) {
      error = "Post title must not contain numbers";
    } else if (!/^[A-Z]/.test(cleanTitle)) {
      error = "Post title must start with an uppercase letter";
    } else if (cleanTitle.length < 2) {
      error = "Post title is too short";
    } else if (cleanTitle.length > 50) {
      error = "Post title must not exceed 50 characters";
    }

    // CONTENT VALIDATION
    else if (!cleanContent || cleanContent.length === 0) {
      error = "Post content is required";
    } else if (containsDangerousHTML(cleanContent)) {
      error = "HTML or scripts are not allowed in content";
    } else if (cleanContent.length < 5) {
      error = "Post content is too short (minimum 5 characters)";
    } else if (cleanContent.length > 2000) {
      error = "Post content must not exceed 2000 characters";
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

        const post = new PostModel(null, user.id, cleanTitle, cleanContent);
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
          return res.status(403).render("status.ejs", {
            status: "Access Denied",
            message: "You can only edit your own posts.",
          });
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
          cleanTitle,
          cleanContent,
        );
        await PostModel.update(post);

        return res.redirect("/post");
      }

      /**
       * DELETE
       */
      if (action === "delete") {
        if (!existingPost) {
          return res.status(404).render("status.ejs", {
            status: "Post Not Found",
            message: "The requested post was not found.",
          });
        }

        const isOwner = existingPost.user_id === user.id;
        const isAdmin = user.role === "admin";

        if (!isOwner && !isAdmin) {
          return res.status(403).render("status.ejs", {
            status: "Access Denied",
            message: "You cannot delete this post.",
          });
        }

        await PostModel.delete(id);

        return res.redirect("/post");
      }
      return res.status(400).render("status.ejs", {
        status: "Invalid Action",
        message: "The requested action is not valid.",
      });
    } catch (error) {
      console.error(error);
      return res.status(500).render("status.ejs", {
        status: "Database Error",
        message: "An error occurred while processing your request.",
      });
    }
  }
}
