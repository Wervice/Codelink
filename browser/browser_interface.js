const fs = require("fs");

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
    bookmarkList.includes(
      document.getElementById("tab" + currentWorkingTabId).src
    )
  ) {
    console.log("A");
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

async function renderTabList() {
  renderedTabList = "";
  for (e of tablist) {
    try {
      renderedTabList +=
        `<button class=tab onclick=changeTab(${e})>` +
        (await magicTitle(document.getElementById("tab" + e).src)) +
        `</button><img src=\"../images/times.png\" onclick=closeTab("${e}")><br>`;
    } catch (e) {
      console.log(e);
    }
  }
  document.getElementById("url").value = document.getElementById(
    "tab" + currentWorkingTabId
  ).src;
  document.getElementById("tablist").innerHTML = renderedTabList;
}

snUrlsList = {
  newtab: "",
};

async function newTab() {
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

  document.getElementById(
    "tablist"
  ).innerHTML += `<button class=tab onclick=changeTab("${currentWorkingTabId}")>Google (google.com)</button> <img src="../images/times.png" onclick=closeTab("${currentWorkingTabId}")>`;
  await renderTabList();

  document.getElementById("url").onchange = async function () {
    document.getElementById("tab" + currentWorkingTabId).src =
      document.getElementById("url").value;
    await renderTabList();
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

async function closeTab(id) {
  document.getElementById("tab" + id).hidden = true;
  if (tablist.length == 1) {
    newTab();
  }
  tablist.splice(tablist.indexOf(id), 1);
  document.querySelector("#tab" + id).remove();
  document.getElementById("tab" + tablist[0]).hidden = false;
  currentWorkingTabId = tablist[0];
  await renderTabList();
}

async function magicTitle(str) {
  url = new URL(str);
  try {
    response = await fetch(str.replace(url.search, "")).then();
    if (await response.ok) {
      rp = new DOMParser();
      rpo = rp.parseFromString(await response.text(), "text/html");
      title = rpo.querySelector("title").innerHTML;
    }
    if (new URLSearchParams(url.search).get("q") != null) {
      title = new URLSearchParams(url.search).get("q");
    }
  } catch {
    title = "Can't load page";
  }

  if (title.length < 20) {
    return (
      title.replace("<", "&lt;").replace(">", "&gt;") +
      " (" +
      url.hostname
        .replace("www.", "")
        .replace("<", "&lt;")
        .replace(">", "&gt;") +
      ")"
    );
  } else {
    return title.replace("<", "&lt;").replace(">", "&gt;");
  }
}

window.onload = function () {
  document
    .getElementById("tab" + currentWorkingTabId)
    .addEventListener("newwindow", (e) => {
      document.getElementById("tab" + currentWorkingTabId).src = e.targetUrl;
    });

  renderTabList();

  document.getElementById("url").onchange = async function () {
    document.getElementById("tab" + currentWorkingTabId).src =
      document.getElementById("url").value;
    await renderTabList();
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
    }
  });
};
