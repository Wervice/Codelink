const path = require("path")
const app = express()
const os = require("os")
const fs = require("fs")
const helmet = require("helmet")

const express = require('express')
const port = 3000

const zentroxInstPath = path.join(os.homedir()+"zentrox/")

app.use(helmet())
app.disable('x-powered-by')

app.use((req, res, next) => {
  res.status(404).sendFile(path.join(__dirname, "templates/404.html"))
})

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, "templates/index.html"))
})

app.get('/api', (req, res) => {
  if (req.query.get("r") == "startsetup") {
    if (!fs.existsSync(zentroxInstPath)) {
    startsetup()
  }
  else {
    res.send("You have no permissions to run this command")
  }
  }
  else {
    res.send("You can not run this command on the API.")
  }
})

app.use("/static", express.static('static'))

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})