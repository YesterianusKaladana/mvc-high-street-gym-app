import { useState, useCallback, useEffect } from "react";
import { useAuthenticate } from "../authentication/UseAuthenticate";
import { fetchAPI } from "../api.mjs";
import XMLDownloadButton from "../common/XMLDownloadButton";
import validator from "validator";

function ProfileView() {
    const { user, refresh, status: authStatus } = useAuthenticate();

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

    const submitUpdate = useCallback(() => {
        if (!user) {
            return;
        }

        setLoading(true);
        setStatus(null);

        const errors = {};

        if (!/^[a-zA-Z\-']{2,}$/.test(firstName.trim())) {
            errors.firstName = "Invalid first name";
        }

        if (!/^[a-zA-Z\-']{2,}$/.test(lastName.trim())) {
            errors.lastName = "Invalid last name";
        }

        if (!validator.isEmail(email)) {
            errors.email = "Invalid email address";
        }

        setValidationErrors(errors);

        if (Object.keys(errors).length > 0) {
            setLoading(false);
            return;
        }

        fetchAPI(
            "PUT",
            "/users/" + user.id,
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
                        "Update failed: " +
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
    if (authStatus === "resuming") {
        return (
            <div className="flex justify-center p-8">
                <span className="loading loading-spinner loading-xl"></span>
            </div>
        );
    }

    // Not logged in
    if (!user) {
        return (
            <StatusPage
                title="Login Required"
                message="You need to login to view your profile."
                actionLabel="Go to Login"
                actionPath="/login"
            />
        );
    }

    return (
        <section className="flex flex-col gap-4 p-4 items-center">

            {/* HEADER */}
            <div className="self-stretch">
                <h1 className="text-3xl font-bold">
                    My Profile
                </h1>

                <p className="text-sm opacity-60 mt-2">
                    Role:{" "}
                    <span className="badge badge-primary badge-sm">
                        {user.role}
                    </span>
                </p>
            </div>

            {/* PERSONAL DETAILS */}
            <fieldset className="fieldset rounded-box border p-4 self-stretch">

                <legend className="fieldset-legend text-xl p-2">
                    Personal Details
                </legend>

                {/* FIRST NAME */}
                <label className="label">
                    First Name
                </label>

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

                {/* LAST NAME */}
                <label className="label">
                    Last Name
                </label>

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

                {/* EMAIL */}
                <label className="label">
                    Email
                </label>

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

            {/* STATUS */}
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

            {/* UPDATE */}
            <button
                disabled={loading}
                onClick={submitUpdate}
                className="btn btn-primary btn-xl self-stretch"
            >
                Update Profile

                {loading && (
                    <span className="loading loading-spinner loading-sm"></span>
                )}
            </button>

            {/* TRAINER XML */}
            {user.role === "trainer" && (
                <XMLDownloadButton
                    route="/xml/sessions"
                    authenticationKey={
                        localStorage.getItem("auth-key") || ""
                    }
                    filename="my-sessions.xml"
                    className="btn btn-outline self-stretch"
                >
                    Export My Sessions (XML)
                </XMLDownloadButton>
            )}

            {/* MEMBER XML */}
            {user.role === "member" && (
                <XMLDownloadButton
                    route="/bookings/xml"
                    authenticationKey={
                        localStorage.getItem("auth-key") || ""
                    }
                    filename="my-bookings.xml"
                    className="btn btn-outline self-stretch"
                >
                    Export My Bookings (XML)
                </XMLDownloadButton>
            )}

        </section>
    );
}

export default ProfileView;
