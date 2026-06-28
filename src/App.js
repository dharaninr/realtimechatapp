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
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const avatars = [
  "🐱", "🐶", "🐼", "🐰",
  "🦊", "🐻", "🐨", "🐯",
  "🐸", "🦄", "🐧", "🐥"
];

const [selectedAvatar, setSelectedAvatar] = useState("🐱");

useEffect(() => {

  socket.off("receive_message");
  socket.off("receive_file");

 socket.on("receive_message", (data) => {


  const messageText =
    typeof data === "string"
      ? data
      : data.message || JSON.stringify(data);

  setMessages((prev) => {

    if (
      !messageText.includes("joined the room") &&
      !messageText.includes("left the room") &&
      prev.includes(messageText)
    ) {
      return prev;
    }

    return [...prev, messageText];
  });
});

  socket.on("receive_file", (data) => {
  console.log("Received file:", data);

  if (data.room === room) {
    setUploadedFiles((prev) => [
      ...prev,
      data.file,
    ]);
  }
});

  return () => {
    socket.off("receive_message");
    socket.off("receive_file");
  };

}, [room]);

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
    console.log("Joining room:",room);
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

  setMessage("");
};
const onEmojiClick = (emojiData) => {
  setMessage((prev) => prev + emojiData.emoji);
};
const startRecording = async () => {
  const stream =
    await navigator.mediaDevices.getUserMedia({
      audio: true,
    });

  const recorder = new MediaRecorder(stream);
  const audioChunks = [];

  recorder.ondataavailable = (event) => {
    audioChunks.push(event.data);
  };

  recorder.onstop = () => {
    const audioBlob = new Blob(audioChunks, {
      type: "audio/webm",
    });

    const audioUrl =
      URL.createObjectURL(audioBlob);

    setMessages((prev) => [
      ...prev,
      {
        type: "audio",
        url: audioUrl,
      },
    ]);
  };

  recorder.start();

  setMediaRecorder(recorder);
  setIsRecording(true);
};

const stopRecording = () => {
  if (mediaRecorder) {
    mediaRecorder.stop();
    setIsRecording(false);
  }
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
      console.log("Sending file to room:", room);
      alert("Sending file to room: " + room);

      socket.emit("send_file", {
        room: room,
        file: res.data.filePath,
    });

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
            width: "420px",
            textAlign: "center",
            boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
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
        <div
  style={{
    display: "flex",
    alignItems: "center",
    gap: "15px",
    marginBottom: "20px",
    borderBottom: "1px solid #ddd",
    paddingBottom: "15px"
  }}
>
  <div
    style={{
      fontSize: "60px",
      background: "#f3e8ff",
      borderRadius: "50%",
      padding: "10px"
    }}
  >
    {selectedAvatar}
  </div>

  <div>
    <h2 style={{ margin: 0 }}>
      Welcome {username}
    </h2>

    <p
      style={{
        color: "green",
        margin: "5px 0"
      }}
    >
      ● Online
    </p>
  </div>
</div>
        <input
  type="text"
  placeholder="Enter Room ID"
  value={room}
  onChange={(e) => setRoom(e.target.value)}
  style={styles.input}
/>

<div
  style={{
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginTop: "20px",
    marginBottom: "20px"
  }}
>
  <button onClick={joinRoom} style={styles.button}>
    Join Room
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
    Leave Room
  </button>

  <button
    onClick={() => setDarkMode(!darkMode)}
    style={styles.button}
  >
    {darkMode ? "☀️ Light" : "🌙 Dark"}
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
    🗑 Clear Chat
  </button>
</div>

{joinedRoom && (
  <p>🔒 Joined Room: {room}</p>
)}

<div
  style={{
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: "20px",
    marginTop: "20px"
  }}
>

  <div
    style={{
      flex: 2
    }}
  >
    <div
  style={{
    flex: 1,
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
      background: darkMode ? "#666" : "#e9d8fd",
      color: darkMode ? "white" : "black",

      marginLeft:
        typeof msg === "string" &&
        msg.includes(username)
          ? "auto"
          : "0",

      backgroundColor:
        typeof msg === "string" &&
        msg.includes(username)
          ? "#d8b4fe"
          : "#f3f4f6",
    }}
  >
      {typeof msg === "object"
        ? msg.type === "audio"
          ? <audio controls src={msg.url}></audio>
          : msg.message
        : msg}
    </div>
  ))}
</div>
</div>

  <div
  style={{
    flex: 1,
    background: darkMode ? "#444" : "#faf5ff",
    padding: "20px",
    borderRadius: "20px",
    border: "1px solid #ddd",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
  }}
>
    <h3
  style={{
    textAlign: "center",
    marginBottom: "20px"
  }}
>
  📄 PDF Sharing
</h3>

    <input
      type="file"
      accept=".pdf"
      style={{
        marginBottom: "15px"
      }}
      onChange={(e) =>
        setSelectedFile(e.target.files[0])
      }
    />

    <button
      onClick={uploadFile}
      style={styles.button}
    >
      Upload PDF
    </button>

    <br /><br />

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
       <div
  style={{
    display: "flex",
    gap: "10px",
    marginTop: "20px",
    alignItems: "center"
  }}
>

  <input
    type="text"
    placeholder="Type a message..."
    value={message}
    onChange={(e) => setMessage(e.target.value)}
    style={{
      flex: 1,
      padding: "15px",
      borderRadius: "12px",
      border: "1px solid #ccc"
    }}
  />

    <button
      onClick={() => setShowEmoji(!showEmoji)}
      style={styles.button}
    >
      😊
    </button>

    <button
  onClick={sendMessage}
  style={{
    ...styles.button,
    padding: "15px 25px"
  }}
>
  Send ✈️
</button>

    {!isRecording ? (
      <button
        onClick={startRecording}
        style={styles.button}
      >
        🎤 Start Recording
      </button>
    ) : (
      <button
        onClick={stopRecording}
        style={styles.button}
      >
        ⏹ Stop Recording
      </button>
    )}

  {showEmoji && (
    <EmojiPicker onEmojiClick={onEmojiClick} />
  )}

</div>

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
  fontFamily: "Arial, sans-serif",
  background: "linear-gradient(135deg,#c8b6ff,#e0c3fc)",
},

  chatBox: {
  width: "90%",
  maxWidth: "1200px",
  minHeight: "90vh",
  background: "white",
  borderRadius: "25px",
  padding: "30px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
  display: "flex",
  flexDirection: "column",
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
  padding: "12px 20px",
  background: "#9d4edd",
  color: "white",
  border: "none",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "bold",
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
  height: "450px",
  overflowY: "auto",
  padding: "20px",
  background: "#f8f8f8",
  borderRadius: "15px",
  marginTop: "20px",
  border: "1px solid #ddd",
},

  message: {
  background: "#efe7ff",
  padding: "15px",
  borderRadius: "18px",
  marginBottom: "15px",
  maxWidth: "70%",
  width: "fit-content",
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  wordWrap: "break-word",
},
};

export default App;