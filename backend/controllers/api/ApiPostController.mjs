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
      ApiAuthenticationController.restrict(["member"]),
      this.createPost,
    );

    this.routes.get(
      "/:id",
      ApiAuthenticationController.restrict(["member", "trainer"]),
      this.getPostById,
    );

    this.routes.put(
      "/:id",
      ApiAuthenticationController.restrict(["member", "trainer"]),
      this.updatePost,
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
    try{
      const posts = await PostModel.getAll();
      console.log("Posts from DB:", posts);
      return res.status(200).json(posts)

    } catch(error){
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
    if (!req.authenticatedUser) {
      return res.status(401).json({ 
        message: "Unauthorized",
      });
    }

    const post = new PostModel(
      null,
      req.authenticatedUser.id,
      new Date().toISOString().split("T")[0],
      req.body.post.title,
      req.body.post.content,
    );

    const result = await PostModel.create(post);

    return res.status(201).json({
      id: result.insertId,
      message: "Post created.",
    });
  }

  /**
   * Get byId
   * @openapi
   * /api/post/{id}:
   *   get:
   *     summary: "Get post by ID"
   *     tags: [Posts]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Post found
   *       404:
   *         description: Post not found
   */
  static async getPostById(req, res) {
    const post = await PostModel.getById(Number(req.params.id));

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    return res.status(200).json(post);
  }

  /**
   * Update Post
   * @openapi
   * /api/post/{id}:
   *   put:
   *     summary: "Update post"
   *     tags: [Posts]
   *     responses:
   *       501:
   *         description: Not implemented
   */
  static async updatePost(req, res) {
    return res.status(501).json({
      message: "Not implemented",
    });
  }

  /**
   * Delete Post
   * @openapi
   * /api/post/{id}:
   *   delete:
   *     summary: "Delete post"
   *     tags: [Posts]
   *     responses:
   *       200:
   *         description: Deleted successfully
   */
  static async deletePost(req, res) {
    await PostModel.delete(Number(req.params.id));

    return res.status(200).json({
      message: "Post deleted successfully",
    });
  }
}
