currentWorkingTabId = 0;
maxCurrentTabId = 0;

function newTab() {
  document.getElementById("tab" + currentWorkingTabId).hidden = true;
  currentWorkingTabId = maxCurrentTabId + 1;
  maxCurrentTabId++;
  webviewElement = document.createElement("webview");
  webviewElement.id = "tab" + currentWorkingTabId;
  webviewElement.src = "https://www.google.com";
  webviewElement.setAttribute("nwdisable", "");
  document.getElementById("webviewWrapper").appendChild(webviewElement);

  document.getElementById("url").onchange = function () {
    document.getElementById("tab" + currentWorkingTabId).src =
      document.getElementById("url").value;
  };

  document
    .getElementById("tab" + currentWorkingTabId)
    .addEventListener("newwindow", function (e) {
      document.getElementById("tab" + currentWorkingTabId).src = e.targetUrl;
      document.getElementById("url").value = document.getElementById(
        "tab" + currentWorkingTabId
      ).src;
    });

  return webviewElement;
}

function changeTab(id) {
  document.getElementById("tab"+currentWorkingTabId).hidden = true
  currentWorkingTabId = id
  document.getElementById("tab"+currentWorkingTabId).hidden = false
  return id
}


window.onload = function () {
    setInterval(function () {
    if (document.getElementById("url") !== document.activeElement) {
    document.getElementById("url").value = document.getElementById(
      "tab" + currentWorkingTabId
    ).src;}
  }, 250);

  document.getElementById("url").onchange = function () {
    document.getElementById("tab" + currentWorkingTabId).src =
      document.getElementById("url").value;
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
        this.document.getElementById("sideBar").classList.remove("moveOut");
      }, 250);
    }
  });
};
