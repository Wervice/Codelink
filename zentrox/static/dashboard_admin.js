function setCPUBar() {
    fetch("/api?r=cpuPercent", {
        "method": "GET",
        "headers": {
            "Content-Type": "application/json"
        }
    }).then((res) => res.json())
        .then((data) => {
            if (data["status"] == "s") {
                document.getElementById("cpu_bar").style.width = Math.floor(Number(data["p"] * 2)) + "px"
                document.getElementById("cpu_bar").title = "CPU " + Math.round(data["p"]) + "%"
            }
        })
}

function setRAMBar() {
    fetch("/api?r=ramPercent", {
        "method": "GET",
        "headers": {
            "Content-Type": "application/json"
        }
    }).then((res) => res.json())
        .then((data) => {
            if (data["status"] == "s") {
                document.getElementById("ram_bar").style.width = Math.floor(Number(data["p"]) * 2) + "px"
                document.getElementById("ram_bar").title = "RAM " + Math.round(data["p"]) + "%"
            }
        })
}

function setDiskBar() {
    fetch("/api?r=diskPercent", {
        "method": "GET",
        "headers": {
            "Content-Type": "application/json"
        }
    }).then((res) => res.json())
        .then((data) => {
            if (data["status"] == "s") {
                document.getElementById("disk_bar").style.width = Math.floor(Number(data["p"]) * 2) + "px"
                document.getElementById("disk_bar").title = "Disk " + Math.round(data["p"]) + "%"
            }
        })
}

function deleteUser(username) {
    if (confirm(`Do you want to delete ${username}?`)) {
        fetch("/api", {
            "method": "POST",
            "headers": {
                "Content-Type": "application/json"
            },
            "body": JSON.stringify({
                "username": username,
                "r": "deleteUser"
            })
        }).then((res) => res.json())
            .then((data) => {
                if (data["status"] == "s") {
                    // * Get list of users
                    fetch("/api", {
                        "method": "POST",
                        "headers": {
                            "Content-Type": "application/json"
                        },
                        "body": JSON.stringify({
                            "r": "userList"
                        })
                    }).then((res) => res.json())
                        .then((data) => {
                            if (data["status"] == "s") {
                                document.getElementById("usersTable").innerHTML = data["text"]

                            }
                            else {
                                alert("Can not delete user")
                            }
                        })
                }
                else {
                    alert("Can not delete user")
                }
            })
    }
}

function changePage(pageName) {
    for (page of document.querySelectorAll("#pages > div")) {
        console.log(page)
        if (page.id != pageName) {
            page.hidden = true
        }
        else {
            page.hidden = false
        }
    }

    if (pageName == "applications" && typeof allApps == 'undefined') {
        renderApplicationManagerList()
    }
}

var currFPath = "/"

function renderFiles(path) {
    fetch("/api", {
        "method": "POST",
        "headers": {
            "Content-Type": "application/json"
        },
        "body": JSON.stringify({
            "path": path,
            "showHiddenFiles": document.getElementById("showHiddenFiles").checked,
            "r": "filesRender"
        })
    }).then((res) => res.json())
        .then((data) => {
            if (data["status"] == "s") {
                document.getElementById("filesContainer").innerHTML = data["content"]

            }
            else {
                alert("Can not fetch files list")
            }
        })
}

function navigateFolder(file) {
    currFPath = currFPath + file + "/"
    renderFiles(currFPath)
}

function downloadFile(file) {
    window.open("/api?r=callfile&file=" + btoa(currFPath + file))
}

function goFUp() {
    if (currFPath != "/") {
        currFPathReps = currFPath.split("/")[currFPath.split("/").length - 2] + "/"
        currFPath = currFPath.replace(currFPathReps, "")
        renderFiles(currFPath)
    }
}

function contextMenuF(filename) {
    document.getElementById("contextmenu").hidden = false
    document.getElementById("contextmenu").style.top = mouseY + "px"
    document.getElementById("contextmenu").style.left = mouseX + "px"
    contextFMenuFile = currFPath + filename
}

window.onload = function () {
    dataInit()
    setCPUBar()
    setRAMBar()
    document.querySelector("#contextmenu #deleteButton").addEventListener("click", function () {
        confirmModal("Delete", "Do you want to proceed", function () {
            fetch("/api", {
                "method": "POST",
                "headers": {
                    "Content-Type": "application/json"
                },
                "body": JSON.stringify({
                    "path": contextFMenuFile,
                    "r": "deleteFile"
                })
            }).then((res) => res.json())
                .then((data) => {
                    if (data["status"] == "s") {
                        renderFiles(currFPath)
                    }
                    else {
                        alert("Can not delete this file")
                    }
                })
            renderFiles(currFPath)
        })
    }
    )

    document.querySelector("#contextmenu #renameButton").addEventListener("click", function () {
        confirmModal("Rename", "Filename<br><br><input type='text' id='renameNameInput'>", function () {
            var newFileName = document.getElementById("renameNameInput").value
            fetch("/api", {
                "method": "POST",
                "headers": {
                    "Content-Type": "application/json"
                },
                "body": JSON.stringify({
                    "path": contextFMenuFile,
                    "newName": currFPath + newFileName,
                    "r": "renameFile"
                })
            }).then((res) => res.json())
                .then((data) => {
                    if (data["status"] == "s") {
                        renderFiles(currFPath)
                    }
                    else {
                        alert("Can not rename this file")
                    }
                })
            renderFiles(currFPath)
        })
    }
    )
}

