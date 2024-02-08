const fs = require("fs");

win = nw.Window.get();

if (!fs.existsSync("tin/cookies.txt")) {
  fs.writeFileSync("tin/cookies.txt", "[]");
}

currentWorkingTabId = 0;
maxCurrentTabId = 0;
tablist = ["0"];

function toggleBookmark() {
  bookmarkList = fs
    .readFileSync("tin/favs.txt")
    .toString("utf-8")
    .split(";");
  if (
    fs
      .readFileSync("tin/favs.txt")
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
  fs.writeFileSync("tin/favs.txt", bookmarkListText.toString());
}

function renderTabList() {

  setTimeout(function () {
    renderedTabList = "";
    eid = 0;
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
              titleToUse =
                "Loading " + document.getElementById("tab" + element).src;
            } else {
              titleToUse = new DOMParser().parseFromString(
                result,
                "text/html"
              ).title;
              if (titleToUse.length > 35) {
                titleToUse = titleToUse.slice(0, 32) + "...";
              }
            }
            renderedTabList +=
              `<button class=tab onclick=changeTab(` +
              (function () {
                return tablist[eid];
              })() +
              `)>` +
              titleToUse +
              ` </button><img src=\"../images/times.png\" onclick=closeTab("${tablist[eid]}")><br>`;
            eid++;

            console.log(result);
            if (eid == tablist.length) {
              document.getElementById("tablist").innerHTML = renderedTabList;
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
  }, 500);
  // ! "e" stays the same?
}

snUrlsList = {
  newtab: "",
};

function newTab() {
  try {
    document.getElementById("tab" + currentWorkingTabId).hidden = true;
  } catch { }
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
  renderTabList();
  document.querySelector("#tab" + id).remove();
  document.getElementById("tab" + tablist[0]).hidden = false;
  currentWorkingTabId = tablist[0];
}

// ! S**t start

/*
document.getElementById("tab0").executeScript({
        code: `document.title`
      }, result => {
        console.log(result)
      })
*/

// ! S**t end

function renderBookmarkList() {
  bookmarkList = fs
    .readFileSync("tin/favs.txt")
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
  setInterval(function () {
    if (document.getElementById("sideBar").hidden == true) {
      renderTabList();
    }
  }, 2000);

  setInterval(function () {
    renderTabList();
  }, 6000);
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
        .readFileSync("browser/favs.txt")
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
    if (
      e.key == "Escape" &&
      this.document.getElementById("sideBar").hidden == false
    ) {
      this.document.getElementById("sideBar").classList.add("moveOut");
      this.document.querySelector("#sideBar div.tooltip").classList.add("moveOut");
      this.setTimeout(function () {
        this.document.getElementById("sideBar").hidden = true;
        this.document.getElementById("sideBarButton").hidden = false;
        document.getElementById("protectionOverlay").hidden = true;
        this.document.getElementById("sideBar").classList.remove("moveOut");
        this.document.querySelector("#sideBar div.tooltip").classList.remove("moveOut");
      }, 250);
    } else if (
      e.key == "Escape" &&
      !this.document.getElementById("bookmarkWindow").hidden
    ) {
      this.setTimeout(function () {
        this.document.getElementById("bookmarkWindow").hidden = true;
        this.document.getElementById("bookmarkWindow").classList.remove("fadeOut")
      }, 250)
      this.document.getElementById("bookmarkWindow").classList.add("fadeOut")
      this.document.getElementById("protectionOverlay").hidden = true;
    } else if (
      e.key == "b" &&
      this.document.activeElement.tagName != "INPUT" &&
      this.document.activeElement.tagName != "INPUT"
    ) {
      if (this.document.getElementById("bookmarkWindow").hidden) {
        this.document.getElementById("bookmarkList").innerHTML =
          renderBookmarkList();
        this.document.getElementById("bookmarkWindow").hidden = false;
        this.document.getElementById("protectionOverlay").hidden = false;
      } else {
        this.setTimeout(function () {
          this.document.getElementById("bookmarkWindow").hidden = true;
          this.document.getElementById("bookmarkWindow").classList.remove("fadeOut")
        }, 250)
        this.document.getElementById("bookmarkWindow").classList.add("fadeOut")
        this.document.getElementById("protectionOverlay").hidden = true;
      }
    }
  });
};
