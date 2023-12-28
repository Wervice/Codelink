const fs = require("fs");
const { setInterval } = require("timers/promises");

win = nw.Window.get();

if (!fs.existsSync("browser/cookies.txt")) {
  fs.writeFileSync("browser/cookies.txt", "[]");
}

currentWorkingTabId = 0;
maxCurrentTabId = 0;
tablist = ["0"];

function toggleBookmark() {
  bookmarkList = fs
    .readFileSync("browser/favs.txt")
    .toString("utf-8")
    .split(";");
  if (
    fs
      .readFileSync("browser/favs.txt")
      .toString("utf-8")
      .includes(
        new URL(document.getElementById("tab" + currentWorkingTabId).src)
          .hostname +
          new URL(document.getElementById("tab" + currentWorkingTabId).src)
            .pathname
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
  fs.writeFileSync("browser/favs.txt", bookmarkListText.toString());
}

function renderTabList() {
  // ! "e" stays the same?

  renderedTabList = "";

  for (element of tablist) {
    try {
      setupWebviewInteraction( // ! <- Function, Bro, you're messing something up here
      // * The code is running multiple times
      // * If you execute it wthout setupWebview..., it works just fine
        
        document.getElementById("tab" + element),
        (receivedData) => {
          renderedTabList +=
            `<button class=tab onclick=changeTab(${element})>` +
            new DOMParser().parseFromString(receivedData.doc, "text/html")
              .title +
            ` </button><img src=\"../images/times.png\" onclick=closeTab("${element}")><br>`;
          document.getElementById("tablist").innerHTML = renderedTabList;
        
      }
      );
    } catch (err) {
      console.log(err);
    }
  }
  document.getElementById("url").value = document.getElementById(
    "tab" + currentWorkingTabId
  ).src;
}

snUrlsList = {
  newtab: "",
};

function newTab() {
  try {
    document.getElementById("tab" + currentWorkingTabId).hidden = true;
  } catch {}
  currentWorkingTabId = maxCurrentTabId + 1;
  maxCurrentTabId++;
  webviewElement = document.createElement("webview");
  webviewElement.id = "tab" + currentWorkingTabId;
  webviewElement.src = "https://www.google.com";
  webviewElement.setAttribute("nwdisable", "");
  document.getElementById("webviewWrapper").appendChild(webviewElement);

  tablist.push(String(currentWorkingTabId));

  renderTabList();

  document.getElementById("url").onchange = function () {
    document.getElementById("tab" + currentWorkingTabId).src =
      document.getElementById("url").value;
    renderTabList();
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
  document.querySelector("#tab" + id).remove();
  document.getElementById("tab" + tablist[0]).hidden = false;
  currentWorkingTabId = tablist[0];
  renderTabList();
}

// ! S**t start

function setupWebviewInteraction(webviewElement, onDataReceived) {
  // <webview> Content is loaded
  function contentLoad() {
    // The following will be injected into the webview
    const webviewInjectScript = `
      var data = {
        doc: document.documentElement.innerHTML,
      };

      function respond(event) {
        event.source.postMessage(data, '*');
      }

      window.addEventListener("message", respond, false);
    `;

    webviewElement.executeScript({
      code: webviewInjectScript,
    });
  }

  // <webview> Loading has finished
  function loadStop() {
    webviewElement.contentWindow.postMessage("Send me your data!", "*"); // Send a request to the webview
  }

  // Bind events
  webviewElement.addEventListener("contentload", contentLoad);
  webviewElement.addEventListener("loadstop", loadStop);

  // Listen for response
  window.addEventListener("message", receiveHandshake, false);

  function receiveHandshake(event) {
    // Data is accessible as event.data.*
    // This is the custom object that was injected during contentLoad()
    // i.e., event.data.title, event.data.url

    // Invoke the provided callback with the received data
    onDataReceived(event.data);

    // Unbind EventListeners
    removeListeners();
  }

  // Remove all event listeners
  function removeListeners() {
    webviewElement.removeEventListener("contentload", contentLoad);
    webviewElement.removeEventListener("loadstop", loadStop);
    window.removeEventListener("message", receiveHandshake);
  }
}

// Usage example:

// ! S**t end

function renderBookmarkList() {
  bookmarkList = fs
    .readFileSync("browser/favs.txt")
    .toString("utf-8")
    .split(";");
  bookmarkListRendered = "";
  for (e of bookmarkList) {
    if (e.length > 0) {
      bookmarkListRendered +=
        `<button onclick="document.getElementById('tab'+currentWorkingTabId).src = '${e}'"><b>` +
        new URL(e).hostname.replace("www.", "") +
        `</b>` +
        new URL(e).pathname +
        `</button><br>`;
    }
  }

  return bookmarkListRendered;
}

window.onload = function () {
  document
    .getElementById("tab" + currentWorkingTabId)
    .addEventListener("newwindow", (e) => {
      document.getElementById("tab" + currentWorkingTabId).src = e.targetUrl;
    });

  renderTabList();

  document.getElementById("url").onchange = function () {
    document.getElementById("tab" + currentWorkingTabId).src =
      document.getElementById("url").value;
    renderTabList();
  };

  window.addEventListener("keydown", function (e) {
    if (
      e.key == "Escape" &&
      this.document.getElementById("sideBar").hidden == false
    ) {
      this.document.getElementById("sideBar").classList.add("moveOut");
      this.setTimeout(function () {
        this.document.getElementById("sideBar").hidden = true;
        this.document.getElementById("sideBarButton").hidden = false;
        document.getElementById("protectionOverlay").hidden = true;
        this.document.getElementById("sideBar").classList.remove("moveOut");
      }, 250);
    } else if (
      e.key == "Escape" &&
      !this.document.getElementById("bookmarkWindow").hidden
    ) {
      this.document.getElementById("bookmarkWindow").hidden = true;
      this.document.getElementById("protectionOverlay").hidden = true;
    } else if (e.key == "b") {
      if (this.document.getElementById("bookmarkWindow").hidden) {
        this.document.getElementById("bookmarkList").innerHTML =
          renderBookmarkList();
        this.document.getElementById("bookmarkWindow").hidden = false;
        this.document.getElementById("protectionOverlay").hidden = false;
      } else {
        this.document.getElementById("bookmarkWindow").hidden = true;
        this.document.getElementById("protectionOverlay").hidden = true;
      }
    }
  });
};
