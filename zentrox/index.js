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
const { stdout } = require("process");

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
  for (user of users) {
    console.log(user);
    console.log("_" + atob(user.split(": ")[0]) + "_");
    if (atob(user.split(": ")[0]) == username) {
      if (hash512(password) == user.split(": ")[1]) {
        return true;
      } else {
        return false;
      }
    }
  }
}

function newUser(username, password, role = "user") {
  if (role == null || role == "") role = user;
  userEntryString = btoa(username) + ": " + hash512(password) + ": " + role;
  fs.appendFileSync(
    path.join(zentroxInstPath, "users.txt"),
    "\n" + userEntryString
  );
}

if (!fs.existsSync(path.join(zentroxInstPath, "sessionSecret.txt"))) {
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
  fs.mkdirSync(zentroxInstPath);
  fs.mkdirSync(path.join(zentroxInstPath, "users"));
  fs.writeFileSync(path.join(zentroxInstPath, "zentrox.txt"), "");
  fs.writeFileSync(path.join(zentroxInstPath, "users.txt"), "");
  fs.writeFileSync(path.join(zentroxInstPath, ""));
}

function hash512(str) {
  var hash = crypto.createHash("sha512");
  data = hash.update(str, "utf-8");
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
  authTest = auth(req.body.username, req.body.password, req);
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
  if (fs.readFileSync(path.join(zentroxInstPath, "reqMode.txt")).toString() == "public") {
    if (req.session.signedIn == true) {
      res.redirect("/dashboard")
    }
    else {
      res.render("signup.html")
    }
  }
  else {
    res.status("403").send("Nice try ;)")
  }
})

app.post("/signup", (req, res) => {
  if (req.session.signedIn == true) {
    res.send({
      "status": "s",
      "text": "Already logged in"
    })
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
    res.send({
      status: "s",
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
      status: "s",
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

    res.send({
      status: "s",
    });
  }
});

app.get("/dashboard", (req, res) => {
  if (req.session.signedIn == true) {
    if (
      req.session.username ==
      fs.readFileSync(path.join(zentroxInstPath, "admin.txt").toString("utf-8"))
    ) {
      userTable = "<table>"
      userList = fs.readFileSync(path.join(zentroxInstPath, "users.txt")).toString().split("\n")
      i = 0
      while (i != userList.length) {
        if (userList[i].split(": ")[2] == "admin") {
          userStatus = "<b>Admin</b>"
        }
        else {
          userStatus = "User</tr><td><button>Delete</button></tr><td><button>Kick</button>"
        }
        if (userList[i].split(": ")[0] != "") {
          userTable += "<tr><td>" + atob(userList[i].split(": ")[0]) +"</td><td>"+userStatus+"</td></tr>"
        }
        i++
      }
      userList += "</table>"
      res.render("dashboard_admin.html", {
        "usersTable": userTable
      });
    } else {
      res.render("dashboard_user.html");
    }
  } else {
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
      } catch (e) {
        res.send({
          status: "f",
        });
        console.warn("Setup init failed", e);
      }
    } else {
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
  } else {
    res.status("403").send({
      status: "f",
      text: "No supported command",
    });
  }
});

server = https.createServer(options, app);

server.listen(port, () => {
  console.log(`Zentrox running on port ${port}`);
});
