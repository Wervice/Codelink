const chpr = require("child_process")
const process = require("process")
const fs = require("fs")
const path = require("path")
const os = require("os")

supported_os = process.platform == "linux"
releaseInfo = fs.readFileSync("/etc/os-release").toString()

if (releaseInfo.includes('debian') || releaseInfo.includes('ubuntu')) {
  p_manager = 'apt';
} else if (releaseInfo.includes('fedora') || releaseInfo.includes('centos')) {
  p_manager = 'dnf';
  listInsalledCommand = "dnf list installed"
  listCommand = "dnf list"
} else if (releaseInfo.includes('arch')) {
  p_manager = 'pacman';
}

function listInstalledPackages(callback) { // Lists packages and returns an Array
  packages = []
  i = 0
  if (supported_os) {
    chpr.exec(listInsalledCommand, (stdout, stderr) => {
      if (stdout == null) {
        for (line of stderr.split("\n")) {
          packages[i] = line.split(" ")[0]
          i++
        }
      }
      else {
        for (line of stdout.split("\n")) {
          packages[i] = line.split(" ")[0]
          i++
        }
      }
      if (packages[0] == "Installed") {
        delete packages[0]
      }
      callback(packages)
    })
  }
  else {
    new Error("No supported OS")
  }
}

function listPackages(callback) {
  packages = []
  i = 0
  if (supported_os) {
    chpr.exec(listCommand, (stdout, stderr) => {
      console.log(stderr.split("\n"))
      for (line of stderr.split("\n")) {
        packages[i] = line.split(" ")[0]
        i++
      }
      if (packages[0] == "Installed") {
        delete packages[0]
      }
      if (packages.includes("Last")) {
        delete packages[packages.indexOf("Last")]
      }

      if (packages.includes("Installed")) {
        delete packages[packages.indexOf("Installed")]
      }
      callback(packages)
    })
  }
  else {
    new Error("No supported OS")
  }
}

function getIconForPackage(callback) {
  if (fs.existsSync(path.join(os.homedir(), "/.local/share/icons"))) {
    for (folder of fs.readdirSync(fs.existsSync(path.join(os.homedir(), "/.local/share/icons")))) {
      /* TODO if (fs.existsSync(path.join(os.homedir(), "/.local/share/icons", folder, "apps"))) */
    }
  }
  else {
    icon = null
    new Error(`Couldn't find an icon for this package.\nThis library looks for icon packages here: ${path.join(os.homedir(), "/.local/share/icons")}\nPlease make sure, if this package does have an icon in general.`)
  }
}

listPackages((packages) => {
    console.log(packages)
})