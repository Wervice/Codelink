const chpr = require("child_process")
const process = require("process")
const fs = require("fs")

supported_os = process.platform == "linux"
releaseInfo = fs.readFileSync("/etc/os-release").toString()

if (releaseInfo.includes('debian') || releaseInfo.includes('ubuntu')) {
    p_manager = 'apt';
} else if (releaseInfo.includes('fedora') || releaseInfo.includes('centos')) {
    p_manager = 'dnf';
} else if (releaseInfo.includes('arch')) {
    p_manager = 'pacman';
}

function listPackagesInstalled() {
  if (supported_os) {
    chpr.exec("dnf list installed", (stdout) => {
      console.log(stdout)
    })
  }
  else {
    new Error("No supported OS")
  }
}

listPackagesInstalled()
