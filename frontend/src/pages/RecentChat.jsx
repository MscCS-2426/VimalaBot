import React, { useState } from "react";
import "./RecentChat.css";

const initialChats = [
  {
    id: 1,
    title: "Admission Dates",
    message: "You searched the last date for applications....",
  },
  {
    id: 2,
    title: "Vimala College Fees",
    message: "You asked about the fee structure for 2025....",
  },
  {
    id: 3,
    title: "Vimala College Courses",
    message: "You checked the available UG and PG programs....",
  },
  {
    id: 4,
    title: "Scholarship Details",
    message: "You enquired about government scholarship....",
  },
];

const RecentChat = () => {
  const [chats, setChats] = useState(initialChats);

  const handleDelete = (id) => {
    setChats(chats.filter((chat) => chat.id !== id));
  };

  return (
    <div className="chatbot-container">
     

      {/* Content */}
      <div className="chatbot-content">
        <h2>Recent Chats</h2>
        <p className="subtitle">
          Quick access to your previous conversations
        </p>

        <div className="chat-list">
          {chats.length === 0 ? (
            <p className="empty-text">No recent chats available</p>
          ) : (
            chats.map((chat) => (
              <div className="chat-card" key={chat.id}>
                <div className="chat-text">
                  <h4>{chat.title}</h4>
                  <p>{chat.message}</p>
                </div>

                <button
                  className="delete-btn"
                  onClick={() => handleDelete(chat.id)}
                  title="Delete chat"
                >
                  🗑️
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default RecentChat;