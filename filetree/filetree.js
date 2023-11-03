const fs = require("fs");
const os = require("os");
const crypto = require('crypto');
const internal = require("stream");
const compression = require("node:zlib")
const fse = require("fs-extra");
const path = require("path");
const { exec } = require("child_process");
const { createGzip } = require('node:zlib');
const { pipeline } = require('node:stream');
const { cursorTo } = require("readline");
const marked = require('marked');
const bad_link_detect = /(?!```)\[([^\]]+)\]\(([^)]+)\)(?![^`]*```)/gm
const to_dir_link = /(?<!`[^`]*?)#([A-Za-z0-9]+)/g
const fontFamilies = {
    "monospace": '"Fira Code", "Fira Mono", "Consolas", "Ubuntu Mono", monospace',
    "sans-serif": '"Arial", "Calibri", "Ubuntu", sans-serif',
    "serif": 'serif'
}
extensionSort = {
    "png": "image",
    "jpeg": "image",
    "webp": "image",
    "gif": "image",
    "heic": "image",
    "svg": "image",

    "html": "code",
    "css": "code",
    "php": "code",
    "js": "code",
    "py": "code",
    "pyw": "executable",
    "sh": "executable",
    "dll": "executable",
    "exe": "executable",
    "elf": "executable",
    "json": "code",
    "xml": "code",
    "r": "code",
    "mojo": "code",
    "c": "code",
    "cs": "code",
    "cpp": "code",

    "md": "document",
    "doc": "document",
    "docx": "document",
    "pdf": "document",
    "rtf": "document",

    "mp3": "audio",
    "wav": "audio",

    "csv": "spreadsheet",
    "xlsx": "spreadsheet",
    "xls": "spreadsheet",

    "mp4": "video",
    "webv": "video",

    "db": "database",

    "zip": "archive",
    "7z": "archive",
    "tar": "archive",
    "xz": "archive",
    "gz": "archive"
}

var selected_file_id = 0

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
                img_path = "../images/folder_filled.png"
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
    renderNotes(location)
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
                try {
                    if (extensionSort[path.basename(file).split(".")[1]] != "image") {
                        img_path = "../images/file_icons/" + extensionSort[path.basename(file).split(".")[1]] + ".png"
                        if (file == "package.json") {
                            img_path = "../images/package.png"
                        }
                        else if (file == ".gitignore") {
                            img_path = "../images/git.png"
                        }
                        else if (file == "README.md" || file == "readme.md" || file == "README") {
                            img_path = "../images/readme.png"
                        }
                        else if (file == "LICENSE") {
                            img_path = "../images/license.png"
                        }
                    }
                    else if (path.basename(file).split(".")[1] != "gif") {
                        img_path = path.join(location, file)
                    }
                }
                catch {
                    img_path = "../images/file.png"
                }
                s = s + "<button data-filename=\"" + file + "\" onclick=handleFile(\"" + encodeURIComponent(file) + "\") oncontextmenu=makeContext('" + encodeURIComponent(file) + "') onfocus=showPreview(" + encodeURIComponent(file) + ")><img src=\"" + img_path + "\" height=16>" + file + "</button>"
            }
        }
        catch {
            img_path = "../images/adminfile.png"
            s = s + "<button data-filename=\"" + file + "\" onclick=handleFile(\"" + encodeURIComponent(file) + "\") oncontextmenu=makeContext('" + encodeURIComponent(file) + "')><img src=\"" + img_path + "\" height=16>" + file + "</button>"
        }
    }
    document.getElementById("browser_window").innerHTML = s
} // ? Render the content for the folder content view

function showPreview(name) {
    console.warn("Preview not set up yet")
}

function renderNotes(location) {
    notes_list_dom = document.getElementById("notes_list")
    if (fs.existsSync(path.join(location, "codebook"))) {
        html_code = "<button id=new_note onclick=newNote()><img src=../images/new.png> New note</button><br><br>"
        for (e of fs.readdirSync(path.join(location, "codebook"))) {
            html_code += "<button class='notes' onclick=showNote(this) oncontextmenu=addLinkToNote(this)>" + e.split(".")[0] + "</button><button class=activity onclick=deleteNote(this) data-filename=" + encodeURIComponent(e) + "><img src=../images/delete.png height=15></button><br>"
        }
        notes_list_dom.innerHTML = html_code
    }
    else {
        notes_list_dom.innerHTML = "<button id=initNotes title='Setup an instance of Codebooks in this folder&NewLine;This will create an sub directory and some markdown files.&NewLine;You can also gitignore it.' onclick=initNotes()>Init notes in this folder</button>"
    }
} // ? Renders the notes section

function deleteNote(e) {
    confirmModalWarning("Delete note", "Do you want to remove this note?<br>" + decodeURIComponent(e.dataset.filename.split(".")[0]), function () {
        fs.unlinkSync(path.join(currentLocation, "codebook", decodeURIComponent(e.dataset.filename)))
        renderNotes(currentLocation)
        if (decodeURIComponent(e.dataset.filename) == document.getElementById("notes_textarea").value) {
            document.getElementById("notes_title").value = null
            document.getElementById("notes_textarea").value = null
            showMD()
        }
    })
}

list = false
function toggleView() {
    list = !list
    console.log("Toggle view")
    if (list) {
        for (e of document.querySelectorAll("#browser_window button")) {
            e.classList.add("list")
            console.log(e)
        }
    }
    else {
        for (e of document.querySelectorAll("#browser_window button")) {
            e.classList.remove("list")
            console.log(e)
        }
    }
    fs.writeFileSync("toggle_view.txt", list)
}

function renderMDtoHTML() {
    document.getElementById("notes_textarea").hidden = true
    document.getElementById("notes_rendered").innerHTML = marked.marked(document.getElementById("notes_textarea").value.replace(bad_link_detect, "$1").replace(to_dir_link, "[$1](javascript:goToNote('$1'))"))
    document.getElementById("notes_rendered").hidden = false


}

function showMD() {
    document.getElementById("notes_rendered").hidden = true
    document.getElementById("notes_textarea").hidden = false
    document.getElementById("notes_textarea").focus()
}

function newNote() {
    if (document.getElementById("notes_title").value != null && document.getElementById("notes_title").value != "") {
        fs.writeFileSync(path.join(currentLocation, "codebook", document.getElementById("notes_title").value + ".md"), document.getElementById("notes_textarea").value)
    }
    document.getElementById("notes_title").value = null
    document.getElementById("notes_textarea").value = null
    showMD()
    renderNotes(currentLocation)
}

function addLinkToNote(e) {
    document.getElementById("notes_textarea").value += "#" + e.innerHTML
    showMD()
}

function showNote(e) {
    saveNote()
    document.getElementById("notes_rendered").innerHTML = marked.marked(fs.readFileSync(path.join(currentLocation, "codebook", e.innerText + ".md"), {
        "encoding": "utf8"
    }).replace(bad_link_detect, "$1").replace(to_dir_link, "[$1](javascript:goToNote('$1'))"))
    document.getElementById("notes_textarea").value = fs.readFileSync(path.join(currentLocation, "codebook", e.innerText + ".md"), {
        "encoding": "utf8"
    })

    document.getElementById("notes_title").value = e.innerText
    document.getElementById("notes_rendered").hidden = false
    document.getElementById("notes_textarea").hidden = true
}

function goToNote(source) {
    try {
        document.getElementById("notes_rendered").innerHTML = marked.marked(fs.readFileSync(path.join(currentLocation, "codebook", source + ".md"), {
            "encoding": "utf8"
        }).replace(bad_link_detect, "$1").replace(to_dir_link, "[$1](javascript:goToNote('$1'))"))


        document.getElementById("notes_textarea").value = fs.readFileSync(path.join(currentLocation, "codebook", source + ".md"), {
            "encoding": "utf8"
        })
        document.getElementById("notes_title").value = source
        document.getElementById("notes_rendered").hidden = true
        document.getElementById("notes_textarea").hidden = false
    }
    catch {
        renderMDtoHTML()
        errorModal("Note not found", "This note does not exist", function () {

        })
    }
}

function saveNote() {
    if (document.getElementById("notes_title").value != null && document.getElementById("notes_title").value != "") {
        fs.writeFileSync(path.join(currentLocation, "codebook", document.getElementById("notes_title").value + ".md"), document.getElementById("notes_textarea").value)
    } else if (document.getElementById("notes_textarea").value != "") {
        fs.writeFileSync(path.join(currentLocation, "codebook", "Untitled note" + ".md"), document.getElementById("notes_textarea").value)
    }
    renderNotes(currentLocation)
}

function initNotes() {
    if (fs.existsSync(path.join(currentLocation, ".gitignore"))) {
        confirmModal("Gitignore", "Do you want to gitignore codebooks?", function () {
            fs.appendFileSync(path.join(currentLocation, ".gitignore"), "\ncodebook")
        })
    }
    codebook_l = path.join(currentLocation, "codebook")
    fs.mkdirSync(codebook_l)
    fs.writeFileSync(path.join(codebook_l, "main.md"), "", {
        "encoding": "utf-8"
    })
    renderNotes(currentLocation)
    renderFolderList(currentLocation)
}

function changeFontNotes() {
    font = document.getElementById("font_notes").value
    fs.writeFileSync("notes_font.txt", font)
    document.getElementById("notes_rendered").style.fontFamily = fontFamilies[font]
    document.getElementById("notes_textarea").style.fontFamily = fontFamilies[font]
}

function makeContext(filename) {
    filename = decodeURIComponent(filename)
    setTimeout(window.addEventListener("click", function () {
        if (this.document.getElementById("contextmenu").hidden == false) {
            this.setTimeout(function () { this.document.getElementById("contextmenu").hidden = true; }, 20)
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
            inputModal(function () {
                document.getElementById("inputModalInput").value
                try {
                    if (fs.statSync(currentLocation + filename).size < (1024 * 1204 * 5)) {
                        ccode = decrypt(JSON.parse(fs.readFileSync(currentLocation + filename, {
                            "encoding": "binary"
                        }).split("\nNOHEAD\n")[1]), document.getElementById("inputModalInput").value)
                        fs.writeFileSync("decryptedDumpTest." + path.basename(currentLocation + filename).split(".")[path.basename(currentLocation + filename).split(".").length - 1], ccode, {
                            "encoding": "binary"
                        })
                        exec("\"" + "decryptedDumpTest." + path.basename(currentLocation + filename).split(".")[path.basename(currentLocation + filename).split(".").length - 1] + "\"")
                        errorModal("Encryption closing", "Please close the file by clicking Ok, when you've viewed it.", function () {
                            setTimeout(function () {
                                fs.writeFileSync("decryptedDumpTest." + path.basename(currentLocation + filename).split(".")[path.basename(currentLocation + filename).split(".").length - 1], "")
                                fs.unlinkSync("decryptedDumpTest." + path.basename(currentLocation + filename).split(".")[path.basename(currentLocation + filename).split(".").length - 1])
                            })
                        })
                    }
                    else {
                        errorModal("Encrypted file", "This file is encrypted and too large for direct decryption.\nPlease decrypt it manualy and then try again.\nYou can also right click and use open to view the encrypted data.", function () { })
                    }
                }
                catch (e) {
                    errorModal("Decryption", "Wrong password", function () { })
                    console.error(e)
                }
            }, "This file is encrypted. Enter password.")
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

function inputModal(listener, placeholder = "", showDropdown = false, dropdownList = []) {
    document.getElementById("inputModal").hidden = false
    document.getElementById("inputModalInput").placeholder = placeholder
    document.getElementById("inputModalInput").focus()
    document.getElementById("inputModalInput").onkeydown = function (e) {
        if (e.key == "Enter") {
            document.getElementById("loading_wheel").hidden = false
            flyOut("inputModal", 500)
            setTimeout(function () { document.getElementById("inputModalInput").value = "", document.getElementById("inputModalInput").placeholder = "" }, 600)
            listener()
            fadeOut("loading_wheel", 250)
            fadeOut("inputModalDropdown", 250)
        }
    }
    dropdownHTML = ""
    for (e of dropdownList) {
        dropdownHTML += "<button onclick=insertDropdownSelection('" + encodeURIComponent(e) + "')>" + e + "</button>"
    }
    document.getElementById("inputModalDropdown").innerHTML = dropdownHTML
    document.getElementById("inputModalDropdown").hidden = !showDropdown
} // ? Make a text input popup

function insertDropdownSelection(e) {
    document.getElementById("inputModalInput").value = decodeURIComponent(e)
    document.getElementById("inputModalInput").focus()
}

// * Beginning encryption code
//Checking the crypto module
const algorithm = 'aes-256-cbc'; //Using AES encryption

function encrypt(text, key) {
    const iv = crypto.randomBytes(16);
    let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') };
}

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

function commandLine() {
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
            if (newPathFromInput.match(".* from .*") != null && newPathFromInput.split(" from ")[1] != null) {
                fs.writeFileSync(locationused + newPathFromInput.split(" from ")[0], fs.readFileSync(locationused + newPathFromInput.split(" from ")[1], {
                    "encoding": "utf-8"
                }))
                renderContentView(currentLocation)
                renderFolderList(currentLocation)
            }
            else if (newPathFromInput.match("[$]rm .*[.].*") != null && newPathFromInput[0] == "$") {
                errorModal(
                    "Delete file",
                    "Do you want to remove the file " + newPathFromInput.split("remove ")[1] + "?",
                    function () {
                        fs.unlinkSync(locationused + newPathFromInput.split("remove ")[1])
                        renderContentView(currentLocation)
                        renderFolderList(currentLocation)
                    }
                )
            }
            else if (newPathFromInput.match("^[$]find ") != null && newPathFromInput[0] == "$") {
                file_list = []
                folder_list = []
                admin_only = []
                admin_only = []
                file_list_html = ""
                folder_list_html = ""
                query = newPathFromInput.split("find ")[1]
                console.log(query)
                for (file of fs.readdirSync(currentLocation)) {
                    try {
                        if (fs.statSync(currentLocation + "/" + file).isFile()) {
                            if (file.match(query) != null) {
                                file_list.push(file)
                            }
                        }
                        else {
                            if (file.match(query) != null) {
                                folder_list.push(file)
                            }
                        }
                    }
                    catch {
                        admin_only.push(file)
                    }
                }
                for (file of file_list) {
                    try {
                        img_path = "../images/file_icons/" + extensionSort[path.basename(file).split(".")[1]] + ".png"
                    }
                    catch {
                        img_path = "../images/file.png"
                    }
                    file_list_html = file_list_html + "<button data-filename=\"" + file + "\" onclick=handleFile(\"" + encodeURIComponent(file) + "\") oncontextmenu=makeContext('" + encodeURIComponent(file) + "')><img src=\"" + img_path + "\" height=16><br>" + file + "</button>"
                }
                for (folder of folder_list) {
                    img_path = "../images/folder.png"
                    if (file[0] == "." || file[0] == "$") {
                        folder_list_html = folder_list_html + "<button data-filename=\"" + file + "\" oncontextmenu=makeContext(\"" + encodeURIComponent(file) + "\") onclick=handleFile(\"" + encodeURIComponent(file) + "\") style=opacity:70%><img src=\"" + img_path + "\" height=16> " + file + "</button><br>"
                    }
                    else {
                        folder_list_html = folder_list_html + "<button data-filename=\"" + file + "\" oncontextmenu=makeContext(\"" + encodeURIComponent(file) + "\") onclick=handleFile(\"" + encodeURIComponent(file) + "\")><img src=\"" + img_path + "\" height=16> " + file + "</button><br>"
                    }
                }
                setTimeout(function () {
                    document.getElementById("browser_window").innerHTML = file_list_html
                    document.getElementById("folder_list").innerHTML = folder_list_html
                }, 100)
            }
            else if (newPathFromInput.match("^[$]notes") != null && newPathFromInput[0] == "$") {
                if (newPathFromInput == "$notes" || newPathFromInput == "$notes open") {
                    document.getElementById("notes_view").hidden = false
                }
                // ! Dependency list
                // ! Bug tracker
                // ! Use markdown
            }
            else if (newPathFromInput == "$editCss") {
                if (localStorage.getItem("codeEditor") != null) {
                    exec(localStorage.getItem("codeEditor") + " customCSS.css")
                }
                else {
                    exec("notepad customCSS.css")
                }
            }
            else if (newPathFromInput == "$reload") {
                renderContentView(currentLocation)
                renderFolderList(currentLocation)
                renderNotes(currentLocation)
            }
            else if (newPathFromInput == "$terminal") {
                openTerminalHere()
            }
            else if (newPathFromInput.split(" ")[0] == "$b64") {
                if (newPathFromInput.split(" ")[1] != null) {
                    navigator.clipboard.writeText(
                        btoa(fs.readFileSync(path.join(currentLocation, newPathFromInput.split(" ")[1]))))
                    confirmModal("Base64", "Copied string to clipboard", function () { })
                }
                else {
                    confirmModal("Base64", "Please enter a filename to get a base64 value of.")
                }
            }
            else if (newPathFromInput.split(" ")[0] == "$compress") {
                if (newPathFromInput.split(" ")[1] != null) {
                    context_file = path.join(currentLocation, newPathFromInput.split(" ")[1])
                    document.getElementById("compression_manager").hidden = false
                }
                else {
                    confirmModal("Base64", "Please enter a filename to compress.")
                }
            }
            else if (!fs.existsSync(locationused + newPathFromInput) || newPathFromInput.match("^[$]new ") != null) {
                if (newPathFromInput.match("^$new ") != null) {
                    newPathFromInput = newPathFromInput.replace("^$new ", "")
                }
                if (newPathFromInput.includes(".")) {
                    // * File
                    fs.writeFileSync(locationused + newPathFromInput, "")
                }
                else {
                    // * Folder
                    fs.mkdirSync(locationused + newPathFromInput)
                }
                renderContentView(currentLocation)
                renderFolderList(currentLocation)
            }
            else {
                errorModal("File error", "This operation failed", function () { })
            }

        }, "Enter command or filename", true, [
        "$rm",
        "$find",
        "$notes",
        "b from a",
        "$reload",
        "$terminal",
        "$b64",
        "$compress",
        "$editCss"
    ])

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
        }
    }
    else {
        console.warn("The file you tried to load doesn't exist. (" + filepath + "). isEncryptedFile()")
        return false;
    }
}

function showDetails() {
    document.getElementById("file_details").hidden = false
    document.getElementById("details_filename").innerText = path.basename(context_file)
    extension = ""

    try {
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
    }
    catch (e) {
        console.error(e)
        terminateDetails()
        errorModal("Error", e, function () { })
    }
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
                    errorModal("Decryption", "Wrong password", function () { })
                    console.error(e)
                }
            }, "Password for decryption")
        })
    }
    else {
        fadeOut("encryptionManager", 300)
        confirmModal("Apply encryption", "When the encryption is applied, you need a password to read and edit the file.\nIt uses AES256. I would recommend choosing a strong password.\nYou're editing the file " + context_file, function () {
            inputModal(function () {
                try {
                    ccode = encrypt(fs.readFileSync(context_file, {
                        "encoding": "binary"
                    }), document.getElementById("inputModalInput").value)
                    fs.writeFileSync(context_file, "HEAD\ncodelink;\nNOHEAD\n" + JSON.stringify(ccode))
                }
                catch (e) {
                    errorModal("Encryption failed", "Password was too long or short\nIt has to be 32 chars long", function () { })
                    console.error(e)
                }
            }, "Password for encryption (exactly 32 characters)")
        })
    }

}

function compressFile() {
    if (currentLocation[currentLocation.length - 1] == "\/" || currentLocation[currentLocation.length - 1] == "\\") {
        currentLocation = currentLocation
    }
    else {
        currentLocation = currentLocation + "/"
    }
    if (fs.statSync(context_file).isFile()) {
        var gzip = createGzip();
        var source = fs.createReadStream(context_file);
        var destination = fs.createWriteStream(currentLocation + document.getElementById("gzipOutputName").value + ".gz");
        pipeline(source, gzip, destination, (err) => {
            if (err) {
                console.error('An error occurred:', err);
                fadeOut("compression_manager", 125)
                errorModal("Compression failed", "The compression failed", function () { })
            }
            else {
                fadeOut("compression_manager", 125)
                renderContentView(currentLocation)
                renderFolderList(currentLocation)
            }
        });
    }
    else {
        confirmModal("Compression failed", "Folder compression isn't supported right now.", function () { })
    }
}

window.addEventListener("load", function () {
    dataInit()
    setInterval(
        function () {
            document.getElementById("locationNote").innerText = currentLocation
            if (currentLocation[0] != "C") {
                document.getElementById("hdd_ident").hidden = false
            }
            else {
                document.getElementById("hdd_ident").hidden = true
            }
        }, 500
    )
    list = fs.readFileSync("toggle_view.txt").toString() == "true"
    if (list) {
        for (e of document.querySelectorAll("#browser_window button")) {
            e.classList.add("list")
            console.log(e)
        }
    }
    else {
        for (e of document.querySelectorAll("#browser_window button")) {
            e.classList.remove("list")
            console.log(e)
        }
    }
    document.getElementById("notes_rendered").style.fontFamily = fontFamilies[fs.readFileSync("notes_font.txt").toString()]
    document.getElementById("notes_textarea").style.fontFamily = fontFamilies[fs.readFileSync("notes_font.txt").toString()]
    document.getElementById('notes_textarea').addEventListener('keydown', function (e) {
        if (e.key == 'Tab') {
            e.preventDefault();
            var start = this.selectionStart;
            var end = this.selectionEnd;

            // set textarea value to: text before caret + tab + text after caret
            this.value = this.value.substring(0, start) +
                "\t" + this.value.substring(end);

            // put caret at right position again
            this.selectionStart =
                this.selectionEnd = start + 1;
        }
    });
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
                    fs.rmSync(context_file, {
                        "recursive": true,
                        "force": true
                    })
                }
            }
            catch {
                errorModal("Remove failed", "Can't remove this file", function () { })
            }
            renderContentView(currentLocation)
            renderFolderList(currentLocation)
        })
    }
    this.document.getElementById("contextmenu_compress").onclick = function () {
        document.getElementById("compression_manager").hidden = false
    }
    this.document.getElementById('contextmenu_copy').onclick = function () {
        file_in_copy = context_file
        document.getElementById('path_action_indicator').innerHTML = "<img src=../images/times.png onclick=terminateCopy()> Copy " + file_in_copy + " <button onclick=pasteFile()>Paste</button>"
        document.getElementById('path_action_indicator').hidden = false
    }
    this.document.getElementById('contextmenu_move').onclick = function () {
        file_in_move = context_file
        document.getElementById('path_action_indicator').innerHTML = "<img src=../images/times.png onclick=terminatemove()> Copy " + file_in_move + " <button onclick=moveFile()>Move</button>"
        document.getElementById('path_action_indicator').hidden = false
    }
    this.document.getElementById('contextmenu_new').onclick = function () { commandLine() }
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
        this.document.getElementById("contextmenu").hidden = true
        fadeOut("inputModalDropdown", 250)
        fadeOut("notes_view", 250)
    }
    else if (e.key == "+" && e.ctrlKey) {
        commandLine()
    }
    else if (e.key == "l" && e.ctrlKey) {
        this.document.getElementById("pathInput").focus()
    }
    else if (e.key == "r" && e.ctrlKey) {
        renderContentView(currentLocation)
        renderFolderList(currentLocation)
    }
    else if (e.key == "r" && e.ctrlKey && e.shiftKey) {
        this.location.reload()
    }
    else if (e.key == "ArrowDown") {
        if (this.document.getElementById("notes_view").hidden) {
            if (currentLocation[currentLocation.length - 1] == "\/" || currentLocation[currentLocation.length - 1] == "\\") {
                currentLocation = currentLocation
            }
            else {
                currentLocation = currentLocation + "/"
            }
            selected_file_id = selected_file_id + 1
            if (selected_file_id < 0 || this.document.querySelectorAll("#browser_window button").length < selected_file_id) {
                selected_file_id = 0
            }
            for (e of this.document.querySelectorAll("#browser_window button")) {
                e.style.background = "#191919"
            }
            this.document.querySelector("#browser_window button:nth-child(" + selected_file_id + ")").style.background = "#0570db"
            this.document.querySelector("#browser_window button:nth-child(" + selected_file_id + ")").focus()
        }
    }
    else if (e.key == "ArrowUp") {
        if (this.document.getElementById("notes_view").hidden) {
            selected_file_id = selected_file_id - 1
            if (selected_file_id < 0 || this.document.querySelectorAll("#browser_window button").length < selected_file_id) {
                selected_file_id = 0
            }
            for (e of this.document.querySelectorAll("#browser_window button")) {
                e.style.background = "#191919"
            }
            this.document.querySelector("#browser_window button:nth-child(" + selected_file_id + ")").style.background = "#0570db"
            this.document.querySelector("#browser_window button:nth-child(" + selected_file_id + ")").focus()
        }
    }
})