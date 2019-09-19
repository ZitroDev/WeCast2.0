/**
 * @param {SocketIO.Server} io - Socket server
 */
module.exports = function handle(io){
    io.on("connection", (socket) => {
        socket.emit("connect_success", true);
        socket.on("msg", (...args) => {
            socket.emit("msg", ...args);
        });
    });
}
