import express from "express";
import { ApiAuthenticationController } from "./ApiAuthenticationController.mjs";
import { PostModel } from "../../models/PostModel.mjs";

export class ApiPostController {
  static routes = express.Router();

  static {
    this.routes.use(ApiAuthenticationController.middleware);

    this.routes.get("/", this.getPosts);

    this.routes.post(
      "/",
      ApiAuthenticationController.restrict(["member", "trainer"]),
      this.createPost,
    );

    this.routes.get(
      "/:id",
      ApiAuthenticationController.restrict(["member", "trainer"]),
      this.getPostById,
    );

    this.routes.delete(
      "/:id",
      ApiAuthenticationController.restrict(["member", "trainer"]),
      this.deletePost,
    );
  }

  /**
   * Get all posts
   * @openapi
   * /api/post:
   *   get:
   *     summary: "Get all posts"
   *     tags: [Posts]
   *     responses:
   *       200:
   *         description: List of posts
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: "#/components/schemas/Post"
   */
  static async getPosts(req, res) {
    try {
      const posts = await PostModel.getAll();

      console.log("Posts from DB:", posts);
      return res.status(200).json(posts);
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "Failed to load posts from database",
      });
    }
  }

  /**
   * @openapi
   * /api/post:
   *   post:
   *     summary: "Create a new post"
   *     tags: [Posts]
   *     security:
   *       - ApiKey: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - post
   *             properties:
   *               post:
   *                 type: object
   *                 required:
   *                   - title
   *                   - content
   *                 properties:
   *                   title:
   *                     type: string
   *                   content:
   *                     type: string
   *     responses:
   *       201:
   *         description: Post created
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: integer
   *                 message:
   *                   type: string
   */
  static async createPost(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const post = new PostModel(
        null,
        req.user.id,
        req.body.post.title,
        req.body.post.content,
      );

      const result = await PostModel.create(post);

      return res.status(201).json({
        id: result.insertId,
        message: "Post created.",
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "Failed to create post",
      });
    }
  }

  /**
   * Get post by ID
   *
   * This endpoint retrieves a single post based on its ID.
   * It validates the ID, checks if the post exists,
   * and returns proper error responses if needed.
   *
   * @type {express.RequestHandler}
   * @openapi
   * /api/post/{id}:
   *   get:
   *     summary: "Get post by ID"
   *     tags: [Posts]
   *     security:
   *       - ApiKey: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         description: ID of the post to retrieve
   *         schema:
   *           type: integer
   *           example: 1
   *     responses:
   *       200:
   *         description: Post found successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Post"
   *       400:
   *         description: Invalid post ID
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Invalid post ID
   *       404:
   *         description: Post not found
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Post not found
   *       500:
   *         $ref: "#/components/responses/Error"
   */
  static async getPostById(req, res) {
    try {
      // Convert route param to number
      const id = Number(req.params.id);

      // Validate ID
      if (Number.isNaN(id)) {
        return res.status(400).json({
          message: "Invalid post ID",
        });
      }

      // Fetch post from database
      const post = await PostModel.getById(id);

      // Handle not found case
      if (!post) {
        return res.status(404).json({
          message: "Post not found",
        });
      }

      // Return post data
      return res.status(200).json(post);
    } catch (error) {
      // Log server error for debugging
      console.error(error);

      return res.status(500).json({
        message: "Failed to fetch post",
      });
    }
  }

  /**
   * Delete Post
   *
   * Deletes a post by ID.
   * Only the owner of the post is allowed to delete it.
   *
   * @type {express.RequestHandler}
   * @openapi
   * /api/post/{id}:
   *   delete:
   *     summary: "Delete post"
   *     tags: [Posts]
   *     security:
   *       - ApiKey: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         description: ID of the post to delete
   *         schema:
   *           type: integer
   *           example: 1
   *     responses:
   *       200:
   *         description: Post deleted successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Post deleted successfully
   *       400:
   *         description: Invalid post ID
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Invalid post ID
   *       403:
   *         description: Forbidden (not owner of post)
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Forbidden
   *       404:
   *         description: Post not found
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Post not found
   *       500:
   *         $ref: "#/components/responses/Error"
   */
  static async deletePost(req, res) {
    try {
      const id = Number(req.params.id);

      if (Number.isNaN(id)) {
        return res.status(400).json({
          message: "Invalid post ID",
        });
      }

      const post = await PostModel.getById(id);

      if (!post) {
        return res.status(404).json({
          message: "Post not found",
        });
      }

      // ownership check
      if (post.user_id !== req.user.id) {
        return res.status(403).json({
          message: "Forbidden",
        });
      }

      await PostModel.delete(id);

      return res.status(200).json({
        message: "Post deleted successfully",
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "Failed to delete post",
      });
    }
  }
}
