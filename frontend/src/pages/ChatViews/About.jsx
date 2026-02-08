import "./About.css";

const About = () => {
  return (
    <div className="about-container">
      <h1 className="about-title">About Our College Chatbot</h1>
      <p className="about-subtitle">Smart | Secure | Student Friendly</p>

      <p className="about-description">
        Our College Chatbot is a smart digital assistant designed to provide
        instant information to students regarding admissions, courses, fees,
        academic schedules and campus services. It works 24/7 to simplify
        communication between students and the institution.
      </p>

      <div className="about-cards">
        <div className="about-card">
          <h3>AI Powered</h3>
          <p>
            Uses intelligent automation to answer student queries instantly and
            accurately.
          </p>
        </div>

        <div className="about-card">
          <h3>Student Friendly</h3>
          <p>
            Simple, clean interface designed for easy interaction and quick
            responses.
          </p>
        </div>

        <div className="about-card">
          <h3>Secure & Reliable</h3>
          <p>
            Protects student information and ensures reliable system
            performance.
          </p>
        </div>

        <div className="about-card">
          <h3>24/7 Availability</h3>
          <p>
            Students can access information anytime without depending on office
            hours.
          </p>
        </div>
      </div>

      <div className="vision-box">
        <h2>Our Vision</h2>
        <p>
          To build a smart and reliable virtual assistant that transforms student
          support by delivering fast, transparent and accurate information
          through digital innovation.
        </p>
      </div>
    </div>
  );
};

export default About;
