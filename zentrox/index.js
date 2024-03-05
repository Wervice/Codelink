/*
By: Wervice / Constantin Volke
Email: wervice@proton.me
Licence: Apache 2.0 (See GitHub repo (https://github.com/Wervice/Codelink))
*/

const express = require("express");
const port = 3000;
const path = require("path");
const app = express();
const os = require("os");
const fs = require("fs");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const https = require("https");
var osu = require("node-os-utils");
const chpr = require("child_process");

eval(fs.readFileSync(path.join(__dirname, "libs", "packages.js")) + '');


var key = fs.readFileSync(__dirname + "/selfsigned.key");
var cert = fs.readFileSync(__dirname + "/selfsigned.crt");
var options = {
    key: key,
    cert: cert,
};

const zentroxInstPath = path.join(os.homedir(), "zentrox/");

function auth(username, password, req) {
    users = fs
        .readFileSync(path.join(zentroxInstPath, "users.txt"))
        .toString()
        .split("\n");
    console.log("Auth \"" + username + "\"")
    for (user of users) {
        if (atob(user.split(": ")[0]) == username) {
            if (hash512(password) == user.split(": ")[1]) {
                console.log(`Auth for user "${username}" success`)
                return true;
            } else {
                console.log(`Auth for user "${username}" failed`)
                return false;
            }
        }
    }
}

function newUser(username, password, role = "user") {
    console.log(`Adding new user: Name = ${username} | Role = ${role}`)
    if (role == null || role == "") role = "user";
    var userEntryString = btoa(username) + ": " + hash512(password) + ": " + role;
    var alreadyExisting = false
    for (line of fs.readFileSync(path.join(zentroxInstPath, "users.txt")).toString().split("\n")) {
        if (line.split(": ")[0] == btoa(username)) {
            var alreadyExisting = true
        }
    }
    if (!alreadyExisting) {
        fs.appendFileSync(
            path.join(zentroxInstPath, "users.txt"),
            userEntryString + "\n"
        );
        fs.mkdirSync(path.join(zentroxInstPath, "users", btoa(username)))
    }
}

function deleteUser(username) {
    var ostring = ""
    for (line of fs.readFileSync(path.join(zentroxInstPath, "users.txt")).toString().split("\n")) {
        if (line.split(": ")[0] != btoa(username)) {
            var ostring = ostring + line + "\n"
        }
    }
    var userfolder = path.join(zentroxInstPath, "users", btoa(username))
    if (fs.existsSync(userfolder)) {
        chpr.exec("rm -rf " + userfolder)
    }
    fs.writeFileSync(path.join(zentroxInstPath, "users.txt"), ostring)
}

if (!fs.existsSync(path.join(zentroxInstPath, "sessionSecret.txt"))) {
    if (!fs.existsSync(zentroxInstPath)) {
        fs.mkdirSync(zentroxInstPath)
    }
    fs.writeFileSync(
        path.join(zentroxInstPath, "sessionSecret.txt"),
        crypto.randomBytes(64).toString("ascii")
    );
}

if (!fs.existsSync(zentroxInstPath)) {
    fs.mkdirSync(zentroxInstPath);
}

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(
    session({
        secret: fs
            .readFileSync(path.join(zentroxInstPath, "sessionSecret.txt"))
            .toString("utf8"),
        name: "sessionMangemenet",
        saveUninitialized: true,
        resave: true,
        cookie: {
            sameSite: true,
            secure: true,
            httpOnly: true,
        },
    })
);

// Setup EJS
app.set("views", __dirname + "/templates");
app.engine("html", require("ejs").renderFile);
app.set("view engine", "ejs");

function startsetup() {
    if (!fs.existsSync(zentroxInstPath)) {
        fs.mkdirSync(zentroxInstPath);
    }
    fs.mkdirSync(path.join(zentroxInstPath, "users"));
    fs.writeFileSync(path.join(zentroxInstPath, "zentrox.txt"), "");
    fs.writeFileSync(path.join(zentroxInstPath, "users.txt"), "");
}

