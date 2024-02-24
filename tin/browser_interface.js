const fs = require("fs");
const process = require("process")
const path = require("path");
const { homedir } = require("os");

if (process.platform == "linux") {
  if (!fs.existsSync(path.join(homedir(), ".config", "tinBrowser"))) {
    fs.mkdirSync(path.join(homedir(), ".config", "tinBrowser"))
  }
  tinDir = path.join(homedir(), ".config", "tinBrowser")
}
else if (process.platform == "win32") {
  if (!fs.existsSync(path.join(homedir(), "tinBrowser"))) {
    fs.mkdirSync(path.join(homedir(), "tinBrowser"))
  }
  tinDir = path.join(homedir(), "tinBrowser")
}

if (!fs.existsSync(path.join(tinDir, "homepage.txt"))) {
  fs.writeFileSync(path.join(tinDir, "homepage.txt"), "https://www.startpage.com/do/mypage.pl?prfe=a8ecf6b9d27d67a707d672f5dd887d6869535572440d9200dcee54295e95c58afbfbc555a4555d3cfd7d074401a17b7f6bb89dc9e8960f9927d706acd7986e57d6e0975984463cd4d2627973")
}
if (!fs.existsSync(path.join(tinDir, "favs.txt"))) {
  fs.writeFileSync(path.join(tinDir, "favs.txt"), "https://wervice.github.io/;https://www.startpage.com/do/mypage.pl?prfe=a8ecf6b9d27d67a707d672f5dd887d6869535572440d9200dcee54295e95c58afbfbc555a4555d3cfd7d074401a17b7f6bb89dc9e8960f9927d706acd7986e57d6e0975984463cd4d2627973;https://stackoverflow.com")
}
if (!fs.existsSync(path.join(tinDir, "theme.txt"))) {
  fs.writeFileSync(path.join(tinDir, "theme.txt"), "gray")
}

win = nw.Window.get();

win.on("blur", function () {
  window.document.getElementById("sideBarButton").focus()
})

currentWorkingTabId = 0;
maxCurrentTabId = 0;
tablist = ["0"];
commandList = [
  "New tab",
  "Go back",
  "Go next",
  "Reload page",

  "Toggle bookmark",
  "List bookmarks",
  "Open tablist",

  "Always on top On",
  "Always on top Off",

  "Theme Nord",
  "Theme Catppuccin",
  "Theme Gray",
  "Set homepage " + new URL(fs.readFileSync(path.join(tinDir, "homepage.txt")).toString()).hostname,

  "Close app",
  "Reload app",

  "Help"
]
homepage = fs.readFileSync(path.join(tinDir, "homepage.txt")).toString()

function toggleBookmark() {
  bookmarkList = fs.readFileSync(path.join(tinDir, "favs.txt")).toString("utf-8").split(";");
  if (
    fs
      .readFileSync(path.join(tinDir, "favs.txt"))
      .toString("utf-8")
      .includes(
        new URL(document.getElementById("tab" + currentWorkingTabId).src)
          .hostname +
        new URL(document.getElementById("tab" + currentWorkingTabId).src)
          .pathname +
        new URL(document.getElementById("tab" + currentWorkingTabId).src)
          .search
      )
  ) {
    bookmarkList.splice(
      bookmarkList.indexOf(
        document.getElementById("tab" + currentWorkingTabId).src
      ),
      1
    );
  } else {
    bookmarkList.push(document.getElementById("tab" + currentWorkingTabId).src);
  }
  bookmarkListText = "";
  for (e of bookmarkList) {
    if (e != "") {
      bookmarkListText += e + ";";
    }
  }
  fs.writeFileSync(path.join(tinDir, "favs.txt"), bookmarkListText.toString());
}

