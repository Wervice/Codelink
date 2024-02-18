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
                    fetch("/api?r=userList").then((res) => res.json()).then((data) => {
                        if (data["status"] == "s") {
                            document.getElementById("usersTable").innerHTML = data["text"]
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
            newFileName = document.getElementById("renameNameInput").value
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

window.onclick = function () {
    document.getElementById("contextmenu").hidden = true
}

window.addEventListener("mousemove", function (e) {
    mouseX = e.pageX
    mouseY = e.pageY
})

setInterval(
    function () {
        setCPUBar()
        setRAMBar()
    }, 5000
)