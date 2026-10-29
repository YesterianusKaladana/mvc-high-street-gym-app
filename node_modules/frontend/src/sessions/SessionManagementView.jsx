import { useState, useEffect, useCallback } from "react";
import { FaPerson, FaLocationDot, FaCalendarDays, FaClock, FaUsers } from "react-icons/fa6";
import { FaSearch, FaPlus, FaEdit, FaTrash, FaTimes } from "react-icons/fa";
import { fetchAPI } from "../api.mjs";
import { useAuthenticate } from "../authentication/UseAuthenticate";

function SessionManagementView() {
  // Get the authenticated user and their role
  const { user, status } = useAuthenticate(["trainer"]);

  // Store the trainer's sessions and the available activity and location options.
  const [sessions, setSessions] = useState([]);
  const [activities, setActivities] = useState([]);
  const [locations, setLocations] = useState([]);

  // Store the search text and messages displayed to the trainer.
  const [filter, setFilter] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Track loading and saving states to control the user interface.
  const [isLoading, setIsLoading] = useState(true);
  const [isOptionsLoading, setIsOptionsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Track whether a session is being edited or a new session is being created.
  const [editingSession, setEditingSession] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  // Store the values entered into the create and edit session form.
  const [editForm, setEditForm] = useState({
    activity_id: "",
    location_id: "",
    date: "",
    start_time: "",
    end_time: "",
    capacity: "",
  });

  // Fetch the trainer's sessions and filter them using the search text.
  const getSessions = useCallback(async (searchFilter = "") => {
    const authKey = localStorage.getItem("auth-key");

    // Stop if the user is not logged in.
    if (!authKey) {
      setSessions([]);
      setError("Please log in to view your sessions.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Request all sessions from the backend using the authentication key.
      const response = await fetchAPI("GET", "/session", null, authKey);

      if (response.status !== 200) {
        throw new Error(response.body?.message || "Failed to load sessions.");
      }

      // Make sure the API response contains an array of sessions.
      const allSessions = Array.isArray(response.body) ? response.body : [];

      // Convert the search text to lowercase for case-insensitive searching.
      const searchTerm = searchFilter.trim().toLowerCase();

      // Filter sessions by activity, location, trainer, date, time, or capacity.
      const filteredSessions = searchTerm
        ? allSessions.filter((session) =>
          [
            session.activity_name,
            session.location_name,
            session.trainer_name,
            session.date,
            session.start_time,
            session.end_time,
            session.capacity,
          ].some((value) =>
            String(value ?? "").toLowerCase().includes(searchTerm),
          ),
        )
        : allSessions;

      // Update the sessions displayed on the page.
      setSessions(filteredSessions);

      // Display a message when the search has no matching results.
      if (filteredSessions.length === 0 && searchTerm) {
        setError("No results found.");
      }
    } catch (err) {
      // Log errors and clear the sessions if the request fails.
      console.error("Failed to load sessions:", err);
      setSessions([]);
      setError(err.message || String(err));
    } finally {
      // Stop the loading indicator after the request finishes.
      setIsLoading(false);
    }
  }, []);

  // Fetch the activities and locations used in the session form dropdowns.
  const getSessionOptions = useCallback(async () => {
    const authKey = localStorage.getItem("auth-key");

    // Clear the dropdown options if the user is not logged in.
    if (!authKey) {
      setActivities([]);
      setLocations([]);
      setIsOptionsLoading(false);
      return;
    }

    setIsOptionsLoading(true);

    try {
      // Load activities and locations at the same time.
      const [activityResponse, locationResponse] = await Promise.all([
        fetchAPI("GET", "/activity", null, authKey),
        fetchAPI("GET", "/location", null, authKey),
      ]);

      // Check whether the activity request was successful.
      if (activityResponse.status !== 200) {
        throw new Error(
          activityResponse.body?.message || "Failed to load activities.",
        );
      }

      // Check whether the location request was successful.
      if (locationResponse.status !== 200) {
        throw new Error(
          locationResponse.body?.message || "Failed to load locations.",
        );
      }

      const activityData = activityResponse.body;
      const locationData = locationResponse.body;

      // Make sure both API responses contain arrays.
      if (!Array.isArray(activityData) || !Array.isArray(locationData)) {
        throw new Error("The activity or location API did not return an array.");
      }

      // Store the options so the trainer can select them in the form.
      setActivities(activityData);
      setLocations(locationData);
    } catch (err) {
      // Clear the dropdown options and display an error if loading fails.
      console.error("Failed to load session options:", err);
      setActivities([]);
      setLocations([]);
      setError(err.message || String(err));
    } finally {
      // Stop the dropdown loading indicators.
      setIsOptionsLoading(false);
    }
  }, []);

  // Load sessions and dropdown options when the component first renders.
  useEffect(() => {
    getSessions();
    getSessionOptions();
  }, [getSessions, getSessionOptions]);

  // Open the edit form and fill it with the selected session's current values.
  const handleEdit = (session) => {
    setError(null);
    setSuccess(null);
    setEditingSession(session);
    setIsCreating(false);

    // Convert database values into strings suitable for form inputs.
    setEditForm({
      activity_id: String(session.activity_id ?? ""),
      location_id: String(session.location_id ?? ""),
      date: session.date ? String(session.date).substring(0, 10) : "",
      start_time: session.start_time
        ? String(session.start_time).substring(0, 5)
        : "",
      end_time: session.end_time
        ? String(session.end_time).substring(0, 5)
        : "",
      capacity: String(session.capacity ?? ""),
    });

    // Reload dropdown options if they are not available.
    if (activities.length === 0 || locations.length === 0) {
      getSessionOptions();
    }
  };

  // Open a blank form for creating a new training session.
  const handleCreate = () => {
    setError(null);
    setSuccess(null);
    setEditingSession(null);
    setIsCreating(true);

    // Reset all form fields before creating a new session.
    setEditForm({
      activity_id: "",
      location_id: "",
      date: "",
      start_time: "",
      end_time: "",
      capacity: "",
    });

    // Load dropdown options if they have not been loaded yet.
    if (activities.length === 0 || locations.length === 0) {
      getSessionOptions();
    }
  };

  // Delete a session after asking the trainer to confirm the action.
  const handleDelete = async (session) => {
    const authKey = localStorage.getItem("auth-key");

    // Require authentication before allowing a session to be deleted.
    if (!authKey) {
      setError("Please log in to manage your sessions.");
      return;
    }

    // Cancel the operation if the trainer does not confirm deletion.
    if (!window.confirm("Are you sure you want to delete this session?")) {
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Send a DELETE request for the selected session.
      const response = await fetchAPI(
        "DELETE",
        `/session/${session.session_id}`,
        null,
        authKey,
      );

      if (response.status === 200) {
        // Show confirmation and refresh the session list.
        setSuccess("Session deleted successfully.");
        await getSessions(filter);
      } else {
        // Display the backend error if deletion fails.
        setError(response.body?.message || "Failed to delete the session.");
      }
    } catch (err) {
      // Handle network errors or other unexpected failures.
      setError(err.message || String(err));
    } finally {
      // Allow further actions when the deletion request finishes.
      setIsSaving(false);
    }
  };

  // Update the form state whenever a field changes.
  const handleFormChange = (event) => {
    const { name, value } = event.target;

    // Update only the field that changed while keeping other values.
    setEditForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Close the form without saving changes.
  const handleCancel = () => {
    // Prevent the form from closing while a save operation is in progress.
    if (isSaving) return;

    setEditingSession(null);
    setIsCreating(false);
    setError(null);
  };

  // Validate and submit the form to create or update a session.
  const handleSave = async (event) => {
    // Prevent the browser from reloading the page when the form is submitted.
    event.preventDefault();

    const authKey = localStorage.getItem("auth-key");

    // Require authentication before allowing changes.
    if (!authKey) {
      setError("Please log in to manage your sessions.");
      return;
    }

    // Check that every required field has a value.
    if (
      !editForm.activity_id ||
      !editForm.location_id ||
      !editForm.date ||
      !editForm.start_time ||
      !editForm.end_time ||
      editForm.capacity === ""
    ) {
      setError("Please complete all session fields.");
      return;
    }

    // Confirm that the selected activity exists in the loaded options.
    const activityExists = activities.some(
      (activity) => String(activity.id) === editForm.activity_id,
    );

    // Confirm that the selected location exists in the loaded options.
    const locationExists = locations.some(
      (location) => String(location.id) === editForm.location_id,
    );

    if (!activityExists) {
      setError("Please select a valid activity.");
      return;
    }

    if (!locationExists) {
      setError("Please select a valid location.");
      return;
    }

    // Make sure the session ends after it starts.
    if (editForm.start_time >= editForm.end_time) {
      setError("The end time must be later than the start time.");
      return;
    }

    // Make sure capacity is a whole number greater than zero.
    if (
      !Number.isInteger(Number(editForm.capacity)) ||
      Number(editForm.capacity) < 1
    ) {
      setError("Capacity must be a whole number greater than zero.");
      return;
    }

    // Combine the session date and start time to validate the start date.
    const sessionDateTime = new Date(`${editForm.date}T${editForm.start_time}`);

    // Prevent sessions from starting in the past or at the current time.
    if (
      Number.isNaN(sessionDateTime.getTime()) ||
      sessionDateTime <= new Date()
    ) {
      setError("The session must start in the future.");
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    // Convert form values to the correct data types for the API.
    const sessionData = {
      activity_id: Number(editForm.activity_id),
      location_id: Number(editForm.location_id),
      date: editForm.date,
      start_time: editForm.start_time,
      end_time: editForm.end_time,
      capacity: Number(editForm.capacity),
    };

    try {
      // Send POST to create a session or PUT to update the selected session.
      const response = isCreating
        ? await fetchAPI("POST", "/session", sessionData, authKey)
        : await fetchAPI(
          "PUT",
          `/session/${editingSession.session_id}`,
          sessionData,
          authKey,
        );

      if (response.status === 200 || response.status === 201) {
        // Show the appropriate success message after saving.
        setSuccess(
          isCreating
            ? "Session created successfully."
            : "Session updated successfully.",
        );

        // Close the form and refresh the session list.
        setEditingSession(null);
        setIsCreating(false);
        await getSessions(filter);
      } else {
        // Display the error returned by the backend.
        setError(response.body?.message || "Failed to save the session.");
      }
    } catch (err) {
      // Handle unexpected errors during creation or updating.
      setError(err.message || String(err));
    } finally {
      // Stop the saving indicator after the request completes.
      setIsSaving(false);
    }
  };

  // Format a date as YYYY-MM-DD for display.
  const formatDate = (date) =>
    date ? String(date).substring(0, 10) : "Not set";

  // Format a time as HH:MM for display.
  const formatTime = (time) =>
    time ? String(time).substring(0, 5) : "Not set";

  return (
    <section className="flex min-w-0 flex-col items-center">
      <div className="flex w-full justify-start p-4">
        {/* Open the blank form to create a new session. */}
        <button
          type="button"
          onClick={handleCreate}
          className="btn btn-primary"
        >
          <FaPlus />
          Create New Session
        </button>
      </div>

      {/* Search the trainer's sessions by matching their details. */}
      <form
        className="join self-stretch p-4 pt-0"
        onSubmit={(event) => {
          event.preventDefault();
          getSessions(filter);
        }}
      >
        <input
          type="search"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          className="input input-bordered join-item grow"
          placeholder="Search your sessions"
          aria-label="Search your sessions"
        />

        <button type="submit" className="btn join-item" aria-label="Search">
          <FaSearch />
        </button>
      </form>

      {/* Display a success message with an option to dismiss it. */}
      {success && (
        <div className="alert alert-success mx-4 mb-3 w-auto self-stretch text-sm">
          <span>{success}</span>
          <button
            type="button"
            className="btn btn-ghost btn-xs"
            onClick={() => setSuccess(null)}
            aria-label="Dismiss success message"
          >
            <FaTimes />
          </button>
        </div>
      )}

      {/* Display an error message with an option to dismiss it. */}
      {error && (
        <div className="alert alert-error mx-4 mb-3 w-auto self-stretch text-sm">
          <span>{error}</span>
          <button
            type="button"
            className="btn btn-ghost btn-xs"
            onClick={() => setError(null)}
            aria-label="Dismiss error message"
          >
            <FaTimes />
          </button>
        </div>
      )}

      {/* Show a spinner, an empty-state message, or the session list. */}
      {isLoading ? (
        <span className="loading loading-spinner loading-xl m-8" />
      ) : sessions.length === 0 ? (
        <span className="p-4 text-sm opacity-60">
          {filter.trim()
            ? "No matching sessions found."
            : "You have no sessions yet."}
        </span>
      ) : (
        <ul className="list w-full self-stretch gap-3 px-4">
          {/* Display each session with its details and available actions. */}
          {sessions.map((session) => (
            <li
              key={session.session_id}
              className="list-row mb-3 items-center gap-4 rounded-xl border border-blue-500 p-4 shadow-sm"
            >
              <div className="min-w-0 space-y-2">
                <div className="flex items-center gap-2 break-words font-semibold">
                  <FaPerson className="shrink-0 text-primary" />
                  <span>{session.activity_name || "N/A"}</span>
                </div>

                <div className="flex items-center gap-2 text-sm uppercase opacity-70">
                  <FaLocationDot className="shrink-0 text-primary" />
                  <span>{session.location_name || "N/A"}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <FaCalendarDays className="shrink-0 text-primary" />
                  <span>{formatDate(session.date)}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <FaClock className="shrink-0 text-primary" />
                  <span>
                    {formatTime(session.start_time)} –{" "}
                    {formatTime(session.end_time)}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm opacity-70">
                  <FaUsers className="shrink-0 text-primary" />
                  <span>Capacity: {session.capacity ?? "Not set"}</span>
                </div>
              </div>

              {/* Provide buttons for editing and deleting this session. */}
              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => handleEdit(session)}
                  className="btn btn-ghost btn-sm"
                  aria-label="Edit session"
                  title="Edit session"
                >
                  <FaEdit />
                  <span className="hidden sm:inline">Edit</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(session)}
                  className="btn btn-ghost btn-sm text-error"
                  disabled={isSaving}
                  aria-label="Delete session"
                  title="Delete session"
                >
                  <FaTrash />
                  <span className="hidden sm:inline">Delete</span>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Show the create/edit modal when either form mode is active. */}
      {(isCreating || editingSession) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3">
          <div
            className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-sm flex-col overflow-hidden rounded-xl bg-base-100 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="session-form-title"
          >
            {/* Display the form title and close button. */}
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-base-200 p-4">
              <div>
                <h2 id="session-form-title" className="text-xl font-bold">
                  {isCreating ? "Create New Session" : "Edit Session"}
                </h2>
                <p className="mt-1 text-sm opacity-60">
                  {isCreating
                    ? "Enter your new session details."
                    : "Update your training session details."}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCancel}
                className="btn btn-ghost btn-sm btn-square"
                aria-label="Close form"
                disabled={isSaving}
              >
                <FaTimes />
              </button>
            </div>

            {/* Submit the form to create or update a session. */}
            <form
              onSubmit={handleSave}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4">
                {/* Select the activity from the activities returned by the API. */}
                <div>
                  <label
                    htmlFor="session-activity"
                    className="mb-1 block text-sm font-medium"
                  >
                    Activity
                  </label>

                  <select
                    id="session-activity"
                    name="activity_id"
                    value={editForm.activity_id}
                    onChange={handleFormChange}
                    className="select select-bordered w-full"
                    required
                    disabled={isOptionsLoading || activities.length === 0}
                  >
                    <option value="">
                      {isOptionsLoading
                        ? "Loading activities..."
                        : activities.length === 0
                          ? "No activities available"
                          : "Select an activity"}
                    </option>

                    {activities.map((activity) => (
                      <option key={activity.id} value={String(activity.id)}>
                        {activity.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Select the location from the locations returned by the API. */}
                <div>
                  <label
                    htmlFor="session-location"
                    className="mb-1 block text-sm font-medium"
                  >
                    Location
                  </label>

                  <select
                    id="session-location"
                    name="location_id"
                    value={editForm.location_id}
                    onChange={handleFormChange}
                    className="select select-bordered w-full"
                    required
                    disabled={isOptionsLoading || locations.length === 0}
                  >
                    <option value="">
                      {isOptionsLoading
                        ? "Loading locations..."
                        : locations.length === 0
                          ? "No locations available"
                          : "Select a location"}
                    </option>

                    {locations.map((location) => (
                      <option key={location.id} value={String(location.id)}>
                        {location.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Enter the date of the training session. */}
                <div>
                  <label
                    htmlFor="session-date"
                    className="mb-1 block text-sm font-medium"
                  >
                    Date
                  </label>
                  <input
                    id="session-date"
                    type="date"
                    name="date"
                    value={editForm.date}
                    onChange={handleFormChange}
                    className="input input-bordered w-full"
                    required
                  />
                </div>

                {/* Enter the session start time. */}
                <div>
                  <label
                    htmlFor="session-start-time"
                    className="mb-1 block text-sm font-medium"
                  >
                    Start Time
                  </label>
                  <input
                    id="session-start-time"
                    type="time"
                    name="start_time"
                    value={editForm.start_time}
                    onChange={handleFormChange}
                    className="input input-bordered w-full"
                    required
                  />
                </div>

                {/* Enter the session end time. */}
                <div>
                  <label
                    htmlFor="session-end-time"
                    className="mb-1 block text-sm font-medium"
                  >
                    End Time
                  </label>
                  <input
                    id="session-end-time"
                    type="time"
                    name="end_time"
                    value={editForm.end_time}
                    onChange={handleFormChange}
                    className="input input-bordered w-full"
                    required
                  />
                </div>

                {/* Set the maximum number of participants for the session. */}
                <div>
                  <label
                    htmlFor="session-capacity"
                    className="mb-1 block text-sm font-medium"
                  >
                    Capacity
                  </label>
                  <input
                    id="session-capacity"
                    type="number"
                    name="capacity"
                    min="1"
                    step="1"
                    value={editForm.capacity}
                    onChange={handleFormChange}
                    className="input input-bordered w-full"
                    required
                  />
                </div>
              </div>

              {/* Keep the save and cancel buttons at the bottom of the modal. */}
              <div className="shrink-0 space-y-2 border-t border-base-200 bg-base-100 p-4">
                <button
                  type="submit"
                  className="btn btn-primary w-full"
                  disabled={isSaving || isOptionsLoading}
                >
                  {isSaving ? (
                    <>
                      <span className="loading loading-spinner loading-sm" />
                      Saving...
                    </>
                  ) : isCreating ? (
                    "Create Session"
                  ) : (
                    "Save Changes"
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn btn-outline w-full"
                  disabled={isSaving}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export default SessionManagementView;
