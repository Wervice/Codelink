const { exec } = require('child_process');
const { error } = require('console');
const { stderr } = require('process');
win = nw.Window.get()
win.height = 435
win.width = 350
function gui_popup(title, text, command) {
    document.getElementById("popup_content").value = ""
    document.getElementById("popup").hidden = false;
    document.getElementById("popup_title").innerHTML = title;
    document.getElementById("popup_text").innerHTML = text;
    document.getElementById("popup_done_button").onclick = command;
}
function openCodeEditor() {
    PopupDeleteOptions()
    if (localStorage.getItem("codeEditor") == null) {
        PopupaddOptions(["code | (Install)", "micro | (Imstall)", "subl | Sublime (Install)", "neovim | (Install)", "vim | (Install)"])
        gui_popup(
            "Editor setup",
            "Please enter a command to run you code editor",
            function () {
                localStorage.setItem("codeEditor", document.getElementById("popup_content").value);
                
                cmd_to_name = {
                    "code": "VS Code",
                    "code.exe": "VS Code",
                    "subl": "Sublime",
                    "subl.exe": "Sublime",
                    "notepad.exe": "Notepad",
                    "start devenv": "Visual Studio",
                    "C:\Program Files\Microsoft Visual Studio 8\Common7\IDE\devenv.exe": "Visual Studio",
                    "https://vscode.dev/": "VS Code Web",
                    "nano": "Nano",
                    "vim": "Vim",
                    "neovim": "NeoVim",
                    "micro": "Micro"
                }
                if (document.getElementById("popup_content").value in cmd_to_name) {
                    appname = cmd_to_name[document.getElementById("popup_content").value]
                    localStorage.setItem("codeEditorName", appname)
                }
                else {
                    gui_popup(
                        "Enter application name",
                        "Please enter the name of your code editor",
                        function () {
                            localStorage.setItem("codeEditorName", document.getElementById("popup_content").value);
                            document.getElementById("popup").hidden = true;
                        }
                    )
                }
                document.getElementById("popup").hidden = true;
                location.reload()
            }
        )
    }
    else {
        try {
            exec(localStorage.getItem("codeEditor"))
        }
        catch {
            document.getElementById("codeEditorError").hidden = false
            document.getElementById("popup_content").hidden = true
            gui_popup("Execution error", "Error code", function () {
                document.getElementById("popup").hidden = true;
                document.getElementById("popup_content").hidden = false;
            })
        }
    }
}

function openTerminal() {
    if (localStorage.getItem("terminalCommand") == null) {
        PopupaddOptions(["wt | Terminal (Install)", "hyper | Hyper.JS (Install)", "cmd | Command Line", "powershell | PowerShell", "cmder | CMDer (Install)"])
        gui_popup("Setup the terminal", "Please enter a commmand to open your terminal. <a href='javascript:learnMoreTerminal()'>Learn more</a>", function () {
            localStorage.setItem("terminalCommand", document.getElementById("popup_content").value)
            document.getElementById("popup").hidden = true;

            exec(localStorage.getItem("terminalCommand").replace("cmd.exe", "start cmd.exe").replace("powershell.exe", "start powershell.exe").replace("cmd", "start cmd").replace("powershell", "start powershell"))
            PopupDeleteOptions()
            location.reload()
        })
    }
    else {
try {
        exec(localStorage.getItem("terminalCommand").replace("cmd.exe", "start cmd.exe").replace("powershell.exe", "start powershell.exe").replace("cmd", "start cmd").replace("powershell", "start powershell"))
}
catch {
    document.getElementById("codeEditorError").hidden = false
    document.getElementById("popup_content").hidden = true
    gui_popup("Execution error", "Error code", function () {
        document.getElementById("popup").hidden = true;
        document.getElementById("popup_content").hidden = false;
    })
}
}
}

