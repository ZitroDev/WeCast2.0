const socket = io( window.origin );
var isAdmin = false;
var adminMSG = "";

socket.on("connect_success", (bool) => {
    if(bool){
        console.log("[+] Connected successfully!");
    } else {
        console.log("[-] Connection failure!");
    }
});

$.post("/doAdmin", {
    uid: $.cookie("uid")
}, (data) => {
    if(data.hasOwnProperty("err")){
        console.error(data.err);
    } else if(data.hasOwnProperty("msg")){
        adminMSG = data.msg;
        socket.emit("doAdmin", data.msg);
    }
});

socket.on("gotAdmin", (bool) => {
    isAdmin = bool;
    bool ? console.info("OK, got an admin...") : console.error("FAIL: admin NOT accquired!");
});

window.onbeforeunload = function(){
    socket.emit("disconnect_admin", adminMSG);
} 

socket.on("pres_change", () => {
    window.location.reload();
});

Reveal.addEventListener( "slidechanged", function(e) {
    isAdmin ? socket.emit("move", [e.indexh, e.indexv]): "";
});