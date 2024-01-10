const express = require('express')
const port = 3000

const path = require("path")
const app = express()
const os = require("os")
const fs = require("fs")
const bodyParser = require('body-parser')
const crypto = require("crypto")
const cookieParser = require("cookie-parser")
const session = require("express-session")


const zentroxInstPath = path.join(os.homedir(), "zentrox/")

if (!fs.existsSync(path.join(zentroxInstPath, "sessionSecret.txt"))) {
    fs.mkdirSync(zentroxInstPath)
    fs.writeFileSync(path.join(zentroxInstPath, "sessionSecret.txt"), crypto.randomBytes(64).toString("ascii"))
}

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(cookieParser())
app.use(session({
    secret: fs.readFileSync(path.join(zentroxInstPath, "sessionSecret.txt")).toString("utf8"),
    name: "sessionMangemenet",
    cookie: {
        secure: true,
        httpOnly: true,
    }
}))

// Setup EJS
app.set('views', __dirname + '/templates');
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');

function auth(username, password, req) {
    users = fs.readFileSync(path.join(zentroxInstPath, "users.txt")).toString().split("\n")
    for (user of users) {
        if (Buffer.from(user.split(": ")[0], "utf-8")) {
            console.log("JEAH")
        }
    }
}

function startsetup() {
    fs.mkdirSync(zentroxInstPath)
    fs.mkdirSync(path.join(zentroxInstPath, "users"))
    fs.writeFileSync(path.join(zentroxInstPath, "zentrox.txt"), "")
    fs.writeFileSync(path.join(zentroxInstPath, "users.txt"), "")
    fs.writeFileSync(path.join(zentroxInstPath, ""))
}

function hash512(str) {
    var hash = crypto.createHash("sha512")
    data = hash.update(str, "utf-8")
    return data.digest("hex")
}

app.get('/', (req, res) => {
    if (!fs.existsSync(path.join(zentroxInstPath, "setupDone.txt"))) {
        res.render(path.join(__dirname, "templates/index.html"))
    }
    else {
        if (req.session.signedIn != true) {
            res.render(path.join(__dirname, "templates/welcome.html"), {
                serverName: fs.readFileSync(path.join(zentroxInstPath, "custom.txt")).toString().split("\n")[0].replace("<", "&lt").replace(">", "&gt"),
                registrationButton: function () {
                    if (fs.readFileSync(path.join(zentroxInstPath, "regMode.txt")).toString().split("\n")[0] == "public") {
                        return "<button class=outline>Sign up</button>"
                    }
                    else {
                        return ""
                    }
                }()
            })
        }
        else {
            res.redirect("/dashboard")
        }
    }
})

app.post('/login', (req, res) => {
    auth(req.body.username, req.body.password, req)
})

app.get('/setup', (req, res) => {
    if (!fs.existsSync(path.join(zentroxInstPath, "setupDone.txt"))) {
        res.render(path.join(__dirname, "templates/setup.html"))
    }
    else {
        res.redirect("/")
    }
})

app.post('/setup/registAdmin', (req, res) => {
    if (fs.existsSync(path.join(zentroxInstPath, "admin.txt"))) {
        res.status(403).send("This action is not allowed")
    } else {
        fs.writeFileSync(path.join(zentroxInstPath, "users.txt"), Buffer.from(req.body.adminUsername, "base64") + ": " + hash512(req.body.adminPassword)+"\n")
        res.send({
            "status": "s"
        })
    }
})

app.post('/setup/regMode', (req, res) => {
    if (fs.existsSync(path.join(zentroxInstPath, "regMode.txt"))) {
        res.status(403).send("This action is not allowed")
    } else {
        fs.writeFileSync(path.join(zentroxInstPath, "regMode.txt"), req.body.regMode)
        res.send({
            "status": "s"
        })
    }
})

app.post('/setup/custom', (req, res) => {
    if (fs.existsSync(path.join(zentroxInstPath, "custom.txt"))) {
        res.status(403).send("This action is not allowed")
    } else {
        fs.writeFileSync(path.join(zentroxInstPath, "custom.txt"), req.body.serverName + "\n" + req.body.cltheme)

        // ? Finish setup process
        fs.writeFileSync(path.join(zentroxInstPath, "setupDone.txt"), "true")
        req.session.signedIn = true

        res.send({
            "status": "s"
        })
    }
})

app.get('/dashboard', (req, res) => {
    if (req.session.signedIn == true) {
        res.render(path.join(zentroxInstPath, "dashboard.html"))
    }
    else {
        res.redirect("/")
    }
})

app.use(express.static("static"))

app.get('/api', (req, res) => {

    if (req.query["r"] == "startsetup") {
        if (!fs.existsSync(path.join(zentroxInstPath, "setupDone.txt"))) {
            try {
                if (!fs.existsSync(zentroxInstPath)) {
                    startsetup()
                }
                res.send({
                    "status": "s"
                })
                console.log("Started setup")
            }
            catch (e) {
                res.send({
                    "status": "f"
                })
                console.warn("Setup init failed", e)
            }
        }
        else {
            res.status(403).send({
                "status": "f",
                "text": "Can't run this command twice"
            })
        }
    }
    else {
        res.status("403").send({
            "status": "f",
            "text": "No supported command"
        })
    }
})

app.listen(port, () => {
    console.log(`Zentrox running on port ${port}`)
})