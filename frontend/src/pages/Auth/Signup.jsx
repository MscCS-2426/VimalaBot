import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Signup.css";
import collegeImg from "../../assets/college.png";


const Signup = () => {
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);

  // 🔹 added
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});

  // 🔹 added
  const handleSubmit = (e) => {
    e.preventDefault();

    const newErrors = {};

    if (!name.trim()) {
      newErrors.name = "Full name is required";
    }

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Enter a valid email";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Confirm password is required";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      console.log("Signup form is valid");
    }
  };

  return (
    <section className="auth auth-signup">
      <div
        className="auth-left"
        style={{ backgroundImage: `url(${collegeImg})` }}
        aria-hidden
      >
        <div className="overlay" />
        <div className="left-content" aria-hidden />
      </div>

      <div className="auth-right">
        <div className="card">
          <h3>Chatbot Signup</h3>
          <p className="subtitle">Create an account to continue</p>

          {/* 🔹 changed only onSubmit */}
          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="field">
              <span className="label">Full Name</span>
              <input
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              {errors.name && <span className="error">{errors.name}</span>}
            </label>

            <label className="field">
              <span className="label">Email ID</span>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {errors.email && <span className="error">{errors.email}</span>}
            </label>

            <label className="field">
              <span className="label">Password</span>
              <div className="password-field">
                <input
                  type={show1 ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="eye"
                  onClick={() => setShow1((s) => !s)}
                >
                  {show1 ? "Hide" : "Show"}
                </button>
              </div>
              {errors.password && (
                <span className="error">{errors.password}</span>
              )}
            </label>

            <label className="field">
              <span className="label">Confirm Password</span>
              <div className="password-field">
                <input
                  type={show2 ? "text" : "password"}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="eye"
                  onClick={() => setShow2((s) => !s)}
                >
                  {show2 ? "Hide" : "Show"}
                </button>
              </div>
              {errors.confirmPassword && (
                <span className="error">{errors.confirmPassword}</span>
              )}
            </label>

            <button className="auth-btn">Sign up</button>
          </form>

          <p className="switch-text">
            Already have an account? <Link to="/login">Login</Link>
          </p>

          <div className="divider">or</div>

          <button className="google-btn">Login with Google</button>
        </div>
      </div>
    </section>
  );
};

export default Signup;
