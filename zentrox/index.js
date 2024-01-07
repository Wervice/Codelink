const express = require('express')
const port = 3000

const path = require("path")
const app = express()
const os = require("os")
const fs = require("fs")

const zentroxInstPath = path.join(os.homedir(), "zentrox/")

// Setup EJS
app.set('views', __dirname + '/templates');
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');

function startsetup() {
    fs.mkdirSync(zentroxInstPath)
    fs.mkdirSync(path.join(zentroxInstPath, "users"))
    fs.writeFileSync(path.join(zentroxInstPath, "zentrox.txt"), "")
}

app.get('/', (req, res) => {
    res.render(path.join(__dirname, "templates/index.html"))
})

/*
app.get('/', (req, res) => { // URL is /
    res.render(path.join(__dirname, "templates/index.html") // File is index.html from templates, {
        t: "a" // Variable t = "a"
    })
})

<%= t%> Calls t => = "a"
*/

app.get('/setup', (req, res) => {
    res.render(path.join(__dirname, "templates/setup.html"))
})

app.post('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, "templates/dashboard.html"))
})

app.use(express.static("static"))

app.get('/api', (req, res) => {

    if (req.query["r"] == "startsetup") {
        if (!fs.existsSync(zentroxInstPath)) {
            try {
                startsetup()            
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