function renderTabList() {
    var renderedTabList = "";
    var eid = 0;
    for (element of tablist) {
      console.log(element);
      try {
        console.log(element);
        document.getElementById("tab" + element).executeScript(
          {
            code: `document.documentElement.innerHTML`,
          },
          (result) => {
            if (
              new DOMParser().parseFromString(result, "text/html").title == ""
            ) {
              var titleToUse =
                "Loading " + document.getElementById("tab" + element).src;
            } else {
              var websiteObject = new DOMParser().parseFromString(
                result,
                "text/html"
              )
              var titleToUse = websiteObject.title.replaceAll("<", "&lt").replaceAll(">", "&gt");
              if (titleToUse.length > 33) {
                var titleToUse = titleToUse.slice(0, 23) + "...";
              }

              // TODO Icons dont work yet
              /*
              try {
                iconURL = "https://" + new URL(document.getElementById("tab" + tablisteid).src).hostname + "/" + new URL(websiteObject.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]')[0].href).pathname.replace("tin/", "").replace(null, "")
              } catch (err) {
                console.log(websiteObject)
                console.log(err)
                iconURL = "../images/file.png"
              } */

              renderedTabList +=
                `<button class=tab onclick=changeTab(` +
                (function () {
                  return tablist[eid];
                })() +
                `)>` + // `<img src=${iconURL} onerror=this.src='../images/file.png'>  ` +
                titleToUse +
                ` </button><img src=\"../images/times.png\" onclick=closeTab("${tablist[eid]}")><br>`;
              eid++;

              console.log(result);
              if (eid == tablist.length) {
                document.getElementById("tablist").innerHTML = renderedTabList;
              }
            }
          }
        );
        
      } catch (err) {
        console.log(err);
      }
    }
    if (document.activeElement != document.getElementById("url")) {
      document.getElementById("url").value = document.getElementById(
        "tab" + currentWorkingTabId
      ).src;
    }
  // ! "e" stays the same?
}

function newTab() {
  try {
    document.getElementById("tab" + currentWorkingTabId).hidden = true;
  } catch { }
  currentWorkingTabId = maxCurrentTabId + 1;
  maxCurrentTabId++;
  webviewElement = document.createElement("webview");
  webviewElement.id = "tab" + currentWorkingTabId;
  webviewElement.src = homepage
  webviewElement.setAttribute("nwdisable", "");
  document.getElementById("webviewWrapper").appendChild(webviewElement);
  tablist.push(String(currentWorkingTabId));

  document.getElementById("url").onchange = function () {
    try {
      if (!document.getElementById("url").value.includes("http")) {
        document.getElementById("tab" + currentWorkingTabId).src =
          "https://" + document.getElementById("url").value;
      } else {
        document.getElementById("tab" + currentWorkingTabId).src =
          document.getElementById("url").value;
      }
    } catch (err) {
      console.error(err)
    }
  };

  document
    .getElementById("tab" + currentWorkingTabId)
    .addEventListener("newwindow", (e) => {
      document.getElementById("tab" + currentWorkingTabId).src = e.targetUrl;
    });

  document
    .getElementById("tab" + currentWorkingTabId)
    .addEventListener("newwindow", function (e) {
      document.getElementById("tab" + currentWorkingTabId).loadURL(e.targetUrl);
      document.getElementById("url").value = document.getElementById(
        "tab" + currentWorkingTabId
      ).src;
    });

  document.getElementById("tab" + currentWorkingTabId).onloadstop = function (e) {
    document.getElementById("tab" + currentWorkingTabId).insertCSS(
      {
        code:
          `
      ::-webkit-scrollbar {
        width: 5px;
      }
      
      ::-webkit-scrollbar-track {
        background: #222; 
      }
      
      ::-webkit-scrollbar-thumb {
        background: #444;
        border-radius: 5px;
      }
      
      ::-webkit-scrollbar-thumb:hover {
        background: #777; 
      }`}
    )
    renderTabList()
  }
  // setTimeout(function () { renderTabList() }, 500)
  return webviewElement;
}


function changeTab(id) {
  document.getElementById("tab" + currentWorkingTabId).hidden = true;
  currentWorkingTabId = id;
  document.getElementById("tab" + currentWorkingTabId).hidden = false;
  return id;
}

function closeTab(id) {
  document.getElementById("tab" + id).hidden = true;
  if (tablist.length == 1) {
    newTab();
  }
  tablist.splice(tablist.indexOf(id), 1);
  renderTabList();
  document.querySelector("#tab" + id).remove();
  document.getElementById("tab" + tablist[0]).hidden = false;
  currentWorkingTabId = tablist[0];
}