function renderApplicationManagerList() {
    fetch("/api", {
        "method": "POST",
        "headers": {
            "Content-Type": "application/json"
        },
        "body": JSON.stringify({
            "r": "packageDatabase"
        })
    }).then((res) => res.json())
        .then((data) => {
            if (data["status"] == "s") {
                var responseJSON = JSON.parse(data["content"])
                guiApps = responseJSON["gui"] // ? Installed & has GUI
                anyApps = responseJSON["any"] // ? Installed and can have GUI
                allApps = responseJSON["all"] // ? All packages in the DB
                document.getElementById("loadingApplications").hidden = true
                document.getElementById("packageSearchResults").hidden = true
                document.getElementById("installedPackagesDetails").hidden = false
                document.getElementById("installedAppsDetails").hidden = false
                console.log(guiApps)
                var htmlCode = ""
                for (e of Array.from(guiApps)) {
                    if (e != undefined) {
                        var htmlCode = htmlCode + "<div class='package'><img src='" + e[1] + "'><br>" + e[0].split(".")[0].replace("-", " ") + "<br><button class='remove_package' onclick='removePackage(\"" + e[2] + "\")'>Remove</button></div>"
                        console.log(e[1])
                    }
                }
                document.getElementById("installedApps").innerHTML = htmlCode

                var htmlCode = ""
                for (e of Array.from(anyApps)) {
                    if (e.length != 0) {
                        if (e != undefined) {
                            var htmlCode = htmlCode + "<div class='package_small'>" + e.split(".")[0].replace("-", " ") + "<button class='remove_package' onclick='removePackage(\"" + e + "\")'>Remove</button></div>"
                            console.log(e[1])
                        }
                    }
                }
                document.getElementById("installedPackages").innerHTML = htmlCode

            }
            else {
                alert("Can not fetch pack list")
            }
        })
}

function lookForPackage() {
    var packageName = document.getElementById("packageSearch").value
    if (packageName != "" && packageName != null) {
        document.getElementById("packageSearchResults").hidden = false
        document.getElementById("installedPackagesDetails").hidden = true
        document.getElementById("installedAppsDetails").hidden = true
        var htmlCode = ""
        if (packageName.length > 2) {
            for (e of anyApps) {
                if (e.includes(packageName)) {
                    var htmlCode = htmlCode + `<div class=package_small>${e.split(".")[0]} <button class=remove_package onclick=removePackage('${e}')>Remove</button></div>`
                }
            }

            for (e of allApps) {
                if (e.includes(packageName)) {
                    var htmlCode = htmlCode + `<div class=package_small>${e.split(".")[0]} <button class=install_package onclick=installPackage('${e}')>Install</button></div>`
                }
            }
        }
        document.getElementById("packageSearchResults").innerHTML = htmlCode

    }
    else {
        document.getElementById("packageSearchResults").hidden = true
        document.getElementById("installedPackagesDetails").hidden = false
        document.getElementById("installedAppsDetails").hidden = false
    }

}

function removePackage(packageName, button) {
    confirmModal("Remove app", "<input type='password' placeholder='SUDO Password' id='sudoPasswordInput'>", function () {
        fetch("/api", {
            "method": "POST",
            "headers": {
                "Content-Type": "application/json"
            },
            "body": JSON.stringify({
                "r": "removePackage",
                "packageName": packageName,
                "sudoPassword": document.getElementById("sudoPasswordInput").value
            })
        }).then((res) => res.json())
            .then((data) => {
                if (data["status"] == "s") {
                    renderApplicationManagerList()
                }
                else {
                    errorModal("Remove package", "Failed to remove package.")
                }
            })
    })
}

function installPackage(packageName, button) {
    confirmModal("Install app", "<input type='password' placeholder='SUDO Password' id='sudoPasswordInput'>", function () {
        fetch("/api", {
            "method": "POST",
            "headers": {
                "Content-Type": "application/json"
            },
            "body": JSON.stringify({
                "r": "installPackage",
                "packageName": packageName,
                "sudoPassword": document.getElementById("sudoPasswordInput").value
            })
        }).then((res) => res.json())
            .then((data) => {
                if (data["status"] == "s") {
                    renderApplicationManagerList()
                }
                else {
                    errorModal("Install package", "Failed to install package.")
                }
            })
    })
}

window.onclick = function () {
    document.getElementById("contextmenu").hidden = true
}

window.addEventListener("mousemove", function (e) {
    mouseX = e.pageX
    mouseY = e.pageY

    fetch("/api", {
        "method": "POST",
        "headers": {
            "Content-Type": "application/json"
        },
        "body": JSON.stringify({
            "r": "userList"
        })
    }).then((res) => res.json())
        .then((data) => {
            if (data["status"] == "s") {
                document.getElementById("usersTable").innerHTML = data["text"]

            }
            else {
                alert("Can not delete user")
            }
        })
})

setInterval(
    function () {
        setCPUBar()
        setRAMBar()
    }, 5000
)