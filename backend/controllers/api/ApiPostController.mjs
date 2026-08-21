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
      ApiAuthenticationController.restrict(["member", "trainer", "admin"]),
      this.createPost,
    );

    this.routes.get(
      "/:id",
      ApiAuthenticationController.restrict(["member", "trainer", "admin"]),
      this.getPostById,
    );

    this.routes.delete(
      "/:id",
      ApiAuthenticationController.restrict(["member", "trainer", "admin"]),
      this.deletePost,
    );
  }

  /**
   * Get all posts
   *
   * @openapi
   * /api/post:
   *   get:
   *     summary: Get all posts
   *     tags:
   *       - Posts
   *     responses:
   *       200:
   *         description: List of posts
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: "#/components/schemas/Post"
   *
   *       500:
   *         $ref: "#/components/responses/Error"
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
   * Create a new post
   *
   * @openapi
   * /api/post:
   *   post:
   *     summary: Create a new post
   *     tags:
   *       - Posts
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
   *                     example: My first post
   *                   content:
   *                     type: string
   *                     example: This is my first post.
   *
   *     responses:
   *       201:
   *         $ref: "#/components/responses/Created"
   *
   *       401:
   *         $ref: "#/components/responses/Unauthorized"
   *
   *       403:
   *         $ref: "#/components/responses/Forbidden"
   *
   *       500:
   *         $ref: "#/components/responses/Error"
   */
  static async createPost(req, res) {
    try {
      if (!req.authenticatedUser) {
        return res.status(401).json({
          message: "Unauthorized",
        });
      }

      const post = new PostModel(
        null,
        req.authenticatedUser.id,
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
   * @openapi
   * /api/post/{id}:
   *   get:
   *     summary: Get post by ID
   *     tags:
   *       - Posts
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
   *
   *     responses:
   *       200:
   *         description: Post found successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Post"
   *
   *       400:
   *         description: Invalid post ID
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/ErrorResponse"
   *
   *       401:
   *         $ref: "#/components/responses/Unauthorized"
   *
   *       403:
   *         $ref: "#/components/responses/Forbidden"
   *
   *       404:
   *         $ref: "#/components/responses/NotFound"
   *
   *       500:
   *         $ref: "#/components/responses/Error"
   */
  static async getPostById(req, res) {
    try {
      const id = Number(req.params.id);

      if (Number.isNaN(id)) {
        return res.status(400).json({
          message: "Invalid post ID",
        });
      }

      if (!req.authenticatedUser) {
        return res.status(401).json({
          message: "Unauthorized",
        });
      }

      const post = await PostModel.getById(id);

      if (!post) {
        return res.status(404).json({
          message: "Post not found",
        });
      }

      return res.status(200).json(post);
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message: "Failed to fetch post",
      });
    }
  }

  /**
   * Delete Post
   *
   * @openapi
   * /api/post/{id}:
   *   delete:
   *     summary: Delete post
   *     tags:
   *       - Posts
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
   *
   *     responses:
   *       200:
   *         description: Post deleted successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               required:
   *                 - message
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Post deleted successfully
   *
   *       400:
   *         description: Invalid post ID
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/ErrorResponse"
   *
   *       401:
   *         $ref: "#/components/responses/Unauthorized"
   *
   *       403:
   *         $ref: "#/components/responses/Forbidden"
   *
   *       404:
   *         $ref: "#/components/responses/NotFound"
   *
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

      if (!req.authenticatedUser) {
        return res.status(401).json({
          message: "Unauthorized",
        });
      }

      const post = await PostModel.getById(id);

      if (!post) {
        return res.status(404).json({
          message: "Post not found",
        });
      }

      // Only the owner can delete the post
      if (Number(post.user_id) !== Number(req.authenticatedUser.id)) {
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
