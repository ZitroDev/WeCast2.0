const express = require("express");
const socketio = require("socket.io");
const chalk = require("chalk");
const cheerio = require("cheerio");
const bcrypt = require("bcrypt");
const uuid = require("uuid-by-string");
const inquirer = require("inquirer");
const bodyParser = require("body-parser");
const osu = require("node-os-utils")
const netspeed = require("network-speed");
const TimeAgo = require("javascript-time-ago");
const en = require("javascript-time-ago/locale/en");

const fs = require("fs");
const path = require("path");
const http = require("http");
const crypto = require("crypto");

const app = express();
TimeAgo.addLocale(en);
const timeAgo = new TimeAgo("en-US");

var adminUID = "";
const redirectTo = "/";
const [,,...args] = process.argv;
const PORT = process.env.PORT || 80;
var curPres = "demo";
var currentMessage = "";
var adminMSG = "";
var noMoreAdmin = false;
const cpu = osu.cpu.usage.bind(osu.cpu);
const drive = osu.drive.used.bind(osu.drive);
const mem = osu.mem.used.bind(osu.mem);
const testNet = new netspeed();
var os;
osu.os.oos().then(cos => {
    os = `${cos} ${osu.os.type()} ${osu.os.arch()}`
});

var wait = ms => new Promise((r, j)=>setTimeout(r, ms))

async function l(str){
    let a = str.split("");
    for(var c in a){
        process.stdout.write(a[c]);
        await wait(15);
    }
    process.stdout.write("\n");
    return ;
}

async function getDownload() {
    const baseUrl = 'http://eu.httpbin.org/stream-bytes/50000000';
    const fileSize = 500000;
    return testNet.checkDownloadSpeed(baseUrl, fileSize);
}

async function getUpload() {
    const options = {
        hostname: 'www.google.com',
        port: 80,
        path: '/catchers/544b09b4599c1d0200000289',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    };
    return testNet.checkUploadSpeed(options);
}

var vv = false;  // Ultra verbose
var v = true;    // Verbose

if(args.includes("-vv")){
    vv = true;
    v = true;
} else if(args.includes("-v")){
    v = true;
}

var pHash = "";

