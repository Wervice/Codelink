const { exec } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { listeners } = require("process");
const internal = require("stream");
const fse = require("fs-extra");
const { fileURLToPath } = require("url");
const crypto = require('crypto');
const { channel } = require("diagnostics_channel");

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
    if (mousey > window.innerHeight - 300) {
        this.document.getElementById("contextmenu").style.top = mousey - 300 + "px"
        this.document.getElementById("contextmenu").style.left = mousex + "px"
    }
    else {
        this.document.getElementById("contextmenu").style.top = mousey + "px"
        this.document.getElementById("contextmenu").style.left = mousex + "px"
    }
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
        if (!isEncryptedFile(currentLocation + filename)) {
            exec("\"" + currentLocation + filename + "\"")
        }
        else {
            alert("It is encrypted")
        }
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
            flyOut("inputModal", 500)
            setTimeout(function () { document.getElementById("inputModalInput").value = "", document.getElementById("inputModalInput").placeholder = "" }, 600)
            listener()
        }
    }
} // ? Make a text input popup

// * Beginning encryption code
//Checking the crypto module
const algorithm = 'aes-256-cbc'; //Using AES encryption

//Encrypting text
function encrypt(text, key) {
    const iv = crypto.randomBytes(16);
    let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') };
}

// Decrypting text
function decrypt(text, key) {
    let iv = Buffer.from(text.iv, 'hex');
    let encryptedText = Buffer.from(text.encryptedData, 'hex');
    let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

// * Ending encryption code




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

function pasteFile() {
    if (currentLocation[currentLocation.length - 1] == "\/" || currentLocation[currentLocation.length - 1] == "\\") {
        currentLocation = currentLocation
    }
    else {
        currentLocation = currentLocation + "/"
    }
    if (fs.statSync(file_in_copy).isFile()) {
        if (fs.existsSync(currentLocation + path.basename(file_in_copy))) {
            errorModal("Paste error", "In this folder already is a file called " + path.basename(file_in_copy), function () {
                inputModal(function () {
                    fs.copyFileSync(file_in_copy, currentLocation + document.getElementById("inputModalInput").value)
                    renderContentView(currentLocation)
                    renderFolderList(currentLocation)
                    terminateCopy()
                }, "New name")
            })
        } else {
            fs.copyFileSync(file_in_copy, currentLocation + path.basename(file_in_copy))
            renderContentView(currentLocation)
            renderFolderList(currentLocation)
            terminateCopy()
        }
    }
    else {
        if (fs.existsSync(currentLocation + path.basename(file_in_copy))) {
            errorModal("Paste error", "In this folder already is a file called " + path.basename(file_in_copy), function () {
                inputModal(function () {
                    fse.copySync(file_in_copy, currentLocation + document.getElementById("inputModalInput").value)
                    renderContentView(currentLocation)
                    renderFolderList(currentLocation)
                    terminateCopy()
                }, "New name")
            })
        } else {
            fse.copySync(file_in_copy, currentLocation + path.basename(file_in_copy))
            renderContentView(currentLocation)
            renderFolderList(currentLocation)
            terminateCopy()
        }
    }
} // ? Paste a file at the currentLocation

function moveFile() {
    if (currentLocation[currentLocation.length - 1] == "\/" || currentLocation[currentLocation.length - 1] == "\\") {
        currentLocation = currentLocation
    }
    else {
        currentLocation = currentLocation + "/"
    }
    if (fs.statSync(file_in_move).isFile()) {
        if (fs.existsSync(currentLocation + path.basename(file_in_move))) {
            errorModal("Paste error", "In this folder already is a file called " + path.basename(file_in_move), function () {
                inputModal(function () {
                    fs.copyFileSync(file_in_move, currentLocation + document.getElementById("inputModalInput").value)
                    renderContentView(currentLocation)
                    renderFolderList(currentLocation)
                    fs.unlinkSync(file_in_move)
                    terminatemove()
                }, "New name")
            })
        } else {
            fs.copyFileSync(file_in_move, currentLocation + path.basename(file_in_move))
            renderContentView(currentLocation)
            renderFolderList(currentLocation)
            fs.unlinkSync(file_in_move)
            terminatemove()
        }
    }
    else {
        if (fs.existsSync(currentLocation + path.basename(file_in_move))) {
            errorModal("Paste error", "In this folder already is a file called " + path.basename(file_in_move), function () {
                inputModal(function () {
                    fse.moveSync(file_in_move, currentLocation + document.getElementById("inputModalInput").value)
                    renderContentView(currentLocation)
                    renderFolderList(currentLocation)
                    terminatemove()
                }, "New name")
            })
        } else {
            fse.moveSync(file_in_move, currentLocation + path.basename(file_in_move))
            renderContentView(currentLocation)
            renderFolderList(currentLocation)
            terminatemove()
        }
    }
} // ? Move a file to the currentLocation. 
// ! There are some differences between file and folder

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

function terminateCopy() {
    file_in_copy = ""
    fadeOut('path_action_indicator', 250)
} // ? Stops the copy

function terminatemove() {
    file_in_move = ""
    fadeOut('path_action_indicator', 250)
} // ? Stops the move

function openTerminalHere() {
    if (localStorage.getItem("terminalCommand") != null) {
        exec(localStorage.getItem("terminalCommand"), { "cwd": currentLocation })
    }
    else {
        exec("cmd", { "cwd": currentLocation })
    }
} // ? Launches the terminal (localStorage)

function terminateDetails() {
    fadeOut("file_details", 250)
} // ? Hide details

function isEncryptedFile(filepath) {
    if (fs.existsSync(filepath) && fs.statSync(filepath).isFile()) {
    fcontent = fs.readFileSync(filepath, {
        "encoding": "utf-8"
    })
    try {
        fcontent_metadata = fcontent.split("HEAD\n")[1].split("\nNOHEAD\n")[0].split(";")
        console.log(fcontent_metadata)
        return (fcontent_metadata[0] == "codelink");
    }
    catch {
        return false;
    }}
    else {
        console.warn("The file you tried to load doesn't exist. ("+filepath+"). isEncryptedFile()")
        return false;
    }
}

function showDetails() {
    document.getElementById("file_details").hidden = false
    document.getElementById("details_filename").innerText = path.basename(context_file)
    extension = ""

    if (fs.statSync(context_file).isFile()) {
        extension = path.basename(context_file).split(".")[path.basename(context_file).split(".").length - 1].toUpperCase()
        size = "~" + Math.round(fs.statSync(context_file).size / (1024 * 1024)) + "MB" + " (" + fs.statSync(context_file).size + "B)"
        if (isEncryptedFile(context_file)) {
            encrypted = "Yes"
        }
        else {
            encrypted = "No"
        }
    }
    else {
        extension = "Folder"
        size = "Not calculated"
        encrypted = "No"
    }
    cdate = fs.statSync(context_file).birthtime.toUTCString()
    mdate = fs.statSync(context_file).mtime.toUTCString()
    document.getElementById("details_filetype").innerText = extension
    document.getElementById("details_filesize").innerText = size
    document.getElementById("details_created").innerText = cdate
    document.getElementById("details_lastmod").innerText = mdate
    document.getElementById("details_encrypted").innerHTML = "Encrypted: " + encrypted
    document.getElementById("details_owner").innerHTML = "Owner UID: " + fs.statSync(context_file).uid
} // ? Show details (context_file)

function encryptionManager() {
    terminateDetails()
    document.getElementById("encryptionManager").hidden = false
    document.getElementById("encryption_filename").innerText = context_file
    if (isEncryptedFile(context_file)) {
        document.getElementById("encryption_status").innerText = "Encrypted"
        document.getElementById("encryption_button").innerText = "Remove encryption"
    }
    else {
        document.getElementById("encryption_status").innerText = "Unencrypted"
        document.getElementById("encryption_button").innerText = "Add encryption"
    }
}

function encryptionSetup() {
    if (isEncryptedFile(context_file)) {
        fadeOut("encryptionManager", 300)
        confirmModal("Remove encryption", "Do you want to remove the encryption from this file?", function () {
            inputModal(function () {
                try {
                ccode = decrypt(JSON.parse(fs.readFileSync(context_file, {
                    "encoding": "binary"
                }).split("\nNOHEAD\n")[1]), document.getElementById("inputModalInput").value)
                fs.writeFileSync(context_file, ccode, {
                    "encoding": "binary"
                })
            }
            catch (e) {
                errorModal("Decryption", "Wrong password", function () {})
                console.error(e)
            }
            }, "Password for decryption")
        })
    }
    else {
        fadeOut("encryptionManager", 300)
        confirmModal("Apply encryption", "When the encryption is applied, you need a password to read and edit the file.\nIt uses AES256. I would recommend choosing a strong password.\nYou're editing the file "+context_file, function () {
            inputModal(function () {
                try {
                ccode = encrypt(fs.readFileSync(context_file, {
                    "encoding": "binary"
                }), document.getElementById("inputModalInput").value)
                fs.writeFileSync(context_file, "HEAD\ncodelink;\nNOHEAD\n"+JSON.stringify(ccode))
            }
            catch (e) {
                errorModal("Encryption failed", "Password was too long or short\nIt has to be 32 chars long", function () {})
                console.error(e)
            }
            }, "Password for encryption (exactly 32 characters)")
        })
    }

}

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
        confirmModalWarning("Remove file", `Do you want to remove <b>${context_file.replace("/", "\\").split("\\")[context_file.replace("/", "\\").split("\\").length - 1]}</b>?`, function () {
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
    this.document.getElementById('contextmenu_copy').onclick = function () {
        file_in_copy = context_file
        document.getElementById('path_action_indicator').innerHTML = "<img src=../images/times.png onclick=terminateCopy()> Copy " + file_in_copy + " <button onclick=pasteFile()>Paste</button>"
        document.getElementById('path_action_indicator').hidden = false
    }
    this.document.getElementById('contextmenu_move').onclick = function () {
        file_in_move = context_file
        document.getElementById('path_action_indicator').innerHTML = "<img src=../images/times.png onclick=terminateMove()> Copy " + file_in_move + " <button onclick=moveFile()>Move</button>"
        document.getElementById('path_action_indicator').hidden = false
    }
    this.document.getElementById('contextmenu_new').onclick = function () { newFile() }
    this.document.getElementById('contextmenu_details').onclick = function () { showDetails() }
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