function hash512(str) {
    var hash = crypto.createHash("sha512");
    var data = hash.update(str, "utf-8");
    return data.digest("hex");
}

app.get("/", (req, res) => {
    if (!fs.existsSync(path.join(zentroxInstPath, "setupDone.txt"))) {
        res.render(path.join(__dirname, "templates/index.html"));
    } else {
        if (req.session.signedIn != true) {
            res.render(path.join(__dirname, "templates/welcome.html"), {
                serverName: fs
                    .readFileSync(path.join(zentroxInstPath, "custom.txt"))
                    .toString()
                    .split("\n")[0]
                    .replace("<", "&lt")
                    .replace(">", "&gt"),
                registrationButton: (function () {
                    if (
                        fs
                            .readFileSync(path.join(zentroxInstPath, "regMode.txt"))
                            .toString()
                            .split("\n")[0] == "public"
                    ) {
                        return "<button class=outline onclick=location.href='signup'>Sign up</button>";
                    } else {
                        return "";
                    }
                })(),
            });
        } else {
            res.redirect("/dashboard");
        }
    }
});

app.post("/login", (req, res) => {
    var authTest = auth(req.body.username, req.body.password, req);
    if (authTest == true) {
        req.session.signedIn = true;
        req.session.username = req.body.username;
        if (
            req.body.username ==
            fs.readFileSync(path.join(zentroxInstPath, "admin.txt"))
        ) {
            req.session.isAdmin = true;
        } else {
            req.session.isAdmin = false;
        }
        res.send({
            status: "s",
        });
    } else {
        res.send({
            status: "f",
            message: "Wrong credentials",
        });
    }
});

app.get("/signup", (req, res) => {
    if (fs.readFileSync(path.join(zentroxInstPath, "regMode.txt")).toString() == "public") {
        if (req.session.signedIn == true) {
            res.redirect("/dashboard")
        }
        else {
            res.render("signup.html", {
                "serverName": fs.readFileSync(path.join(zentroxInstPath, "custom.txt")).toString().split("\n")[0]
            })
        }
    }
    else {
        res.status(403).send("Nice try ;)")
    }
})

app.post("/signup", (req, res) => {
    if (req.session.signedIn == true) {
        res.send({
            "status": "s",
            "text": "Already logged in"
        })
    }
    else {
        newUser(req.body.username, req.body.password)
        res.send(
            { "status": "s" }
        )
    }
})

app.get("/setup", (req, res) => {
    startsetup()
    if (!fs.existsSync(path.join(zentroxInstPath, "setupDone.txt"))) {
        res.render(path.join(__dirname, "templates/setup.html"));
    } else {
        res.redirect("/");
    }
});

app.post("/setup/registAdmin", (req, res) => {
    if (fs.existsSync(path.join(zentroxInstPath, "admin.txt"))) {
        res.status(403).send("This action is not allowed");
    } else {
        newUser(req.body.adminUsername, req.body.adminPassword, "admin");
        fs.writeFileSync(
            path.join(zentroxInstPath, "admin.txt"),
            req.body.adminUsername
        );
        req.session.isAdmin = true
        res.send({
            status: "s"
        });
    }
});

app.post("/setup/regMode", (req, res) => {
    if (fs.existsSync(path.join(zentroxInstPath, "regMode.txt"))) {
        res.status(403).send("This action is not allowed");
    } else {
        fs.writeFileSync(
            path.join(zentroxInstPath, "regMode.txt"),
            req.body.regMode
        );
        res.send({
            status: "s"
        });
    }
});

app.post("/setup/custom", (req, res) => {
    if (fs.existsSync(path.join(zentroxInstPath, "custom.txt"))) {
        res.status(403).send("This action is not allowed");
    } else {
        fs.writeFileSync(
            path.join(zentroxInstPath, "custom.txt"),
            req.body.serverName + "\n" + req.body.cltheme
        );

        // ? Finish setup process
        fs.writeFileSync(path.join(zentroxInstPath, "setupDone.txt"), "true");
        req.session.signedIn = true;
        req.session.isAdmin = true
        res.send({
            status: "s"
        });
    }
});

