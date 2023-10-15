const { exec } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

win = nw.Window.get()
win.width = 750
win.height = 500

function renderFolderList(location) {
    s = ""
    for (file of fs.readdirSync(location)) {
        if (location[location.length - 1] == "\/" || location[location.length - 1] == "\\") {
            location = location
        }
        else {
            location = location + "/"
        }
        try {
            if (fs.statSync(location + file).isFile()) {

            }
            else {
                img_path = "../images/folder.png"
                if (file[0] == "." || file[0] == "$") {
                    s = s + "<button data-filename=\"" + file + "\" oncontextmenu=makeContext(\"" + encodeURIComponent(file) + "\") onclick=handleFile(\"" + encodeURIComponent(file) + "\") style=opacity:70%><img src=\"" + img_path + "\" height=16> " + file + "</button><br>"
                }
                else {
                    s = s + "<button data-filename=\"" + file + "\" oncontextmenu=makeContext(\"" + encodeURIComponent(file) + "\") onclick=handleFile(\"" + encodeURIComponent(file) + "\")><img src=\"" + img_path + "\" height=16> " + file + "</button><br>"
                }
            }
        }
        catch {
            img_path = "../images/adminonly.png"
            s = s + "<button data-filename=\"" + file + "\" oncontextmenu=makeContext(\"" + encodeURIComponent(file) + "\") onclick=handleFile(\"" + encodeURIComponent(file) + "\")><img src=\"" + img_path + "\" height=16> " + file + "</button><br>"

        }

    }
    document.getElementById("folder_list").innerHTML = s
} // ? Render the folder list

function renderContentView(location) {
    s = ""
    for (file of fs.readdirSync(location)) {
        if (location[location.length - 1] == "\/" || location[location.length - 1] == "\\") {
            location = location
        }
        else {
            location = location + "/"
        }
        try {
            if (fs.statSync(location + file).isFile()) {
                img_path = "../images/file.png"
                s = s + "<button data-filename=\"" + file + "\" onclick=handleFile(\"" + encodeURIComponent(file) + "\") oncontextmenu=makeContext('" + encodeURIComponent(file) + "')><img src=\"" + img_path + "\" height=16><br>" + file + "</button>"

            }
        }
        catch {
            img_path = "../images/adminfile.png"
            s = s + "<button data-filename=\"" + file + "\" onclick=handleFile(\"" + encodeURIComponent(file) + "\") oncontextmenu=makeContext('" + encodeURIComponent(file) + "')><img src=\"" + img_path + "\" height=16><br>" + file + "</button>"

        }

    }
    document.getElementById("browser_window").innerHTML = s
} // ? Render the content for the folder content view

function makeContext(filename) {
    filename = decodeURIComponent(filename)
    setTimeout(window.addEventListener("mouseup", function () {
        if (this.document.getElementById("contextmenu").hidden == false) {
            this.setTimeout(function () { this.document.getElementById("contextmenu").hidden = true; }, 120)
        }
    }), 100)
    this.document.getElementById("contextmenu").style.top = mousey + "px"
    this.document.getElementById("contextmenu").style.left = mousex + "px"
    document.getElementById("contextmenu").hidden = false;
    if (currentLocation[currentLocation.length - 1] == "\/" || currentLocation[currentLocation.length - 1] == "\\") {
        currentLocation = currentLocation
    }
    else {
        currentLocation = currentLocation + "/"
    }
    context_file = currentLocation + filename
    return false;
} // ? Fire context menu

function handleFile(filename) {
    // Get stat
    filename = decodeURIComponent(filename)
    try {
        if (currentLocation[currentLocation.length - 1] == "\/" || currentLocation[currentLocation.length - 1] == "\\") {
            currentLocation = currentLocation
        }
        else {
            currentLocation = currentLocation + "/"
        }
        if (fs.statSync(currentLocation + filename).isFile()) {
            type = "file"
        }
        else {
            type = "folder"
        }
    }
    catch (e) {
        type = "admin"
        console.error(e)
    }
    // Handle
    if (type == "file") {
        exec("\"" + currentLocation + filename + "\"")
    }
    else if (type == "folder") {
        renderFolderList(currentLocation + filename)
        renderContentView(currentLocation + filename)
        currentLocation = currentLocation + filename
        document.getElementById("pathInput").value = currentLocation
    }
    else if (type == "admin") {
        errorModal("Error", "This file can not be opened.<br>Please try again as admin/sudo.", function () { })
    }
} // ? Manage a file click

