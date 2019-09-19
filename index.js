const express = require("express");
const socketio = require("socket.io");

const path = require("path");
const http = require("http");

const app = express();

const PORT = process.env.PORT || 80;

app.use("/static", express.static(path.resolve(__dirname, "static")));
app.use(require("./router.js"));

const server = http.createServer(app);

const io = socketio(app, {
    path: "/",
    transports: ["websockets"]
});

require("./handle-io.js")(io);

server.listen(PORT, ()=>{
    console.log(`[+] Server is listening on port ${PORT}`);
})