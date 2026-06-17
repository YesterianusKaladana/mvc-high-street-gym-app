import mysql from "mysql2/promise";

/**
 * This class handles the connection to the database
 * and provides simple helper functions for running queries
 * and formatting dates for MySQL.
 */
export class DatabaseModel {
  /**
   * Stores the database connection pool.
   * This lets the app reuse connections instead of
   * opening a new one every time.
   */
  static connection;

  /**
   * This runs automatically when the class starts.
   * It creates the connection to the MySQL database.
   */
  static {
    this.connection = mysql.createPool({
      host: "localhost",
      user: "gym_database_user",
      password: "streetgym2026",
      database: "gym_database",
      nestTables: true,
    });
  }

  /**
   * Runs an SQL query in the database.
   * Destructuring assignment
   *
   * @param {string} sql - The SQL command to run
   * @param {Array} values - Optional values for the query
   * @returns {Promise<any>} The result from the database
   */
  static async query(sql, values) {
    return this.connection.query(sql, values).then(([result]) => result);
  }

  /**
   * Changes a JavaScript Date into MySQL date format.
   *
   * MySQL uses this format: YYYY-MM-DD
   * Example: 2026-04-29
   *
   * @param {Date} date - The date to format
   * @returns {string} The formatted date
   */
  static toMySqlDate(date) {
    const year = date.toLocaleString("default", { year: "numeric" });
    const month = date.toLocaleString("default", { month: "2-digit" });
    const day = date.toLocaleString("default", { day: "2-digit" });

    return [year, month, day].join("-");
  }
}
