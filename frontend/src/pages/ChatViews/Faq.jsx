import "./Faq.css";

const Faq = () => {
  return (
    <div className="faq-container">
      <h1 className="faq-title">Frequently Asked Questions</h1>
      <p className="faq-subtitle">
        Find quick answers to common chatbot questions
      </p>

      <div className="faq-list">
        <details>
          <summary>What is the College Chatbot?</summary>
          <p>
            The College Chatbot is a virtual assistant designed to help students
            get instant information about admissions, courses, fees, academic
            schedules, and campus services.
          </p>
        </details>

        <details>
          <summary>Is the chatbot available 24/7?</summary>
          <p>
            Yes, the chatbot is available 24/7 to assist students anytime without
            depending on office hours.
          </p>
        </details>

        <details>
          <summary>Can I check admission details through the chatbot?</summary>
          <p>
            Yes, you can check admission-related information such as eligibility,
            important dates, and procedures using the chatbot.
          </p>
        </details>

        <details>
          <summary>Is my data safe with the chatbot?</summary>
          <p>
            Absolutely. The chatbot follows secure practices to protect student
            data and ensures privacy and reliability.
          </p>
        </details>

        <details>
          <summary>Can I use the chatbot on mobile?</summary>
          <p>
            Yes, the chatbot is fully responsive and can be accessed on mobile,
            tablet, and desktop devices.
          </p>
        </details>
      </div>
    </div>
  );
};

export default Faq;
