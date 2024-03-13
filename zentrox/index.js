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
const {
    Worker,
    isMainThread,
    setEnvironmentData,
    getEnvironmentData,
} = require('node:worker_threads');

function zlog(string, type) {
    if (type == "info") {
        console.log("[ Info " + new Date().toLocaleTimeString() + "] " + string)
    }
    else if (type == "error") {
        console.log("[ Error " + new Date().toLocaleTimeString() + "] " + string)
    }
    else {
        console.log("[ Verb " + new Date().toLocaleTimeString() + "] " + string)
    }
}

new Worker("./libs/packageWorker.js")

eval(fs.readFileSync(path.join(__dirname, "libs", "packages.js")) + '');
eval(fs.readFileSync(path.join(__dirname, "libs", "drives.js")) + '');

var key = fs.readFileSync(__dirname + "/selfsigned.key");
var cert = fs.readFileSync(__dirname + "/selfsigned.crt");
var options = {
    key: key,
    cert: cert,
};

const zentroxInstPath = path.join(os.homedir(), "zentrox_data/");

function auth(username, password, req) {
    users = fs
        .readFileSync(path.join(zentroxInstPath, "users.txt"))
        .toString()
        .split("\n");
    zlog("Auth \"" + username + "\"", "info")
    for (user of users) {
        if (atob(user.split(": ")[0]) == username) {
            if (hash512(password) == user.split(": ")[1]) {
                zlog(`Auth for user "${username}" success`, "info")
                return true;
            } else {
                zlog(`Auth for user "${username}" failed`, "info")
                return false;
            }
        }
    }
}

