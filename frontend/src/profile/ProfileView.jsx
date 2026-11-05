
import { useState, useCallback, useEffect } from "react";
import { useAuthenticate } from "../authentication/UseAuthenticate";
import { fetchAPI } from "../api.mjs";
import XMLDownloadButton from "../common/XMLDownloadButton";
import validator from "validator";

function ProfileView() {
    const { user, refresh, status: authStatus } = useAuthenticate("member", "trainer");

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");

    const [validationErrors, setValidationErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null);

    // Fill form when user loads
    useEffect(() => {
        if (user) {
            setFirstName(user.firstName || "");
            setLastName(user.lastName || "");
            setEmail(user.email || "");
        }
    }, [user]);

    // Hide success message after 2 seconds
    useEffect(() => {
        if (status === "Profile updated successfully!") {
            const timeout = setTimeout(() => {
                setStatus(null);
            }, 2000);

            return () => clearTimeout(timeout);
        }
    }, [status]);

    const submitUpdate = useCallback(() => {
        if (!user) {
            return;
        }

        const errors = {};

        if (!/^[a-zA-Z\-']{2,}$/.test(firstName.trim())) {
            errors.firstName = "Invalid first name";
        }

        if (!/^[a-zA-Z\-']{2,}$/.test(lastName.trim())) {
            errors.lastName = "Invalid last name";
        }

        if (!validator.isEmail(email.trim())) {
            errors.email = "Invalid email address";
        }

        setValidationErrors(errors);

        // Stop if there are validation errors
        if (Object.keys(errors).length > 0) {
            return;
        }

        setLoading(true);
        setStatus(null);

        // Update personal information
        fetchAPI(
            "PATCH",
            "/user/self",
            {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                email: email.trim()
            },
            localStorage.getItem("auth-key")
        )
            .then(response => {
                if (response.status === 200) {
                    setStatus("Profile updated successfully!");
                    refresh();
                } else {
                    setStatus(
                        "Update profile failed: " +
                        (response.body?.message || "Unknown error")
                    );
                }

                setLoading(false);
            })
            .catch(error => {
                setStatus(String(error));
                setLoading(false);
            });
    }, [firstName, lastName, email, user, refresh]);

    // Authentication is still loading
    if (
        authStatus === "resuming" ||
        authStatus === "loading"
    ) {
        return (
            <div className="flex justify-center p-8">
                <span className="loading loading-spinner loading-xl"></span>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex justify-center p-8">
                <span className="text-error">
                    Please log in to view your profile.
                </span>
            </div>
        );
    }

    return (
        <section className="flex flex-col gap-4 p-4 items-center">
            <fieldset className="fieldset rounded-box border p-4 self-stretch">
                <legend className="fieldset-legend text-xl p-2">
                    My Personal Details
                </legend>

                {/* First Name */}
                <label className="label">First Name</label>
                <input
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    className="input w-full"
                    type="text"
                    placeholder="First name"
                    disabled={loading}
                />

                {validationErrors.firstName && (
                    <label className="label text-red-500">
                        {validationErrors.firstName}
                    </label>
                )}

                {/* Last Name */}
                <label className="label">Last Name</label>
                <input
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    className="input w-full"
                    type="text"
                    placeholder="Last name"
                    disabled={loading}
                />

                {validationErrors.lastName && (
                    <label className="label text-red-500">
                        {validationErrors.lastName}
                    </label>
                )}

                {/* Email */}
                <label className="label">Email</label>
                <input
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="input w-full"
                    type="email"
                    placeholder="Email"
                    disabled={loading}
                />

                {validationErrors.email && (
                    <label className="label text-red-500">
                        {validationErrors.email}
                    </label>
                )}
            </fieldset>

            {/* Status */}
            {status && (
                <span
                    className={
                        status.includes("success")
                            ? "text-success self-start"
                            : "text-error self-start"
                    }
                >
                    {status}
                </span>
            )}

            {/* Update Profile */}
            <button
                type="button"
                disabled={loading}
                onClick={submitUpdate}
                className="btn btn-primary self-stretch"
            >
                Update Profile
                {loading && (
                    <span className="loading loading-spinner loading-sm"></span>
                )}
            </button>

            {/* Trainer XML */}
            {user.role === "trainer" && (
                <XMLDownloadButton
                    route="/session/xml"
                    authenticationKey={localStorage.getItem("auth-key") || ""}
                    filename="my-sessions.xml"
                    className="btn btn-warning self-stretch"
                >
                    Export Sessions (XML)
                </XMLDownloadButton>
            )}

            {/* Member XML */}
            {user.role === "member" && (
                <XMLDownloadButton
                    route="/booking/xml"
                    authenticationKey={localStorage.getItem("auth-key") || ""}
                    filename="my-bookings.xml"
                    className="btn btn-warning self-stretch"
                >
                    Export Bookings (XML)
                </XMLDownloadButton>
            )}
        </section>
    );
}

export default ProfileView;
