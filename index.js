const express = require('express');
const app = express();
const mongoose = require('mongoose');
require('dotenv').config();
const connect = require('./Db.config/db.connect');
const cors = require('cors');
const socket = require('socket.io');
const chatmodel = require('./model/chat.model');
const eventrouter = require('./routes/event.route');
const adminrouter = require('./routes/admin.route');

// Allow only this origin for CORS
app.use(cors({ origin: 'https://ibnw-pop-party-ticket-fr.onrender.com' }));

// Routes
console.log('Mounting event router at /event');
app.use("/event", eventrouter);
console.log('Mounting admin router at /admin');
app.use("/admin", adminrouter);

// Connect to database
connect()
  .then(() => console.log('Database connected successfully'))
  .catch(err => {
    console.error('Database connection error:', err);
    process.exit(1); // Exit if DB connection fails
  });

// Start server
const port = process.env.PORT || 5008;
const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Setup Socket.IO after MongoDB connects
mongoose.connection.once("open", () => {
  console.log("MongoDB connected. Setting up Socket.IO...");

  const io = socket(server, {
    cors: { origin: "https://ibnw-pop-party-ticket-fr.onrender.com" }
  });

  io.on("connection", async (socket) => {
    console.log("A user connected");

    try {
      const allchat = await chatmodel.find();
      socket.emit("allchat", allchat);
    } catch (error) {
      console.error("Error fetching chats:", error);
    }

    socket.on("sendmessage", async (messages) => {
      try {
        const newMessage = await chatmodel.create({ message: messages.message });
        console.log("Message saved:", newMessage);
        socket.emit("receivemessage", newMessage);
      } catch (error) {
        console.error("Error saving message:", error);
      }
    });

    socket.on("disconnect", () => {
      console.log("A user disconnected");
    });
  });
});