function newUser(username, password, role = "user") {
    zlog(`Adding new user: Name = ${username} | Role = ${role}`, "info")
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
app.use(cookieParser(fs
    .readFileSync(path.join(zentroxInstPath, "sessionSecret.txt"))
    .toString("utf8")));
app.use(
    session({
        secret: fs
            .readFileSync(path.join(zentroxInstPath, "sessionSecret.txt"))
            .toString("utf8"),
        name: "currentSessionCookies",
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
        res.status("403").send();
    }
});

app.get("/signup", (req, res) => {
    if (fs.readFileSync(path.join(zentroxInstPath, "regMode.txt")).toString() == "public") {
        if (req.session.signedIn == true) {
            res.redirect("/dashboard")
        }
        else {
            res.render("signup.html", {
                serverName: fs.readFileSync(path.join(zentroxInstPath, "custom.txt")).toString().split("\n")[0]
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

        // ? Write package list to folder for the 1. time
        var packagesString = String(new Date().getTime()) + "\n"
        var allPackages = listPackages()
        for (line of allPackages) {
            packagesString = packagesString + "\n" + line
        }
        fs.writeFileSync(path.join(zentroxInstPath, "allPackages.txt"), packagesString)

        // ? Installing packages
        console.log("test")
        installPackage("vsftpd", req.body.sudo) // * Install FTP server

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
                startsetup();
                res.send({
                    status: "s",
                });
                zlog("Started setup", "verb");
            }
            catch (e) {
                res.send({
                    status: "f",
                });
                zlog("Setup init failed\t" + e, "error");
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
    } else if (req.query["r"] == "diskPercent") {
        if (req.session.isAdmin == true) {

            var stats = fs.statfsSync("/")
            var percent = ((stats.bsize * stats.blocks) - (stats.bsize * stats.bfree)) / (stats.bsize * stats.blocks)
            res.send({
                status: "s",
                p: Number(percent) * 100,
            });
        }
    } else if (req.query["r"] == "driveList") {
        if (req.session.isAdmin == true) {
            res.send({
                status: "s",
                drives: deviceList()
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
            console.zlog(`Somebody tried to access ${req.query["file"]} without the correct permissions.`, "error")
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
            res.status(403).send("You have no permissions to access this resource")
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
        else {
            res.status(403).send("You have no permissions to access this resource")
        }
    }
    else if (req.body.r == "filesRender") {
        if (req.session.isAdmin) {
            var filesHTML = ""
            for (fileN of fs.readdirSync(req.body.path)) {
                if (fileN[0] == ".") {
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
            res.status(403).send("You have no permissions to access this resource")
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
    else if (req.body.r == "packageDatabase") {
        // * Early return if not admin
        if (!req.session.isAdmin) {
            res.status(403).send("You have no permissions to access this resource")
            return
        }

        zlog("Request Package Database JSON", "info")

        // * Get applications, that feature a GUI
        var desktopFile = ""
        var guiApplications = []

        var allInstalledPackages = listInstalledPackages() // ? All installed packages on the system
        allPackages = fs.readFileSync(path.join(zentroxInstPath, "allPackages.txt")).toString("ascii").split("\n")
        allPackages.splice(0, 1)
        for (desktopFile of fs.readdirSync("/usr/share/applications")) { // ? Find all GUI applications using .desktop files
            var pathForFile = path.join("/usr/share/applications/", desktopFile)
            zlog(pathForFile, "verb")
            if (fs.statSync(pathForFile).isFile()) {
                var desktopFileContent = fs.readFileSync(pathForFile).toString("utf-8") // ? Read desktop file
                var desktopFileContentLines = desktopFileContent.split("\n")
                var nameFound = false
                var iconFound = false
                var appExecNameFound = false
                var appIconName = ""
                var allOtherPackages = []

                for (line of desktopFileContentLines) {
                    if (line.split("=")[0] == "Name" && !nameFound) { // ? Find nice name
                        var appName = line.split("=")[1]
                        nameFound = true
                    }
                }

                for (line of desktopFileContentLines) {
                    if (line.split("=")[0] == "Icon" && !iconFound) { // ? Find icon name
                        var appIconName = line.split("=")[1].split(" ")[0]
                        iconFound = true
                    }
                }

                for (line of desktopFileContentLines) { // ? Find exec command
                    if (line.split("=")[0] == "Exec" && !appExecNameFound) {
                        var appExecName = line.split("=")[1].split(" ")[0]
                        appExecNameFound = true
                    }
                }

                if (getIconForPackage(appIconName) != "") {
                    var iconForPackage = "data:image/svg+xml;base64," + fs.readFileSync(getIconForPackage(appIconName)).toString("base64") // ? Icon as Base64 for package
                }
                else {
                    var iconForPackage = "data:image/svg+xml;base64," + fs.readFileSync("static/empty.svg").toString("base64") // ? "Missing icon" SVG as Base64
                }

                guiApplications[guiApplications.length] = [appName, iconForPackage, appExecName] // ? The GUI application as an array
            }
        }

        var i = 0
        // ? Filter if package is already in another part of JSON
        for (package of allPackages) {
            if (!allInstalledPackages.includes(package)) {
                allOtherPackages[i] = package
                var i = i + 1
            }
        }

        // * Send results to front end

        try {
            res.send({
                "status": "s",
                "content": JSON.stringify({ "gui": guiApplications, "any": allInstalledPackages, "all": allOtherPackages }) // * Sends GUI applications and installed packages as JSON
            })
        }
        catch (err) {
            zlog(err, "error")
            res.status(500).send({
                "status": "f"
            })
        }
    }
    else if (req.body.r == "removePackage") {
        if (!req.session.isAdmin) {
            res.status(403).send("You have no permissions to access this resource")
            return
        }
        if (removePackage(req.body.packageName, req.body.sudoPassword)) {
            res.send({
                "status": "s"
            })
            zlog("Removed package " + req.body.packageName, "info")
        }
        else {
            res.send({
                "status": "f"
            })
            zlog("Failed to remove package " + req.body.packageName, "error")
        }
    }
    else if (req.body.r == "installPackage") {
        zlog("Install package " + req.body.packageName, "info")
        if (!req.session.isAdmin) {
            res.status(403).send("You have no permissions to access this resource")
            return
        }
        if (installPackage(req.body.packageName, req.body.sudoPassword)) {
            res.send({
                "status": "s"
            })
            zlog("Installed package " + req.body.packageName, "info")
        }
        else {
            res.send({
                "status": "f"
            })
            zlog("Failed to install package " + req.body.packageName, "error")
        }
    }
    else if (req.body.r == "updateFTPconfig") {
        if (!req.session.isAdmin) {
            res.status(403).send("You have no permissions to access this resource")
            return
        }

        zlog("Change FTP Settings")
        if (req.body.enableFTP == "true" || req.body.enableFTP == true) {
            chpr.execSync(`echo ${req.body.sudo.replace("\"", "\\\"").replace("\'", "\\\'").replace("\`", "\\\`")} | sudo -S systemctl enable --now vsftpd`, { stdio: "pipe" })
        }
        else {
            chpr.execSync(`echo ${req.body.sudo.replace("\"", "\\\"").replace("\'", "\\\'").replace("\`", "\\\`")} | sudo -S systemctl disable --now vsftpd`, { stdio: "pipe" })
        }

        res.send({
            "status": "s"
        })
    }
    else if (req.body.r == "ftpInformation") {
        if (!req.session.isAdmin) {
            res.status(403).send("You have no permissions to access this resource")
            return
        }

        try {
            var enableFTP = chpr.execSync("systemctl status vsftpd", { timeout: 2000 }).toString("ascii").includes("active")
        }
        catch (e) {
            console.log(e)
            var enableFTP = false
        }

        res.send({
            "status": "s",
            "enabled": enableFTP
        })
    }
    else if (req.body.r == "driveInformation") {
        if (!req.session.isAdmin) {
            res.status(403).send("You have no permissions to access this resource")
            return
        }
        res.send(
            {
                "status": "s",
                "drives": deviceInformation(req.body.driveName)
            }
        )
    }
})

app.get("/logout", (req, res) => {
    req.session.signedIn = null
    req.session.isAdmin = null
    zlog("Logout " + req.session, "info")
    setTimeout(function () { res.redirect("/") }, 1000)
})

server = https.createServer(options, app);

server.listen(port, () => {
    zlog(`Zentrox running on port ${port}`, "info");
});

