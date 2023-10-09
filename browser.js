const { exec } = require('child_process');
const { exitCode } = require('process');
const fs = require("fs");
const { urlToHttpOptions } = require('url');
const { hostname } = require('os');
const langCodes = {
    "Python": "19",
    "JavaScript": "22",
    "Java": "23",
    "C++": "16",
    "C#": "6",
    "Ruby": "32",
    "Swift": "137",
    "Go": "55",
    "PHP": "24",
    "Rust": "147",
    "Kotlin": "145",
    "TypeScript": "151",
    "Perl": "51",
    "Haskell": "40",
    "Scala": "47",
    "Lua": "54",
    "Objective-C": "21",
    "Dart": "88",
    "Elixir": "186",
    "R": "",
    "Clojure": "104",
    "SQL": "37",
    "Assembly": "344",
    "COBOL": "89",
}
win = nw.Window.get()
win.width = 700
win.height = 600
window.onload = function () {
    document.getElementById("url").addEventListener("keydown", function (e) {
        if (e.key == "Enter") {
            if (document.getElementById("url").value.includes("https://") || document.getElementById("url").value.includes("http://")) {
                url = document.getElementById("url").value
            }
            else if (document.getElementById("url").value.includes(" ")) {
                query = document.getElementById("url").value

                url = "https://www.google.com/search?q=" + encodeURIComponent(query)
            }
            else if (document.getElementById("url").value == "~") {
                url = "https://www.google.com"
            }
            else if (document.getElementById("url").value == "~stack") {
                url = "https://www.stackoverflow.com"
            }
            else if (document.getElementById("url").value == "~searchcode") {
                url = "https://searchcode.com"
            }
            else if (!document.getElementById("url").value.includes(".")) {
                query = document.getElementById("url").value

                url = "https://www.google.com/search?q=" + encodeURIComponent(query)
            }
            else {
                url = "https://" + document.getElementById("url").value
            }
            document.getElementById("webview").src = url
        }
    })
    document.getElementById("webview").addEventListener("change", function () {
        document.getElementById("url").value = document.getElementById("webview").src
    })
    urla = ""
    urlb = ""
    setInterval(function () {
        urla = document.getElementById("webview").src
        if (urla != urlb) {
            document.getElementById("url").value = document.getElementById("webview").src.split("//")[1]
            curl = document.getElementById("webview").src
        }
        urlb = document.getElementById("webview").src
        if (new URL(document.getElementById("webview").src).protocol == "https:") {
            document.getElementById("sslIndicator").src = "images/ssl.png"
        }
        else {
            document.getElementById("sslIndicator").src = "images/nossl.png"
        }
        if (fs.readFileSync("./favs.txt", {
            "encoding": "utf-8"
        }).split(";").includes(document.getElementById("webview").src)) {
            document.getElementById("bookmarkIcon").src = "images/bookmark.png"
        }
        else {
            document.getElementById("bookmarkIcon").src = "images/nobookmark.png"
        }
    }, 100)
    document.getElementById("url").addEventListener("click", function () {
        document.getElementById("url").value = curl
    })
    document.getElementById("url").addEventListener("blur", function () {
        document.getElementById("url").value = document.getElementById("webview").src.split("//")[1]
    })
    window.addEventListener("keydown", function (e) {
        if (e.key == "b" && e.ctrlKey) {
            showFavs()
        }
        else if (e.key == "r" && e.ctrlKey) {
            document.getElementById("webview").src = curl
        }
        else if (e.key == "w" && e.ctrlKey) {
            exec("start " + curl)
        }
        else if (e.key == "q" && e.ctrlKey) {
            window.close()
        }
        else if (e.key == "s" && e.ctrlKey) {
            launchBugAssistant()
        }
    })

    if (
        localStorage.getItem("browserSetup") == undefined
    ) {
        document.getElementById("intro").hidden = false
    }

}

// !! Window onload end

function openInNewBrowser() {
    exec("start " + document.getElementById("webview").src)
}

function addToFavs() {
    if (fs.readFileSync("./favs.txt", {
        "encoding": "utf-8"
    }).split(";").includes(document.getElementById("webview").src)) {
        fs.writeFileSync("./favs.txt", fs.readFileSync("./favs.txt", {
            "encoding": "utf-8"
        }).replace(curl + ";", ""))
        document.getElementById("bookmarkIcon").src = "images/nobookmark.png"
    }
    else {
        fs.writeFileSync("./favs.txt", fs.readFileSync("./favs.txt", {
            "encoding": "utf-8"
        }) + curl + ";")
        document.getElementById("bookmarkIcon").src = "images/bookmark.png"
    }
    reloadFav()
}