app.get("/dashboard", (req, res) => {
    if (req.session.signedIn == true) {
        if (req.session.isAdmin) {
            res.render("dashboard_admin.html");
        } else {
            res.render("dashboard_user.html");
        }
    }
    else {
        res.redirect("/");
    }
});

app.use(express.static("static"));

app.get("/api", (req, res) => {
    if (req.query["r"] == "startsetup") {
        if (!fs.existsSync(path.join(zentroxInstPath, "setupDone.txt"))) {
            try {
                if (!fs.existsSync(zentroxInstPath)) {
                    startsetup();
                }
                res.send({
                    status: "s",
                });
                console.log("Started setup");
            }
            catch (e) {
                res.send({
                    status: "f",
                });
                console.warn("Setup init failed", e);
            }
        }
        else {
            res.status(403).send({
                status: "f",
                text: "Can't run this command twice",
            });
        }
    } else if (req.query["r"] == "cpuPercent") {
        if (req.session.isAdmin == true) {
            osu.cpu.usage().then((info) => {
                res.send({
                    status: "s",
                    p: Number(info),
                });
            });
        }
    } else if (req.query["r"] == "ramPercent") {
        if (req.session.isAdmin == true) {
            res.send({
                status: "s",
                p: Number((os.totalmem() - os.freemem()) / os.totalmem()) * 100,
            });
        }

    } else if (req.query["r"] == "callfile") {
        if (req.session.isAdmin == true) {
            res.set({
                "Content-Disposition": `attachment; filename=${path.basename(atob(req.query["file"]))}`
            }).sendFile(atob(req.query["file"]))
        }
        else {
            res.send("This file can not be shown to you")
            console.warn(`Somebody tried to access ${req.query["file"]} without the correct permissions.`)
        }
    } else {
        res.status("403").send({
            status: "f",
            text: "No supported command",
        });
    }
});

