import { useState, useEffect } from "react";
import axios from "axios";
import io from "socket.io-client";
import EmojiPicker from "emoji-picker-react";

const socket = io("https://realtimechatapp-3-752i.onrender.com");

function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const [darkMode, setDarkMode] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [room, setRoom] = useState("");
  const [joinedRoom, setJoinedRoom] = useState(false);
  const avatars = [
  "🐱", "🐶", "🐼", "🐰",
  "🦊", "🐻", "🐨", "🐯",
  "🐸", "🦄", "🐧", "🐥"
];

const [selectedAvatar, setSelectedAvatar] = useState("🐱");

  useEffect(() => {
  socket.on("receive_message", (data) => {
    setMessages((prev) => [...prev, data]);
  });

  socket.on("receive_file", (file) => {
    setUploadedFiles((prev) => [...prev, file]);
  });

  return () => {
    socket.off("receive_message");
    socket.off("receive_file");
  };
}, []);

  const login = () => {
    const now = new Date();

    const currentPassword =
      now.getHours().toString() +
      now.getMinutes().toString().padStart(2, "0");

    if (username.trim() === "") {
      alert("Enter Username");
      return;
    }

    if (password === currentPassword) {
      setLoggedIn(true);
    } else {
      alert("Wrong Password");
    }
  };
  const joinRoom = () => {
  if (room !== "") {
    socket.emit("join_room", {
      room: room,
      username: username,
    });
    setJoinedRoom(true);
  }
};

  const sendMessage = () => {
  if (message.trim() === "") return;

  const msgData =
`${selectedAvatar} ${username}: ${message}`;

  socket.emit("send_message", {
    room: room,
    message: msgData,
  });
  setMessages((prev) => [...prev, msgData]);

  setMessage("");
};
const onEmojiClick = (emojiData) => {
  setMessage((prev) => prev + emojiData.emoji);
};

  const clearChat = () => {
    setMessages([]);
  };

  const uploadFile = async () => {
    if (!selectedFile) {
      alert("Select PDF first");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await axios.post(
        "https://realtimechatapp-3-752i.onrender.com/upload",
        formData
      );

      socket.emit("send_file", res.data.filePath);

      alert("PDF Uploaded Successfully");
    } catch (error) {
      console.log(error);
      alert("Upload Failed");
    }
  };

  if (!loggedIn) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background:
            "linear-gradient(135deg,#b993d6,#dcb0ed)",
        }}
      >
        <div
          style={{
            background: "white",
            padding: "40px",
            borderRadius: "20px",
            width: "350px",
            textAlign: "center",
          }}
        >
          <img
            src="https://cdn-icons-png.flaticon.com/512/4712/4712027.png"
            alt="Robot"
            style={{
              width: "100px",
              height: "100px",
              marginBottom: "20px",
            }}
          />

          <h1>💜 Chat Login</h1>

          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={styles.input}
          />

          <input
            type="password"
            placeholder="Password (Current Time)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
          />
          <h3>Select Avatar</h3>

<div
  style={{
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    justifyContent: "center",
    marginBottom: "20px"
  }}
>
  {avatars.map((avatar, index) => (
    <button
      key={index}
      onClick={() => setSelectedAvatar(avatar)}
      style={{
        fontSize: "30px",
        padding: "10px",
        borderRadius: "50%",
        border:
          selectedAvatar === avatar
            ? "3px solid purple"
            : "1px solid gray",
        cursor: "pointer"
      }}
    >
      {avatar}
    </button>
  ))}
</div>

          <button onClick={login} style={styles.button}>
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        ...styles.container,
        background: darkMode
          ? "#1e1e1e"
          : "linear-gradient(135deg,#b993d6,#dcb0ed)",
      }}
    >
      <div
        style={{
          ...styles.chatBox,
          background: darkMode ? "#333" : "white",
          color: darkMode ? "white" : "black",
        }}
      >
        <div style={{ textAlign: "center" }}>
  <div style={{ fontSize: "60px" }}>
    {selectedAvatar}
  </div>

  <h2>💬 Welcome {username}</h2>
</div>
        <input
  type="text"
  placeholder="Enter Room ID"
  value={room}
  onChange={(e) => setRoom(e.target.value)}
  style={styles.input}
/>

<button onClick={joinRoom} style={styles.button}>
  Join Private Room
</button>
<button
  onClick={() => {
    socket.emit("leave_room", {
      room: room,
      username: username,
    });

    setRoom("");
    setJoinedRoom(false);
    setMessages([]);
  }}
  style={styles.button}
>
  Leave Private Chat
</button>

{joinedRoom && (
  <p>🔒 Joined Room: {room}</p>
)}

        <button
          onClick={() => setDarkMode(!darkMode)}
          style={styles.button}
        >
          {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>

        <button
          onClick={() => {
            setLoggedIn(false);
            setMessages([]);
            setUploadedFiles([]);
            setUsername("");
            setPassword("");
            setMessage("");
          }}
          style={styles.logout}
        >
          Logout
        </button>

        <button
          onClick={clearChat}
          style={styles.clearButton}
        >
          🗑️ Clear Chat
        </button>

        <div
  style={{
    ...styles.messages,
    background: darkMode ? "#444" : "#f3e8ff",
    color: darkMode ? "white" : "black",
  }}
>
  {messages.map((msg, index) => (
  <div
    key={index}
    style={{
      ...styles.message,
      color: darkMode ? "white" : "black",
      background: darkMode ? "#666" : "#e9d8fd",
    }}
  >
    {typeof msg === "object" ? msg.message : msg}
  </div>
))}
</div>

        <input
          type="text"
          placeholder="Type message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          style={styles.input}
        />
        <button
  onClick={() => setShowEmoji(!showEmoji)}
  style={styles.button}
>
  😊
</button>
{showEmoji && (
  <EmojiPicker onEmojiClick={onEmojiClick} />
)}

        <button onClick={sendMessage} style={styles.button}>
          Send
        </button>

        <hr />

        <h3>📄 Upload PDF</h3>

        <input
          type="file"
          accept=".pdf"
          onChange={(e) =>
            setSelectedFile(e.target.files[0])
          }
        />

        <button onClick={uploadFile} style={styles.button}>
          Upload PDF
        </button>

        <br />
        <br />

        {uploadedFiles.map((file, index) => (
          <div key={index}>
            <a
              href={file}
              target="_blank"
              rel="noreferrer"
            >
              📄 Open PDF {index + 1}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
  },

  chatBox: {
    padding: "30px",
    borderRadius: "20px",
    width: "700px",
    maxWidth: "90vw",
    boxShadow: "0 8px 20px rgba(0, 0, 0, 0.2)",
  },

  input: {
    width: "100%",
    padding: "12px",
    marginTop: "10px",
    borderRadius: "10px",
    border: "1px solid #ccc",
    boxSizing: "border-box",
  },

  button: {
    marginTop: "10px",
    marginRight: "10px",
    padding: "10px 20px",
    background: "#9d4edd",
    color: "white",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
  },

  logout: {
    background: "red",
    color: "white",
    border: "none",
    padding: "10px",
    borderRadius: "10px",
    marginLeft: "10px",
  },

  clearButton: {
    background: "gray",
    color: "white",
    border: "none",
    padding: "10px",
    borderRadius: "10px",
    marginLeft: "10px",
  },

  messages: {
    height: "250px",
    overflowY: "auto",
    padding: "10px",
    margin: "20px 0",
    borderRadius: "10px",
  },

  message: {
    background: "#e9d8fd",
    color:  "black",
    margin: "10px 0",
    padding: "10px",
    borderRadius: "10px",
  },
};

export default App;