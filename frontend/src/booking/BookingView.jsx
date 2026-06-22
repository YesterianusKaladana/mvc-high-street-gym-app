import { useEffect, useState } from "react";

function BookingView() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const authKey = localStorage.getItem("authenticationKey");

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await fetch("/api/bookings", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            authenticationKey: authKey,
          },
        });

        if (!res.ok) {
          throw new Error("Failed to load bookings");
        }

        const data = await res.json();
        setBookings(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [authKey]);

  const cancelBooking = async (id) => {
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          authenticationKey: authKey,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to cancel booking");
      }

      setBookings((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <main className="max-w-4xl mx-auto p-6">
        <p>Loading bookings...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="max-w-4xl mx-auto p-6">
        <p className="text-red-600">{error}</p>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto p-6">

      {/* HEADER */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 mb-6">
        <h1 className="text-2xl font-bold">My Bookings</h1>
        <p className="text-gray-600 mt-1">
          Your upcoming training sessions
        </p>
      </div>

      {/* BACK */}
      <a
        href="/authenticate/dashboard"
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mb-6 transition font-medium"
      >
        ← Back to Dashboard
      </a>

      {/* CONTENT */}
      <div className="space-y-4">

        {bookings.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-6 text-center text-gray-500">
            You don’t have any bookings yet.
          </div>
        ) : (
          bookings.map((b) => {
            const s = b.session;

            return (
              <div
                key={b.id}
                className="bg-white border border-gray-200 shadow-sm rounded-xl p-5 hover:shadow-md transition"
              >

                {/* TOP */}
                <div className="flex justify-between items-start">

                  <div>
                    <p className="text-sm text-gray-500">
                      Booked on{" "}
                      {b?.created
                        ? new Date(b.created).toLocaleDateString("en-AU")
                        : "-"}
                    </p>

                    <h2 className="text-lg font-semibold mt-1">
                      {s?.activity?.name || "Unknown Activity"}
                    </h2>

                    <p className="text-gray-600 mt-1">
                      📍 {s?.location?.name || "Unknown Location"}
                    </p>

                    <p className="text-gray-600">
                      🧑‍🏫 Trainer:{" "}
                      {s?.user?.firstName || ""} {s?.user?.lastName || ""}
                    </p>
                  </div>

                </div>

                {/* ACTION */}
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => cancelBooking(b.id)}
                    className="text-sm text-red-600 hover:text-red-800 font-medium"
                  >
                    Cancel booking
                  </button>
                </div>

              </div>
            );
          })
        )}

      </div>

    </main>
  );
}

export default BookingView;