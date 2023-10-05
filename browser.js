const { exec } = require('child_process');
const { exitCode } = require('process');
const fs = require("fs")
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
}

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
    showFavs()
    document.getElementById("favList").hidden = true
}

function showFavs() {
    document.getElementById("favList").innerHTML = "<small style=color:grey;>Bookmarks</small><br>"
    document.getElementById("favList").hidden = !document.getElementById("favList").hidden
    for (link of fs.readFileSync("./favs.txt", {
        "encoding": "utf-8"
    }).split(";")) {
        if (link != "") {
            document.getElementById("favList").innerHTML += "<button onclick=document.getElementById('webview').src='"+link+"' data-link='"+link+"' oncontextmenu=removeFav('"+link+"') title='"+link.slice(0, 60)+"'>" + link.slice(0,60) + "</button>"
        }
    }
}

function removeFav(l) {
    fs.writeFileSync("./favs.txt", fs.readFileSync("./favs.txt", {
        "encoding": "utf-8"
    }).replace(l + ";", ""))
    showFavs()
    document.getElementById("favList").hidden = true
}