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


const allowedOrigins = [
  'https://ibnw-pop-party-ticket-fr.onrender.com',
];
app.use(cors({   origin: allowedOrigins,
  credentials: true,}));
app.use(express.json({limit: '50mb'}));

//routes
app.use("/event", eventrouter);

app.use("/admin",adminrouter);



//connect to database
connect();

//server
const port = process.env.PORT || 5008;
const connection = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});


// Setup Socket.IO only after MongoDB connects
mongoose.connection.once("open", () => {
    console.log("MongoDB connected. Setting up Socket.IO...");

    const io = socket(connection, {
        cors: { origin: "*" }
    });

    io.on("connection", async (socket) => {
        console.log("A user connected");

        // Fetch and send all existing chats
        try {
            const allchat = await chatmodel.find();
            socket.emit("allchat", allchat);
        } catch (error) {
            console.error("Error fetching chats:", error);
        }

        // Listen for new messages
        socket.on("sendmessage", async (messages) => {
            try {
                const newMessage = await chatmodel.create({ message: messages.message });
                console.log("Message saved:", newMessage);
                socket.emit("receivemessage", newMessage);
            } catch (error) {
                console.error("Error saving message:", error);
            }
        });
    });
});