function inputModal(listener, placeholder = "") {
    document.getElementById("inputModal").hidden = false
    document.getElementById("inputModalInput").placeholder = placeholder
    document.getElementById("inputModalInput").onkeydown = function (e) {
        if (e.key == "Enter") {
            listener()
            flyOut("inputModal", 500)
            setTimeout(function () { document.getElementById("inputModalInput").value = "", document.getElementById("inputModalInput").placeholder = "" }, 600)

        }
    }
} // ? Make a text input popup

function goToPathInput() {
    ilocation = document.getElementById('pathInput').value
    renderFolderList(ilocation)
    renderContentView(ilocation)
} // ? Go to the path in the input (For button)

function goUp() {
    updir_s = path.dirname(currentLocation)
    currentLocation = updir_s
    renderContentView(currentLocation)
    renderFolderList(currentLocation)
    document.getElementById("pathInput").value = currentLocation
} // ? Go one dir up

function newFile() {
    locationused = currentLocation
    if (locationused[locationused.length - 1] == "\/" || locationused[locationused.length - 1] == "\\") {
        locationused = locationused
    }
    else {
        locationused = locationused + "/"
    }
    inputModal(
        function () {
            newPathFromInput = document.getElementById("inputModalInput").value
            if (!fs.existsSync(locationused + newPathFromInput)) {
                if (newPathFromInput.includes(".")) {
                    fs.writeFileSync(locationused + newPathFromInput, "")
                }
                else {
                    fs.mkdirSync(locationused + newPathFromInput)
                }
            }
            else {
                errorModal("File error", "This file couldn't be created.", function () { })
            }
            renderContentView(currentLocation)
            renderFolderList(currentLocation)
        }, "Enter new filename or foldername")

} // ? Create a new file

window.addEventListener("load", function () {
    dataInit() // ! Do not move
    this.document.getElementById('pathInput').onkeydown = function (e) {
        if (e.key == "Enter") {
            if (this.value[0] != "?")
                renderFolderList(this.value)
            renderContentView(this.value)
            currentLocation = this.value
        }
    }
    this.document.getElementById('contextmenu_open').onclick = function () {
        exec(context_file)
    }
    this.document.getElementById('contextmenu_rename').onclick = function () {
        document.getElementById("inputModalInput").value = context_file
        inputModal(
            function () {
                if (fs.existsSync(document.getElementById("inputModalInput").value)) {
                    errorModal("This file already exists", "Please choose another name", function () { })
                }
                else {
                    fs.renameSync(context_file, document.getElementById("inputModalInput").value)
                }
                renderContentView(currentLocation)
                renderFolderList(currentLocation)
            }
        )
    }
    this.document.getElementById('contextmenu_delete').onclick = function () {
        confirmModal("Remove file", `Do you want to remove <b>${context_file.replace("/", "\\").split("\\")[context_file.replace("/", "\\").split("\\").length - 1]}</b>?`, function () {
            try {
                if (fs.statSync(context_file).isFile()) {
                    fs.unlinkSync(context_file)
                }
                else {
                    fs.rmdirSync(context_file)
                }
            }
            catch {
                errorModal("Remove failed", "Can't remove this file", function () { })
            }
            renderContentView(currentLocation)
            renderFolderList(currentLocation)
        })
    }
    this.document.getElementById('contextmenu_new').onclick = function () { newFile() }
    renderContentView(os.homedir() + "\\")
    renderFolderList(os.homedir() + "\\")
    this.document.getElementById("pathInput").value = os.homedir() + "\\"
    currentLocation = os.homedir() + "\\"
})

window.addEventListener("mousemove", function (e) {
    mousex = e.x
    mousey = e.y
})

window.addEventListener("keydown", function (e) {
    if (e.key == "Escape") {
        flyOut("inputModal", 500)
        setTimeout(function () { document.getElementById("inputModalInput").value = "" }, 600)
    }
})

