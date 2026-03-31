import { Link } from "react-router-dom";
import "./Home.css";

const Home = () => {
  return (
    <section className="home">
      <div className="hero-container">
        <h1>
          Smart Virtual Assistance for <br /> Your College
        </h1>

        <p>
          Our College Chatbot provides instant response for admissions,
          courses, fee details, academic schedules, more. Available 24/7
          for students
        </p>

        <Link to="/login" className="primary-btn">
          Start Chat
        </Link>
      </div>
    </section>
  );
};

export default Home;
