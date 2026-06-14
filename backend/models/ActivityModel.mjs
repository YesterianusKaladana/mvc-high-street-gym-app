import { DatabaseModel } from "./DatabaseModel.mjs";

/**
 * Represents an activity in the system.
 * Handles all CRUD operations for activity data.
 */
export class ActivityModel extends DatabaseModel {
  /**
   * Creates a new ActivityModel instance.
   *
   * @param {number} id - The unique ID of the activity.
   * @param {string} name - The activity name.
   * @param {string} description - A description of the activity.
   */
  constructor(id, name, description) {
    super();

    this.id = id;
    this.name = name;
    this.description = description;
  }

  /**
   * Converts a database row into an ActivityModel object.
   *
   * Supports:
   * - normal rows
   * - aliased queries
   */
  static tableToModel(row) {
    const activityRow = row.activity || row.activities || row;
    return new ActivityModel(
      activityRow.id,
      activityRow.name,
      activityRow.description,
    );
  }

  /**
   * Gets all activities.
   *
   * @returns {Promise<ActivityModel[]>}
   */
  static async getAll() {
    return this.query(
      `
      SELECT * FROM activity
    `,
    ).then((results) => {
      return results.map((row) => this.tableToModel(row));
    });
  }

  /**
   * Gets activity by ID.
   *
   * @param {number} id
   * @returns {Promise<ActivityModel|null>}
   */
  static async getById(id) {
    return this.query(
      `
      SELECT * FROM activity
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
   * Creates a new activity.
   *
   * @param {ActivityModel} activity
   * @returns {Promise<any>}
   */
  static async create(activity) {
    return this.query(
      `
      INSERT INTO activity (name, description)
      VALUES (?, ?)
    `,
      [activity.name, activity.description],
    );
  }

  /**
   * Updates an activity.
   *
   * @param {ActivityModel} activity
   * @returns {Promise<any>}
   */
  static async update(activity) {
    return this.query(
      `
      UPDATE activity
      SET name = ?, description = ?
      WHERE id = ?
    `,
      [activity.name, activity.description, activity.id],
    );
  }

  /**
   * Delete an activity.
   *
   * @param {number} id
   * @returns {Promise<any>}
   */
  static async delete(id) {
    return this.query(
      `
      DELETE FROM activity
      WHERE id = ?
    `,
      [id],
    );
  }
}

// TEST
// ActivityModel.getAll().then(console.log);
