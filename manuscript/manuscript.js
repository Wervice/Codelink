const fs = require("fs")
const path = require("path")
const os = require("os")
const marked = require("marked")
const hljs = require("highlight.js")
const { exec } = require("child_process")
const { cursorTo } = require("readline")
win = nw.Window.get()
const manuDir = path.join(os.homedir(), "manuscript")


win.setMinimumSize(790, 400)
function renderNotesList() {
    notes_list = fs.readdirSync(path.join(os.homedir(), "manuscript"))
    notes_list_html = "<button id=newNoteButton><img src='../images/new.png'> New</button>"
    for (note of notes_list) {
        try {
            if (fs.statSync(path.join(manuDir, note)).isFile())
                notes_list_html += "<button onclick=openNote('" + encodeURIComponent(note) + "');selectButtonHighlight(this) class=noteButton>" + note.split(".")[0].replace("<", "&lt;").replace(">", "&gt;") + "</button><img src='../images/delete_white.svg' onclick=deleteNote('" + encodeURIComponent(note) + "')>"
        }
        catch (e) {
            console.error(e)
        }
    }
    document.getElementById("notes_list").innerHTML = notes_list_html

}

function openInBrowser(url) {
    url = decodeURIComponent(url)
    if (os.platform() == "win32") {
        exec("explorer \"\"" + url + "\"\"")
    }
    else {
        exec("xdg-open \"" + url + "\"")
    }
}

function selectButtonHighlight(e) {
    for (button of document.querySelectorAll("#notes_list button")) {
        button.classList.remove("selected")
    }
    e.classList.add("selected")
}

function replaceNoteLinks(inputString) {
    return inputString.replace(/(?<!<code>.*)(\[\[([^[\]]+)\]\])(?!.*<\/code>)/g, function (match, noteName) {
        var encodedNoteName = encodeURIComponent(noteName.replace("[[", "").replace("]]", ""));
        return "<button class='noteLink' onclick=\"openNote('" + encodedNoteName + ".md" + "')\">" + noteName.replace("[[", "").replace("]]", "") + "</button>";
    });
}

function openNote(name) {
    if (fs.existsSync(path.join(manuDir, decodeURIComponent(name)))) {
    name = decodeURIComponent(name)
    currentNote = name.split(".")[0]
    for (button of document.querySelectorAll("#notes_list button")) {
        if (button.innerHTML == name.split(".")[0]) {
            selectButtonHighlight(button)
        }
    }
    document.getElementById("noteName").value = name.split(".")[0]
    document.getElementById("notes_view_source").value = fs.readFileSync(path.join(os.homedir(), "manuscript", name)).toString()
    d_parser_o = new DOMParser()
    d_parser = d_parser_o.parseFromString(marked.marked(fs.readFileSync(path.join(os.homedir(), "manuscript", name)).toString()), "text/html")
    for (e of d_parser.querySelectorAll("code")) {
        e.innerHTML = hljs.highlightAuto(e.innerHTML).value
    }
    for (e of d_parser.querySelectorAll("a")) {
        if (e.href.includes("javascript:")) {
            alert("This link tries to run JavaScript. It was blocked.")
        }
        // ! DO NOT COMBINE
        if (new URL(e).protocol == "http:" || new URL(e).protocol == "https:") {
            e.href = "javascript:openInBrowser('" + encodeURIComponent(e) + "')"
        }
        else {
            e.href = "javascript:openNote('" + encodeURIComponent(e) + "')"

        }
    }
    d_parser.querySelectorAll('*').forEach(element => {
        Array.from(element.attributes).forEach(attribute => {
            if (attribute.name.startsWith('on')) {
                element.removeAttribute(attribute.name);
                contained_js = true
            }
        });
    });
    d_parser.body.innerHTML = replaceNoteLinks(d_parser.body.innerHTML)
    html_code_prepared = d_parser.body.innerHTML
    document.getElementById("notes_view_rendered").innerHTML = html_code_prepared
    document.getElementById("notes_view_source").hidden = true
    document.getElementById("notes_view_rendered").hidden = false
}
else {
    confirmModal("Create note", "This note doesn't exist yet. Do you want to create it?", function(){
        fs.writeFileSync(fs.existsSync(path.join(manuDir, name)), "")
    })
}
}

function deleteNote(name) {
    name = decodeURIComponent(name)
    confirmModalWarning("Delete note", "Do you want to delete this note?", function () {
        fs.unlinkSync(path.join(manuDir, name))
        renderNotesList()
    })
    document.getElementById("notes_view_source").value = ""
    document.getElementById("notes_view_rendered").innerHTML = ""
    document.getElementById("noteName").value = ""
}

function saveNote() {
    if (document.getElementById("noteName").value != "" && document.getElementById("noteName").value != null) {
        fs.writeFileSync(path.join(os.homedir(), "manuscript", document.getElementById("noteName").value + ".md"), document.getElementById("notes_view_source").value)
    }
    renderNotesList()
    for (button of document.querySelectorAll("#notes_list button")) {
        if (button.innerHTML == currentNote) {
            selectButtonHighlight(button)
        }
    }
}

window.addEventListener("load", function () {
    dataInit()
    if (fs.existsSync(path.join(os.homedir(), "manuscript"))) {
        renderNotesList()
    }
    else {
        fs.mkdirSync(path.join(os.homedir(), "manuscript"))
        renderNotesList()
    }
    this.document.getElementById("notes_view_source").addEventListener("blur", function () {
        saveNote()
        openNote(currentNote+".md")
    })
    this.document.getElementById("notes_view_rendered").addEventListener("click", function (e) {
        if (e.target.tagName === 'BUTTON' || e.target.tagName === 'button' || e.target.tagName === 'A' || e.target.tagName === 'a') {
            openNote(encodeURIComponent(e.target.innerHTML+".md"))
            return;
        }
        document.getElementById("notes_view_source").hidden = false
        document.getElementById("notes_view_rendered").hidden = true
        document.getElementById("notes_view_source").focus()

    })
    this.document.getElementById("newNoteButton").addEventListener("click", function () {
        saveNote()
        document.getElementById("notes_view_source").value = ""
        document.getElementById("notes_view_rendered").innerHTML = ""
        document.getElementById("noteName").value = ""
    })
    this.document.getElementById("notes_view_source").addEventListener("keydown", saveNote)
    this.document.getElementById("noteName").addEventListener("change", saveNote)
})