app.post("/api", (req, res) => {
    if (req.body.r == "deleteUser") {
        if (req.session.isAdmin) {
            deleteUser(req.body.username)
            res.send(
                {
                    "status": "s"
                }
            )
        }
        else {
            res.status(403).send("You are not an admin")
        }
    }
    else if (req.body.r == "userList") {
        if (req.session.isAdmin == true) {
            var userTable = "<table>"
            var userList = fs.readFileSync(path.join(zentroxInstPath, "users.txt")).toString().split("\n")
            i = 0
            while (i != userList.length) {
                if (userList[i].split(": ")[2] == "admin") {
                    var userStatus = "<b>Admin</b>"
                }
                else {
                    var userStatus = `User</td><td><button style='color:red' onclick="deleteUser('${atob(userList[i].split(": ")[0])}')">Delete</button>`
                }
                if (userList[i].split(": ")[0] != "") {
                    userTable += "<tr><td>" + atob(userList[i].split(": ")[0]) + "</td><td>" + userStatus + "</td></tr>"
                }
                i++
            }
            var userTable = userTable + "</table>"
            res.send({
                status: "s",
                text: userTable
            })
        }
    }
    else if (req.body.r == "filesRender") {
        if (req.session.isAdmin) {
            var filesHTML = ""
            for (fileN of fs.readdirSync(req.body.path)) {
                if (fileN.includes(".")) {
                    if (req.body.showHiddenFiles == true || req.body.showHiddenFiles == "on") {
                        try {
                            if (fs.statSync(path.join(req.body.path, fileN)).isFile()) {
                                var fileIcon = "file.png"
                                var funcToUse = "downloadFile"
                            }
                            else {
                                var fileIcon = "folder.png"
                                var funcToUse = "navigateFolder"
                            }
                        }
                        catch {
                            var fileIcon = "adminfile.png"
                            var funcToUse = "alert"
                        }
                        var filesHTML = filesHTML + `<button class='fileButtons' onclick="${funcToUse}('${fileN}')" oncontextmenu="contextMenuF('${fileN}')"><img src="${fileIcon}"><br>${fileN.replace("<", "&lt;").replace(">", "&gt;")}</button>`
                    }
                } else {
                    try {
                        if (fs.statSync(path.join(req.body.path, fileN)).isFile()) {
                            var fileIcon = "file.png"
                            var funcToUse = "downloadFile"
                        }
                        else {
                            var fileIcon = "folder.png"
                            var funcToUse = "navigateFolder"
                        }
                    }
                    catch {
                        var fileIcon = "adminfile.png"
                        var funcToUse = "alert"
                    }
                    var filesHTML = filesHTML + `<button class='fileButtons' onclick="${funcToUse}('${fileN}')" oncontextmenu="contextMenuF('${fileN}')"><img src="${fileIcon}"><br>${fileN.replace("<", "&lt;").replace(">", "&gt;")}</button>`
                }
            }
            res.send(
                {
                    "status": "s",
                    "content": filesHTML
                }
            )
        }
        else {
            res.status(403).send("'Are you an admin'\n\t- Teapot")
        }
    }
    else if (req.body.r == "deleteFile") {
        try {
            if (req.session.isAdmin) {
                fs.rmSync(req.body.path, { recursive: true, force: true })
                res.send({
                    "status": "s"
                })
            }
        }
        catch (err) {
            console.warn("Error: " + err)
            res.send({
                "status": "f"
            })
        }
    }
    else if (req.body.r == "renameFile") {
        try {
            if (req.session.isAdmin) {
                fs.renameSync(req.body.path, req.body.newName)
            }
            res.send({
                "status": "s"
            })
        }
        catch (err) {
            console.warn("Error: " + err)
            res.send({
                "status": "f"
            })
        }
    }
    else if (req.body.r == "listInstalledPacks") {
        // * Early return if not admin
        if (!req.session.isAdmin) {
            res.status(403).send("If you are an admin, I'm a teapot.")
            return
        }

        // * Get applications, that feature a GUI
        var desktopFile = ""
        var guiApplications = []
        for (desktopFile of fs.readdirSync("/usr/share/applications")) {
            var pathForFile = path.join("/usr/share/applications/", desktopFile)
            console.log(pathForFile)
            if (fs.statSync(pathForFile).isFile()) {
                var desktopFileContent = fs.readFileSync(pathForFile).toString("utf-8")
                var desktopFileContentLines = desktopFileContent.split("\n")
                var nameFound = false
                var iconFound = false
                var appIconName = ""

                for (line of desktopFileContentLines) {
                    if (line.split("=")[0] == "Name" && !nameFound) {
                        var appName = line.split("=")[1]
                        nameFound = true
                    }
                }

                for (line of desktopFileContentLines) {
                    if (line.split("=")[0] == "Icon" && !iconFound) {
                        var appIconName = line.split("=")[1].split(" ")[0]
                        iconFound = true
                    }
                }

                if (getIconForPackage(appIconName) != "") {
                    var iconForPackage = "data:image/svg+xml;base64,"+fs.readFileSync(getIconForPackage(appIconName)).toString("base64")
                }
                else {
                    var iconForPackage = "data:image/svg+xml;base64,"+fs.readFileSync("static/empty.svg").toString("base64")
                }

                guiApplications[guiApplications.length] = [appName, iconForPackage]
            }
        }

        // * Send results to front end

        try {
            res.send({
                "status": "s",
                "content": JSON.stringify({ "gui": guiApplications, "any": listInstalledPackages() }) // * Sends GUI applications and installed packages as JSON
            })
        }
        catch (err) {
            console.warn("Error: " + err)
            res.status(500).send({
                "status": "f"
            })
        }
    }

})

app.get("/logout", (req, res) => {
    req.session.signedIn = null
    req.session.isAdmin = null
    console.log("Logout " + req.session)
    setTimeout(function () { res.redirect("/") }, 1000)
})

server = https.createServer(options, app);

server.listen(port, () => {
    console.log(`Zentrox running on port ${port}`);
});