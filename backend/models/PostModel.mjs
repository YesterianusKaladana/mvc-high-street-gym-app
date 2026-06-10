import { DatabaseModel } from "./DatabaseModel.mjs";

/**
 * Represents a blog post in the system.
 * Handles database operations for blog posts.
 */
export class PostModel extends DatabaseModel {
  /**
   * Creates a new PostModel instance.
   *
   * @param {number} id - The unique ID of the post.
   * @param {number} user_id - The ID of the user who created the post.
   * @param {string} date - The post creation date.
   * @param {string} title - The post title.
   * @param {string} content - The post content.
   */
  constructor(id, user_id, date, title, content) {
    super();

    this.id = id;
    this.user_id = user_id;
    this.date = date;
    this.title = title;
    this.content = content;
  }

  /**
   * Converts a database row into a PostModel object.
   *
   * Supports:
   * - normal rows
   * - aliased queries
   */
  static tableToModel(row) {
    const postRow = row.post || row.posts || row;

    return new PostModel(
      postRow.id,
      postRow.user_id,
      postRow.date,
      postRow.title,
      postRow.content,
    );
  }

  /**
   * Get all posts.
   *
   * @returns {Promise<PostModel[]>}
   */
  static async getAll() {
    return this.query(
      `
      SELECT *
      FROM post
      ORDER BY date DESC
    `,
    ).then((results) => {
      return results.map((row) => this.tableToModel(row));
    });
  }

  /**
   * Get a post by ID.
   *
   * @param {number} id
   * @returns {Promise<PostModel|null>}
   */
  static async getById(id) {
    return this.query(
      `
      SELECT *
      FROM post
      WHERE id = ?
    `,
      [id],
    ).then((result) => {
      if (result.length > 0) {
        return this.tableToModel(result[0]);
      }

      return null;
    });
  }

  /**
   * Create a new post.
   *
   * @param {PostModel} post
   * @returns {Promise<any>}
   */
  static async create(post) {
    return this.query(
      `
      INSERT INTO post (user_id, date, title, content)
      VALUES (?, ?, ?, ?)
    `,
      [post.user_id, post.date, post.title, post.content],
    );
  }

  /**
   * Update an existing post.
   *
   * @param {PostModel} post
   * @returns {Promise<any>}
   */
  static async update(post) {
    return this.query(
      `
      UPDATE post
      SET user_id = ?, date = ?, title = ?, content = ?
      WHERE id = ?
    `,
      [post.user_id, post.date, post.title, post.content, post.id],
    );
  }

  /**
   * Delete a post.
   *
   * @param {number} id
   * @returns {Promise<any>}
   */
  static async delete(id) {
    return this.query(
      `
      DELETE FROM post
      WHERE id = ?
    `,
      [id],
    );
  }
}

// TEST
// PostModel.getAll().then(console.log);