function renderBookmarkList() {
  bookmarkList = fs.readFileSync(path.join(tinDir, "favs.txt")).toString("utf-8").split(";");
  bookmarkListRendered = "";

  for (e of bookmarkList) {
    if (e.length > 0) {
      if (new URLSearchParams(new URL(e).search).get("q") != null) {
        searchQ = " (Search " + new URLSearchParams(new URL(e).search).get("q") + ") "
      }
      else {
        searchQ = ""
      }

      bookmarkListRendered +=
        `<button onclick="document.getElementById('tab'+currentWorkingTabId).src = '${e}'"><b>` +
        new URL(e).hostname.replace("www.", "") +
        `</b>` +
        new URL(e).pathname + searchQ +
        `</button><br>`;
    }
  }
  document.getElementById("bookmarkSearch").focus()
  return bookmarkListRendered;
}

function hideOpenModals() {
  if (this.document.getElementById("sideBar").hidden == false) {
    this.document.getElementById("sideBar").classList.add("moveOut");
    this.document
      .querySelector("#sideBar div.tooltip")
      .classList.add("moveOut");
    this.setTimeout(function () {
      this.document.getElementById("sideBar").hidden = true;
      this.document.getElementById("sideBarButton").hidden = false;
      document.getElementById("protectionOverlay").hidden = true;
      this.document.getElementById("sideBar").classList.remove("moveOut");
      this.document
        .querySelector("#sideBar div.tooltip")
        .classList.remove("moveOut");
    }, 250);
  } else if (!this.document.getElementById("bookmarkWindow").hidden) {
    this.setTimeout(function () {
      this.document.getElementById("bookmarkWindow").hidden = true;
      this.document
        .getElementById("bookmarkWindow")
        .classList.remove("fadeOut");
    }, 250);
    this.document.getElementById("bookmarkWindow").classList.add("fadeOut");
    this.document.getElementById("protectionOverlay").hidden = true;
  }
}

const checkKeyPress = function () {
  console.log("Triggered 200 Inrterval");
  document
    .getElementById("tab" + currentWorkingTabId)
    .executeScript({ code: `keyD == "true"` }, (result) => {
      console.log(result);
    });
};

function changeTheme(theme) {
  document.getElementById("themeLink").href = "themes/" + theme + ".css"
}

window.onclick = function () {
}

window.onblur = function () {
}

