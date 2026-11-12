
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { fetchAPI } from "../api.mjs";
import { useAuthenticate } from "../authentication/UseAuthenticate";

function BookingView() {
  const navigate = useNavigate();
  useAuthenticate(["member"]);

  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);

  const getBookings = useCallback(() => {
    const authKey = localStorage.getItem("auth-key");

    if (!authKey) {
      navigate("/login");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    fetchAPI("GET", "/booking", null, authKey)
      .then((response) => {
        if (response.status == 200) {
          setBookings(Array.isArray(response.body) ? response.body : []);
        } else {
          setBookings([]);
          setError(response.body?.message || "Failed to load bookings.");
        }

        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setBookings([]);
        setIsLoading(false);
      });
  }, [navigate]);

  useEffect(() => {
    getBookings();
  }, [getBookings]);

  const cancelBooking = (bookingId) => {
    const authKey = localStorage.getItem("auth-key");

    if (!authKey) {
      navigate("/login");
      return;
    }

    setCancelling(bookingId);
    setError(null);

    fetchAPI("DELETE", `/booking/${bookingId}`, null, authKey)
      .then((response) => {
        if (response.status == 200 || response.status == 204) {
          getBookings();
        } else {
          setError(response.body?.message || "Unable to cancel booking.");
        }

        setCancelling(null);
      })
      .catch((err) => {
        setError(err.message);
        setCancelling(null);
      });
  };

  return (
    <section className="p-4">
      <h1 className="text-2xl font-bold mb-4">My Bookings</h1>

      {isLoading ? (
        <div className="flex justify-center">
          <span className="loading loading-spinner loading-xl"></span>
        </div>
      ) : error ? (
        <p className="text-error font-semibold">{error}</p>
      ) : bookings.length === 0 ? (
        <p className="opacity-60">You don't have any bookings yet.</p>
      ) : (
        <ul className="list">
          {bookings.map((booking) => (
            <li key={booking.id} className="list-row">
              <div>
                <div className="font-bold">{booking.activity_name}</div>
                <div className="text-sm">{booking.location_name}</div>
                <div className="text-sm opacity-70">
                  {booking.date} ({booking.weekday})
                </div>
                <div className="text-sm opacity-70">
                  {booking.start_time} - {booking.end_time}
                </div>
                <div className="text-sm opacity-70">
                  Trainer: {booking.trainer_name}
                </div>
              </div>

              <button
                className="btn btn-error btn-outline"
                onClick={() => cancelBooking(booking.id)}
                disabled={cancelling === booking.id}
              >
                {cancelling === booking.id ? (
                  <span className="loading loading-spinner"></span>
                ) : (
                  "Cancel"
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default BookingView;