function showFavs() {
    document.getElementById("favList").innerHTML = "<small style=color:grey;>Bookmarks</small><br>"
    document.getElementById("favList").hidden = !document.getElementById("favList").hidden
    for (link of fs.readFileSync("./favs.txt", {
        "encoding": "utf-8"
    }).split(";")) {
        if (link != "") {
            url_no_prot = link.slice(0, 30).replace(/(^\w+:|^)\/\//, '')
            document.getElementById("favList").innerHTML += "<button onclick=document.getElementById('webview').src='" + link + "' data-link='" + link + "' oncontextmenu=removeFav('" + link + "') title='" + link.slice(0, 60) + "'>" + url_no_prot + "</button>"
        }
    }
}

function reloadFav() {
    document.getElementById("favList").innerHTML = "<small style=color:grey;>Bookmarks</small><br>"
    for (link of fs.readFileSync("./favs.txt", {
        "encoding": "utf-8"
    }).split(";")) {
        if (link != "") {
            url_no_prot = link.slice(0, 30).replace(/(^\w+:|^)\/\//, '')
            document.getElementById("favList").innerHTML += "<button onclick=document.getElementById('webview').src='" + link + "' data-link='" + link + "' oncontextmenu=removeFav('" + link + "') title='" + link.slice(0, 60) + "'>" + url_no_prot + "</button>"
        }
    }
}

function removeFav(l) {
    fs.writeFileSync("./favs.txt", fs.readFileSync("./favs.txt", {
        "encoding": "utf-8"
    }).replace(l + ";", ""))
    reloadFav()
}

function launchBugAssistant() {
    document.getElementById("bug_assistant").hidden = false
}

function terminateBugAssistant() {
    document.getElementById("bug_assistant").hidden = true
}

function countWordsFastSearch() {
    if (document.getElementById("information_fast").value.split(" ").length > 15) {
        res = "<font style=color:red>" + String(document.getElementById("information_fast").value.split(" ").length - 1) + "</font>"
    }
    else {
        res = document.getElementById("information_fast").value.split(" ").length - 1
    }
    res = res + "<br>"
    document.getElementById("wordCounter_fast").innerHTML = res
}

function startSearchFast() {
    problemDescription = document.getElementById("information_fast").value
    languageUsed = document.getElementById("language_fast").value
    if (languageUsed != "default") {
        query = problemDescription + " \"" + languageUsed + "\" OR title:" + problemDescription + " OR \":" + problemDescription + "\" " + languageUsed + " OR site:stackoverflow.com " + problemDescription + " " + languageUsed
        document.getElementById("webview").src = "https://www.google.com/search?q=" + encodeURIComponent(query)
    }
    else {
        languageUsed = ""
        for (language of ["Python", "JavaScript", "Java", "C++", "C#", "Ruby", "Swift", "Go", "PHP", "Rust", "Kotlin", "TypeScript", "Perl", "Haskell", "Scala", "Lua", "Objective-C", "Dart", "Elixir", "R", "Clojure", "SQL", "Assembly", "COBOL"]) {
            if (document.getElementById("information_fast").value.toLocaleLowerCase().includes(language.toLocaleLowerCase() + " ") || document.getElementById("information_fast").value.toLocaleLowerCase().includes(" " + language.toLocaleLowerCase())) {
                if (language.length != 1) {
                    languageUsed = language
                }
            }
        }
        query = problemDescription + " \"" + languageUsed + "\" OR title:" + problemDescription + " OR \":" + problemDescription + "\" " + languageUsed + " OR site:stackoverflow.com " + problemDescription + " " + languageUsed
        document.getElementById("webview").src = "https://www.google.com/search?q=" + encodeURIComponent(query)
    }
    terminateBugAssistant()
}

function startSearchAdvanced() {
    programmingLanguage = document.getElementById("language_advanced").value
    programmingLanguageVersion = document.getElementById("language_version_advanced").value
    errorDescription = document.getElementById("error_description_advanced").value
    errorDescriptionCode = document.getElementById("error_code_advanced").value
    frameworkName = document.getElementById("framework_advanced").value
    query = errorDescription + " \"" + errorDescriptionCode + "\" " + programmingLanguage + " " + programmingLanguageVersion + " " + frameworkName
    document.getElementById("webview").src = "https://www.google.com/search?q=" + encodeURIComponent(query)
    terminateBugAssistant()
}

function setBugFixerMode(mode) {
    if (mode == "fast") {
        document.getElementById("search_fast").hidden = false
        document.getElementById("search_advanced").hidden = true
    }
    else if (mode == "advanced") {
        document.getElementById("search_fast").hidden = true
        document.getElementById("search_advanced").hidden = false
    }
}

