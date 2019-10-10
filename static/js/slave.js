const socket = io('http://localhost');
socket.on("connect_success", (bool) => {
    if(bool){
        console.log("[+] Connected successfully!");
    } else {
        console.log("[-] Connection failure!");
    }
});
socket.on("move", (url) => {
    Reveal.navigateTo.apply(this, url);
})
socket.on("pres_change", () => {
    window.location.reload();
});
window.onbeforeunload = function(){
    socket.emit("disconnect_user");
}    