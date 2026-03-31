import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Login.css";
import collegeImg from "../assets/college.png";

const Login = () => {
  const [show, setShow] = useState(false);

  // 🔹 added
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});

  // 🔹 added
  const handleSubmit = (e) => {
    e.preventDefault();

    const newErrors = {};

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

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      console.log("Form is valid");
    }
  };

  return (
    <section className="auth auth-login">
      <div
        className="auth-left"
        style={{ backgroundImage: `url(${collegeImg})` }}
        aria-hidden
      />

      <div className="auth-right">
        <div className="card">
          <h3>Chatbot Login</h3>
          <p className="subtitle">Welcome back! Please log in to continue</p>

          {/* 🔹 changed only onSubmit */}
          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="field">
              <span className="label">Email ID</span>
              {/* 🔹 added value & onChange */}
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {errors.email && (
                <span className="error">{errors.email}</span>
              )}
            </label>

            <label className="field">
              <span className="label">Password</span>
              <div className="password-field">
                {/* 🔹 added value & onChange */}
                <input
                  type={show ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="eye"
                  onClick={() => setShow((s) => !s)}
                >
                  {show ? "Hide" : "Show"}
                </button>
              </div>
              {errors.password && (
                <span className="error">{errors.password}</span>
              )}
            </label>

            <button className="auth-btn">Login</button>
          </form>

          <p className="switch-text">
            Don’t have an account? <Link to="/signup">Signup</Link>
          </p>

          <div className="divider">or</div>

          <button className="google-btn">Login with Google</button>
        </div>
      </div>
    </section>
  );
};

export default Login;