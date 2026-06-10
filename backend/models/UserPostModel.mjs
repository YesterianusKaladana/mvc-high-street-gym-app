import { DatabaseModel } from "./DatabaseModel.mjs";
import { UserModel } from "./UserModel.mjs";
import { PostModel } from "./PostModel.mjs";

/**
 * UserPostModel
 *
 * Combined model representing a blog post and its author (user).
 *
 * This model is used to:
 * - Display posts with author information
 * - Join post and user tables into a single structured object
 * - Simplify frontend rendering of community/blog content
 *
 * Instead of returning raw SQL rows, it returns:
 * {
 *   post: PostModel,
 *   user: UserModel
 * }
 */
export class UserPostModel extends DatabaseModel {

  /**
   * Creates a combined Post + User object
   *
   * @param {PostModel} post - Blog post data
   * @param {UserModel} user - Author of the post
   */
  constructor(post, user) {
    super();
    this.post = post;
    this.user = user;
  }

  /**
   * Converts a SQL JOIN row into a UserPostModel
   *
   * Expected structure:
   * - row.post → post table fields
   * - row.user → user table fields
   *
   * @param {Object} row - database row from JOIN query
   * @returns {UserPostModel}
   */
  static tableToModel(row) {
    return new UserPostModel(
      PostModel.tableToModel(row.post),
      UserModel.tableToModel(row.user),
    );
  }

  /**
   * Retrieves all posts with their associated user (author)
   *
   * @returns {Promise<UserPostModel[]>}
   */
  static async getAll() {
    const results = await this.query(`
      SELECT
        post.*,
        user.*

      FROM post AS post

      INNER JOIN user AS user
        ON post.user_id = user.id
    `);

    return results.map((row) => this.tableToModel(row));
  }

  /**
   * Retrieves a single post with its author
   *
   * @param {number} id - Post ID
   * @returns {Promise<UserPostModel|null>}
   */
  static async getById(id) {
    const results = await this.query(
      `
      SELECT
        post.*,
        user.*

      FROM post AS post

      INNER JOIN user AS user
        ON post.user_id = user.id

      WHERE post.id = ?
    `,
      [id],
    );

    if (results.length === 0) {
      return null;
    }

    return this.tableToModel(results[0]);
  }
}