function openfileManager() {
    if (localStorage.getItem("fileManger") == null) {
        PopupaddOptions(["explorer", "totalcmd | (Install)"])
        gui_popup(
            "Setup filemanager", "Emter a command that runs you filemanager",
            function () {

                localStorage.setItem("fileManger", document.getElementById("popup_content").value);
                document.getElementById("popup").hidden = true
                exec(document.getElementById("popup_content").value)
                location.reload()
            }
        )
    }
    else {
try {
        exec(localStorage.getItem("fileManger"))
}
catch {
    document.getElementById("codeEditorError").hidden = false
    document.getElementById("popup_content").hidden = true
    gui_popup("Execution error", "Error code", function () {
        document.getElementById("popup").hidden = true;
        document.getElementById("popup_content").hidden = false;
    })
}
    }
}

function search() {
    nw.Window.open("browser.html")
}

function exit() {
    win.close()
}

window.onload = function () {
    code_editor_icon = {
        "VS Code": "images/vscode.png",
        "Sublime": "images/sublime.png",
        "Vim": "images/vim.png",
        "NeoVim": "images/neovim.png",
        "Micro": "images/micro.png"
    }
    if (localStorage.getItem("codeEditorName") != null) {
        if (code_editor_icon[localStorage.getItem("codeEditorName")] != null) {
            document.getElementById("editorIcon").src = code_editor_icon[localStorage.getItem("codeEditorName")]
        }
    }
    if (localStorage.getItem("terminalCommand") != null) {
        termNameList = {
            "hyper": "Hyper",
            "cmd": "CMD",
            "powershell": "Powershell",
            "wt": "Windows Term",
            "cmder": "CMDer"
        }
        if (localStorage.getItem("terminalCommand").split(".")[0] in termNameList) {
            tname = termNameList[localStorage.getItem("terminalCommand").split(".")[0]]
        }
        else {
            tname = "Terminal"
        }
        if (localStorage.getItem("terminalCommand").split(".")[0] in termNameList) {
            icon = "images/" + localStorage.getItem("terminalCommand").split(".")[0] + ".png"
        }
        else {
            icon = "images/terminal.png"
        }
        document.getElementById("TermIcon").src = icon

    }
    if (localStorage.getItem("fileManger") != null) {
        fmname = localStorage.getItem("fileManger")
        fmicons = ["explorer", "totalcmd"]
        fmnames = {
            "explorer": "Explorer",
            "totalcmd": "TotalCommander"
        }
        if (fmname in fmnames) {
            document.getElementById("fileMangerIcon").src = "images/" + fmname + ".png"
        }
    }
    document.onclick = function (e) {
        if (e.target != document.getElementById("selectListGUI")) {
            const listElement = document.getElementById("selectListGUI");
            listElement.hidden = true
        }
    }
    document.getElementById("popup_content").addEventListener("click", function () {
        if (document.getElementById("selectListGUI").innerHTML != "") {
            document.getElementById("selectListGUI").hidden = false
        }
    })
    setTimeout(function () { fadeOut("loadingScreen", 500) }, 980)
}

function shutdown() {
    if (confirm("Do you want to shut down your computer? After clicking you'll get 64 seconds to close and save your files.") == true) {

        exec("shutdown /s /t 64")
    }
}

function PopupaddOptions(options) {
    const listElement = document.getElementById("selectListGUI");
    listElement.innerHTML = ""
    for (option of options) {
        newOption = document.createElement("div")
        newOption.onclick = function () { document.getElementById("popup_content").value = this.innerHTML.split(" ")[0] }
        newOption.textContent = option
        listElement.appendChild(newOption)
    }
    setTimeout(function () { listElement.hidden = false }, 300)

}

// Function to change options
function PopupDeleteOptions() {
    const listElement = document.getElementById("selectListGUI");
    listElement.innerHTML = ""
    listElement.hidden = true
}

function openFileTree() {
    nw.Window.open("filetree/filetree.html")
}

win.x = 1100
win.y = 400