(async function() {
    if(fs.existsSync(path.resolve(__dirname, "hash.txt"))){
        [nick, pHash] = fs.readFileSync(path.resolve(__dirname, "hash.txt")).toString().split("\n");
    } else{
        process.stdout.write(chalk`{green.bold ❯} `);
        await l(`This appears to be your first start!`);
        process.stdout.write(chalk`{green.bold ❯} `);
        await l(`I will get you through all the authentication process.`);
        var {nick, pass} = await inquirer.prompt(
            [
                {
                    type: "input", 
                    message: "Nickname: \n", 
                    name: "nick", 
                },
                {
                    type: "password", 
                    message: "Password: \n", 
                    name: "pass", 
                    mask: "█"
                }
            ]
        )
        pHash = bcrypt.hashSync(pass, 10);
        fs.writeFileSync(path.resolve(__dirname, "hash.txt"), `${nick}\n${pHash}`, "utf8")
    }
    adminUID = uuid(`${nick}+-+${pHash}`);
    console.log(chalk`{blue [i]} {yellow Admin UID}{gray :} {blue ${adminUID}}`)
})()
    .then(()=>{
        app.use(bodyParser.urlencoded({ extended: false }));
        app.use(bodyParser.json());

        app.set("view engine", "pug");
        app.set("views", path.resolve(__dirname, "pages"));

        app.use("/admint", express.static(path.resolve(__dirname, "pages", "static")));

        app.use((req, res, next) => {
            if(vv && (!req.path == "/admint/net" || !req.path == "/admint/load" || !req.path == "/admint/setPres")){
                console.log(`Request: ${req.method} ${req.path}`);
            }
            next();
        });
        
        app.get('/', function(req, res) {
            if(curPres==""){
                res.sendFile(path.resolve(__dirname, "pages", "presNC.html"));
            } else{              
                if(fs.existsSync(path.resolve(__dirname, "pages", "assets", curPres+".html"))){
                    try {
                        var presentationFile = fs.readFileSync(path.resolve(__dirname, "pages", "assets", curPres+".html"), 'utf8');
                        var $ = cheerio.load(presentationFile);
                        var script = `
<script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.3.0/socket.io.js"></script>
<script src="js/slave.js"></script>
`;
                        $('body').append(script);
                        res.send($.html());
                    } catch (err) {
                        v ? console.log(chalk`{red [-]} {yellow Error}{gray :} {red ${err.message}}`) : "";
                        res.redirect("/");
                    }
                }
            }
        });

        app.get('/admint/view/presentation', function(req, res) {
            if(curPres==""){
                res.sendFile(path.resolve(__dirname, "pages", "presNC.html"));
            } else{              
                if(fs.existsSync(path.resolve(__dirname, "pages", "assets", curPres+".html"))){
                    try {
                        var presentationFile = fs.readFileSync(path.resolve(__dirname, "pages", "assets", curPres+".html"), 'utf8');
                        var $ = cheerio.load(presentationFile);
                        var script = `
        <script src="https://code.jquery.com/jquery-3.4.1.min.js"
        integrity="sha256-CSXorXvZcTkaix6Yvo6HppcZGetbYMGWSFlBw8HfCJo=" crossorigin="anonymous"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.3.0/socket.io.js"></script>
        <script src="js/master.js"></script>
`;
                        $('body').append(script);
                        res.send($.html());
                    } catch (err) {
                        v ? console.log(chalk`{red [-]} {yellow Error}{gray :} {red ${err.message}}`) : "";
                        res.redirect("/");
                    }
                }
            }
        });
        
        app.post("/admint/load", (req, res) => {
            var uid = req.body.uid;
            vv ? console.log(chalk`{blue [i]} Load request: {yellow requester UID}{gray :} {blue ${uid}}`) : "";
            res.contentType("json");
            if (uid == adminUID) {
                Promise.all([mem(), cpu(), drive()])
                    .then(load => {
                        var resp = {};
                        resp["os"] = os;
                        resp["ram"] = load[0];
                        resp["disk"] = load[2].usedPercentage;
                        resp["cpu"] = load[1];
                        res.end(JSON.stringify(resp));
                    })
            } else {
                res.end(JSON.stringify({ err: "You're not an admin!" }));
            }
        });
        
        app.post("/admint/net", (req, res) => {
            var uid = req.body.uid;
            vv ? console.log(chalk`{blue [i]} Network speed request: {yellow requester UID}{gray :} {blue ${uid}}`) : "";
            res.contentType("json");
            if (uid == adminUID) {
                Promise.all([getDownload(), getUpload()])
                    .then(net => {
                        res.end(
                            JSON.stringify(
                                {
                                    download: net[0].mbps,
                                    upload: net[1].mbps
                                }
                            )
                        );
                    })
            } else {
                res.end(JSON.stringify({ err: "You're not an admin!" }));
            }
        });
        
        app.post("/admint/setPres", (req, res) => {
            var uid = req.body.uid;
            vv ? console.log(chalk`{blue [i]} Presentation change request: {yellow requester UID}{gray :} {blue ${uid}}`) : "";
            res.contentType("json");
            if(uid == adminUID){
                curPres = req.body.presentation;
                io.emit("pres_chosen");
                res.status(200).end(JSON.stringify([ "All OK!" ]));
                v ? console.log(chalk`{blue [i]} Presentation set: {yellow presentation}{gray :} {blue ${curPres}}`) : "";
            } else {
                res.status(200).end(JSON.stringify({ err: "You're not an admin!" }));
            }
        })
        
        app.get("/admint/", (req, res) => {
            fs.readdir(path.resolve(__dirname, "pages", "assets"), (err, fnames) => {
                v && err ? console.log(chalk`{red [-]} {yellow Error}{gray :} {red ${err.message}}`) : "";
                let presentations = [];
                let htmlRE = /\.html?$/;
                fnames.map( (fname) => {
                    let time = timeAgo.format(fs.statSync(path.resolve(__dirname, "pages", "assets", fname)).mtimeMs, "twitter");
                    presentations.push({name: fname.replace(htmlRE, ""), time: time});
                    vv ? console.log(chalk`{blue [i]} {yellow ${fname}}{gray :} {blue ${time}}`) : "";
                })
                res.render("panel", {
                    presentations: presentations
                })
            });
        });

        app.get("/login", (req, res) => {
            res.sendFile(path.resolve(__dirname, "pages", "login.html"))
        });

        app.post("/login", (req, res) => {
            let nick = req.body.nick;
            let pass = req.body.pass;
            let pHashCur = bcrypt.hashSync(pass, 10);
            let uidCur = uuid(`${nick}+-+${bcrypt.hashSync(pass, 10)}`);
            res.contentType("json");            
            if(bcrypt.compareSync(pass, pHash)){
                v ? console.log(chalk`{green [l]} {green Login attempt} {green.bold ACCEPTED}: {yellow nick}{gray :} {blue ${nick}}, {yellow password hash}{gray :} {blue ${pHashCur}}`) : "";
                res.status(200).end(JSON.stringify({uid: adminUID}));
            } else{
                v ? console.log(chalk`{green [l]} {red Login attempt} {red.bold DENIED}: {yellow nick}{gray :} {blue ${nick}}, {yellow password hash}{gray :} {blue ${pHashCur}}, {yellow UUID}{gray :} {blue ${uidCur}}`) : "";
                res.status(200).end(JSON.stringify({err: "Credentials don't match!"}))
            }
        })

        app.post("/doAdmin", (req, res) => {
            let curUID = req.body.uid;
            let rand = crypto.randomBytes(32).toString();
            if(!noMoreAdmin && curUID === adminUID){
                let rand = crypto.randomBytes(32).toString();
                currentMessage = rand;
                adminMSG = rand;
                v ? console.log(chalk`{green [l]} {green Admin verification step} {yellow 1} {green.bold ACCEPTED}: {yellow UUID}{gray :} {blue ${curUID}}, {yellow msg}{gray :} {blue ${rand}}`) : "";
                res.status(200).contentType("json").end(JSON.stringify({
                    msg: rand
                }));
            } else {
                v ? console.log(chalk`{green [l]} {red Admin verification step} {yellow 1} {red.bold DENIED}: {yellow UUID}{gray :} {blue ${curUID}}, {yellow msg}{gray :} {blue ${rand}}`) : "";
                res.status(200).end(JSON.stringify({err: "Credentials don't match!"}))
            }
        })

        app.use(require("./router.js"));

        app.use("/pages", express.static(path.resolve(__dirname, "pages")));
        app.use("/admint/view/", express.static(path.resolve(__dirname, "static")));
        app.use("/", express.static(path.resolve(__dirname, "static")));

        app.use((req, res, next) => {
            vv ? console.log(chalk`{blue [i]} Redirected from {yellow ${req.path}} to {blue ${redirectTo}}`) : "";           
            res.status(404).redirect(redirectTo);
            next();
        })
        
        const server = http.createServer(app);
        
        const io = socketio(server);
        
        io.on("connection", (socket) => {
            var peer = socket.request.socket._peername;
            socket.join("user");
            vv ? console.log(chalk`{blue [i]} Connection: {blue ${peer.address}}{gray :}{magenta ${peer.port}} / {red ${peer.family}}; {yellow secure}{gray :} {blue ${socket.handshake.secure}}`) : "";
            socket.emit("connect_success", true);
            socket.on("doAdmin", (msg) => {
                if(!noMoreAdmin && currentMessage !== "" && currentMessage === msg){
                    v ? console.log(chalk`{green [l]} {green Admin verification step} {yellow 2} {green.bold ACCEPTED}: {yellow message}{gray :} {blue ${msg}}, {yellow currentMessage}{gray :} {blue ${currentMessage}}`) : "";
                    currentMessage = "";
                    socket.emit("gotAdmin", true);
                    socket.join("admin");
                    noMoreAdmin = true;
                    socket.leave("user");
                } else{
                    v ? console.log(chalk`{green [l]} {red Admin verification step} {yellow 2} {red.bold DENIED}: {yellow message}{gray :} {blue ${msg}}, {yellow currentMessage}{gray :} {blue ${currentMessage}}`) : "";
                    socket.emit("gotAdmin", false);
                }
            });
            socket.on("move", (to) => {
                vv ? console.log(chalk`{blue [i]} Move event{gray :} {yellow X}{gray :} {blue ${to[0]}}, {yellow Y}{gray :} {blue ${to[1]}}`) : "";
                if(socket.rooms.hasOwnProperty("admin")){
                    io.to("user").emit("move", to);
                }
            });
            socket.on("disconnect_user", () => {
                vv ? console.log(chalk`{red [d]} Disconnect{gray :} {yellow role}{gray :} {blue User}`) : "";
            });
            
            socket.on("disconnect_admin", (msg) => {
                if(adminMSG !== "" && adminMSG === msg){
                    noMoreAdmin = false;
                    adminMSG = "";
                    v ? console.log(chalk`{red [d]} Disconnect{gray :} {yellow role}{gray :} {blue Admin}`) : "";
                }
            })
        });
        
        
        server.listen(PORT, ()=>{
            console.log(chalk`{green [+]} Server is listening on {blue localhost}{gray :}{magenta ${PORT}}`);
        }).on('error', function(err){
            v ? console.log(chalk`{red [-]} {yellow Error}{gray :} {red ${err.message}}`) : "";
        });
    });
process.on('uncaughtException', function(err) {
    v ? console.log(chalk`{red [-]} {yellow UncaughtError}{gray :} {red ${err.message}}`) : "";
});
    