window.onload = function () {
  document.getElementById("tab0").onloadstop = function () {
    document.getElementById("tab0").insertCSS(
      {
        code:
          `
  ::-webkit-scrollbar {
    width: 5px;
  }
  
  ::-webkit-scrollbar-track {
    background: #222; 
  }
  
  ::-webkit-scrollbar-thumb {
    background: #444;
    border-radius: 5px;
  }
  
  ::-webkit-scrollbar-thumb:hover {
    background: #777; 
  }`}
    )
    renderTabList()
  }
  if (!fs.existsSync(path.join(tinDir, "satUp.txt"))) {
    document.getElementById("help").hidden = false
    fs.writeFileSync(path.join(tinDir, "satUp.txt"), "yeah, 'f course")
  }

  document.getElementById("tab0").src = homepage
  changeTheme(fs.readFileSync(path.join(tinDir, "theme.txt")).toString())
  commandPalletPickerI = -1

  document
    .getElementById("tab" + currentWorkingTabId)
    .addEventListener("newwindow", (e) => {
      document.getElementById("tab" + currentWorkingTabId).src = e.targetUrl;
    });

  document.getElementById("url").onchange = function () {
    document.getElementById("tab" + currentWorkingTabId).src =
      document.getElementById("url").value;
    renderTabList();
  };

  document
    .getElementById("bookmarkSearch")
    .addEventListener("keyup", function () {
      bookmarkList = fs
        .readFileSync(path.join(tinDir, "favs.txt"))
        .toString("utf-8")
        .split(";");
      bookmarkListRendered = "";
      for (e of bookmarkList) {
        if (
          e.length > 0 &&
          e.includes(document.getElementById("bookmarkSearch").value)
        ) {
          bookmarkListRendered +=
            `<button onclick="document.getElementById('tab'+currentWorkingTabId).src = '${e}'"><b>` +
            new URL(e).hostname.replace("www.", "") +
            `</b>` +
            new URL(e).pathname +
            `</button><br>`;
        }
      }

      document.getElementById("bookmarkList").innerHTML = bookmarkListRendered;
    });

  window.addEventListener("keydown", function (e) {
    console.log(e.key);
    if (e.key == "Escape" && !this.document.getElementById("sideBar").hidden) {
      this.document.getElementById("sideBar").classList.add("moveOut");
      this.document
        .querySelector("#sideBar div.tooltip")
        .classList.add("moveOut");
      this.setTimeout(function () {
        this.document.getElementById("sideBar").hidden = true;
        this.document.getElementById("sideBarButton").hidden = false;
        document.getElementById("protectionOverlay").hidden = true;
        this.document.getElementById("sideBar").classList.remove("moveOut");
        this.document
          .querySelector("#sideBar div.tooltip")
          .classList.remove("moveOut");
      }, 250);
    } else if (
      e.key == "Escape" &&
      !this.document.getElementById("bookmarkWindow").hidden
    ) {
      this.setTimeout(function () {
        this.document.getElementById("bookmarkWindow").hidden = true;
        this.document
          .getElementById("bookmarkWindow")
          .classList.remove("fadeOut");
      }, 250);
      this.document.getElementById("bookmarkWindow").classList.add("fadeOut");
      this.document.getElementById("protectionOverlay").hidden = true;
    } else if (e.key == "b" && this.document.activeElement.tagName != "INPUT") {
      if (this.document.getElementById("bookmarkWindow").hidden) {
        this.document.getElementById("bookmarkList").innerHTML =
          renderBookmarkList();
        this.document.getElementById("bookmarkWindow").hidden = false;
        this.document.getElementById("protectionOverlay").hidden = false;
      } else {
        this.setTimeout(function () {
          this.document.getElementById("bookmarkWindow").hidden = true;
          this.document
            .getElementById("bookmarkWindow")
            .classList.remove("fadeOut");
        }, 250);
        this.document.getElementById("bookmarkWindow").classList.add("fadeOut");
        this.document.getElementById("protectionOverlay").hidden = true;
      }
    } else if (
      e.key == " " &&
      this.document.activeElement.tagName != "INPUT" &&
      this.document.getElementById("commandPallet").hidden
    ) {
      this.document.getElementById("commandPallet").hidden = false;
      document.querySelector("#commandPallet input").focus()
      setTimeout(function () {
        document.querySelector("#commandPallet input").value = ""
      }, 200)
    } else if (
      e.key == "Escape" &&
      !this.document.getElementById("commandPallet").hidden
    ) {
      this.setTimeout(function () {
        this.document.getElementById("commandPallet").hidden = true;
        this.document
          .getElementById("commandPallet")
          .classList.remove("fadeOut");
      }, 250);
      this.document.getElementById("commandPallet").classList.add("fadeOut");
      this.document.getElementById("protectionOverlay").hidden = true;
    } else if (e.key == "t" && this.document.getElementById("sideBar").hidden && this.document.activeElement.tagName != "INPUT") {
      document.getElementById("sideBar").hidden = false;
      this.hidden = true;
      document.getElementById("protectionOverlay").hidden = false;
      renderTabList();
    } else if (e.key == "ArrowDown" && !this.document.getElementById("commandPallet").hidden) {
      try {
        if (commandPalletPickerI > document.getElementById("commandList").children.length - 1) {
          commandPalletPickerI = -1
        }
        commandPalletPickerI = commandPalletPickerI + 1
        console.log(commandPalletPickerI)
        items = document.getElementById('commandList').children
        items.item(commandPalletPickerI).focus()
      }
      catch {
        commandPalletPickerI = 0
        items = document.getElementById('commandList').children
        items.item(commandPalletPickerI).focus()
      }

    } else if (e.key == "ArrowUp" && !this.document.getElementById("commandPallet").hidden) {
      try {
        if (commandPalletPickerI < 1) {
          commandPalletPickerI = commandList.length
        }
        commandPalletPickerI = commandPalletPickerI - 1
        console.log(commandPalletPickerI)
        items = document.getElementById('commandList').children
        items.item(commandPalletPickerI).focus()
      }
      catch {
        commandPalletPickerI = document.getElementById('commandList').children.length - 1
        items = document.getElementById('commandList').children
        items.item(commandPalletPickerI).focus()
      }
    }
    else if (e.key == "Escape" && !this.document.getElementById("help").hidden) {
      this.document.getElementById("help").hidden = true
    }
  });

  document.querySelector("#commandPallet input").addEventListener("keyup", function (e) {
    if (e.key != "Enter" && e.key != "ArrowDown" && e.key != "ArrowUp") {
      html_list = ""
      for (entry of commandList) {
        if (entry.toLowerCase().includes(document.querySelector("#commandPallet input").value.toLowerCase())) {
          html_list += `<button onclick="document.querySelector('#commandPallet input').value=this.innerText;document.querySelector('#commandPallet input').focus()">` + entry + "</button>"
        }
      }
      document.getElementById("commandList").innerHTML = html_list
    }
    else if (e.key == "Enter") {
      if (document.querySelector("#commandPallet input").value == "New tab") {
        newTab()
      }
      else if (document.querySelector("#commandPallet input").value == "Close app") {
        if (confirm("Do you want to close this tab?")) {
          process.exit(0)
        }
      }
      else if (document.querySelector("#commandPallet input").value.includes("Set homepage ")) {
        if (document.querySelector("#commandPallet input").value.split("Set homepage ")[1].includes("http")) {
          homepage = document.querySelector("#commandPallet input").value.split("Set homepage ")[1]
          fs.writeFileSync(path.join(tinDir, "homepage.txt"), document.querySelector("#commandPallet input").value.split("Set homepage ")[1])
        }
        else {
          homepage = "https://" + document.querySelector("#commandPallet input").value.split("Set homepage ")[1]
          fs.writeFileSync(path.join(tinDir, "homepage.txt"), "https://" + document.querySelector("#commandPallet input").value.split("Set homepage ")[1])
        }
      }
      else if (document.querySelector("#commandPallet input").value.match(new RegExp(/[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/)) != null) {
        document.getElementById("tab" + currentWorkingTabId).src = document.querySelector("#commandPallet input").value
      }
      else if (document.querySelector("#commandPallet input").value == "Toggle bookmark") {
        toggleBookmark()
      }
      else if (document.querySelector("#commandPallet input").value == "Go back") {
        document.getElementById('tab' + currentWorkingTabId).back(); // renderTabList()
      }
      else if (document.querySelector("#commandPallet input").value == "Go next") {
        document.getElementById('tab' + currentWorkingTabId).forward(); // renderTabList()
      }
      else if (document.querySelector("#commandPallet input").value == "Reload page") {
        document.getElementById('tab' + currentWorkingTabId).reload();
      }
      else if (document.querySelector("#commandPallet input").value == "List bookmarks") {
        document.getElementById("bookmarkList").innerHTML = renderBookmarkList();
        document.getElementById("bookmarkWindow").hidden = false;
        document.getElementById("protectionOverlay").hidden = false;
      }
      else if (document.querySelector("#commandPallet input").value == "Open tablist") {
        document.getElementById("sideBar").hidden = false;
        document.getElementById("protectionOverlay").hidden = false;
        renderTabList();
      }
      else if (document.querySelector("#commandPallet input").value == "Reload app") {
        location.reload()
      }
      else if (document.querySelector("#commandPallet input").value == "Always on top On") {
        win.setAlwaysOnTop(true)
      }
      else if (document.querySelector("#commandPallet input").value == "Always on top Off") {
        win.setAlwaysOnTop(false)
      }
      else if (document.querySelector("#commandPallet input").value == "Help") {
        document.getElementById("help").hidden = false
      }
      else if (document.querySelector("#commandPallet input").value.includes("Theme ")) {
        changeTheme(document.querySelector("#commandPallet input").value.split("Theme ")[1].toLowerCase().replace(" ", "_"))
        fs.writeFileSync(path.join(tinDir, "theme.txt"), document.querySelector("#commandPallet input").value.split("Theme ")[1].toLowerCase().replace(" ", "_"))
      }

      setTimeout(function () {
        document.getElementById("commandPallet").hidden = true;
        document
          .getElementById("commandPallet")
          .classList.remove("fadeOut");
      }, 250);
      document.getElementById("commandPallet").classList.add("fadeOut");
      document.getElementById("protectionOverlay").hidden = true;

    }
  })
};


/*
? Vim-ish small browser for quick and simple searches.
? Content focused UI with shortcut support
? No history => ⭐Privacy⭐
*/