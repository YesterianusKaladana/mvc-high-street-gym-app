import { DatabaseModel } from "./DatabaseModel.mjs";

/**
 * Represents a user in the system.
 * This class handles user-related database operations such as
 * creating, retrieving, updating, and deleting users.
 */
export class UserModel extends DatabaseModel {
  /**
   * Creates a new UserModel instance.
   *
   * @param {number} id - The unique ID of the user.
   * @param {string} firstName - The user's first name.
   * @param {string} lastName - The user's last name.
   * @param {string} role - The user's role (e.g., admin, member).
   * @param {string} email - The user's email.
   * @param {string} password - The user's password.
   */
  constructor(id, firstName, lastName, role, email, password, authenticationKey = null) {
    super();
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.role = role;
    this.email = email;
    this.password = password;
    this.authenticationKey = authenticationKey;
  }

  /**
   * Converts a database table row into a UserModel object.
   *
   * Works with:
   * - nestTables: true
   * - normal rows
   * - aliased tables
   */
  static tableToModel(row) {
    // Support nested mysql2 rows
    const userRow = row.user || row.users || row;
    return new UserModel(
      userRow.id,
      userRow.first_name,
      userRow.last_name,
      userRow.role,
      userRow.email,
      userRow.password,
      userRow.authentication_key
    );
  }

  /**
   * Gets all active users.
   *
   * @returns {Promise<UserModel[]>}
   */
  static async getAll() {
    return this.query(
      "SELECT * FROM user WHERE deleted = 0"
    ).then((results) => {
      return results.map((row) => this.tableToModel(row));
    });
  }

  /**
   * Gets a user by ID.
   *
   * @param {number} id
   * @returns {Promise<UserModel|null>}
   */
  static async getById(id) {
    return this.query(
      "SELECT * FROM user WHERE id = ?",
      [id]
    ).then((result) => {

      if (result.length > 0) {
        return this.tableToModel(result[0]);
      }
      return null;
    });
  }

  /**
   * Gets a user by email.
   *
   * @param {string} email
   * @returns {Promise<UserModel|null>}
   */
  static async getByEmail(email) {
    return this.query(
      `
      SELECT *
      FROM user
      WHERE email = ?
      AND deleted = 0
      `,
      [email]
    ).then((result) => {

      if (result.length > 0) {
        return this.tableToModel(result[0]);
      }
      return null;
    });
  }

  /**
   * 
   * @param {*} role 
   * @returns 
   */
  static getByRole(role) {
    return this.query(
      `SELECT * FROM user WHERE role = ? AND deleted = 0`,
      [role]
    ).then(results =>
      results.map(row => this.tableToModel(row))
    );
  }

  /**
   * 
   * @param {*} authenticationKey 
   * @returns 
   */
   static async getByAuthenticationKey(authenticationKey) {
      return this.query(
        "SELECT * FROM user WHERE authentication_key = ? AND deleted = 0",
        [authenticationKey],
      ).then((result) =>
        result.length > 0
          ? this.tableToModel(result[0])
          : Promise.reject("not found"),
      );
    }

  /**
   * Creates a new user.
   *
   * @param {UserModel} user
   * @returns {Promise<any>}
   */
  static async create(user) {
    return this.query(
      `
      INSERT INTO user
      (
        first_name,
        last_name,
        role,
        email,
        password,
        authentication_key
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        user.firstName,
        user.lastName,
        user.role,
        user.email,
        user.password,
        user.authentication_key,
      ]
    );
  }

  /**
   * Updates an existing user.
   *
   * @param {UserModel} user
   * @returns {Promise<any>}
   */
  static async update(user) {
    return this.query(
      `
      UPDATE user
      SET
        first_name = ?,
        last_name = ?,
        role = ?,
        email = ?,
        password = ?,
        authentication_key = ?
      WHERE id = ?
      `,
      [
        user.firstName,
        user.lastName,
        user.role,
        user.email,
        user.password,
        user.authenticationKey,
        user.id,
      ]
    );
  }

  /**
   * Delete users.
   *
   * @param {number} id
   * @returns {Promise<any>}
   */
  static async delete(id) {
    return this.query(
      `
      UPDATE user SET deleted = 1
      WHERE id = ?
      `,
      [id]
    );
  }
}

// TESTING AREA
// UserModel.getAll().then((user) => console.log(user));