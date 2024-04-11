// Global variables
// TODO Send proper http status codes !!!!!
currFPath = "/";

// Windows events

window.onclick = function () {
  document.getElementById("contextmenu").hidden = true;
};

window.addEventListener("mousemove", function (e) {
  mouseX = e.pageX;
  mouseY = e.pageY;
});

window.onload = function () {
  dataInit();
  setCPUBar();
  setRAMBar();
  setDiskBar();
  getDriveList();
  getUserList();
  renderFiles(currFPath);
  document
    .querySelector("#contextmenu #deleteButton")
    .addEventListener("click", function () {
      confirmModal("Delete", "Do you want to proceed", function () {
        fetch("/api", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            path: contextFMenuFile,
            r: "deleteFile",
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data["status"] == "s") {
              renderFiles(currFPath);
            } else {
              alert("Can not delete this file");
            }
          });
        renderFiles(currFPath);
      });
    });

  document
    .querySelector("#contextmenu #renameButton")
    .addEventListener("click", function () {
      confirmModal(
        "Rename",
        "Filename<br><br><input type='text' id='renameNameInput'>",
        function () {
          var newFileName = document.getElementById("renameNameInput").value;
          fetch("/api", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              path: contextFMenuFile,
              newName: currFPath + newFileName,
              r: "renameFile",
            }),
          })
            .then((res) => res.json())
            .then((data) => {
              if (data["status"] == "s") {
                renderFiles(currFPath);
              } else {
                alert("Can not rename this file");
              }
            });
          renderFiles(currFPath);
        },
      );
    });
};

// Intervals

setInterval(function () {
  setCPUBar();
  setRAMBar();
  setDiskBar();
  getDriveList();
}, 10000);

// Functions

// Status bars (Dashboard)

function setCPUBar() {
  fetch("/api?r=cpuPercent", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((res) => {
      if (!res.ok) {
        failPopup("Failed to fetch CPU status");
        throw new Error("Failed to fetch CPU status");
      }
      return res.json();
    })
    .then((data) => {
      document.getElementById("cpu_bar").style.width =
        Math.floor(Number(data["p"] * 2)) + "px";
      document.getElementById("cpu_bar").title =
        "CPU " + Math.round(data["p"]) + "%";
    });
}

function setRAMBar() {
  fetch("/api?r=ramPercent", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((res) => {
      if (!res.ok) {
        failPopup("Failed to fetch RAM status");
        throw new Error("Failed to fetch RAM status");
      }
      return res.json();
    })
    .then((data) => {
      document.getElementById("ram_bar").style.width =
        Math.floor(Number(data["p"]) * 2) + "px";
      document.getElementById("ram_bar").title =
        "RAM " + Math.round(data["p"]) + "%";
    });
}

function setDiskBar() {
  fetch("/api?r=diskPercent", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((res) => {
      if (!res.ok) {
        failPopup("Failed to fetch Disk status");
        throw new Error("Failed to fetch Disk status");
      }
      return res.json();
    })
    .then((data) => {
      document.getElementById("disk_bar").style.width =
        Math.floor(Number(data["p"]) * 2) + "px";
      document.getElementById("disk_bar").title =
        "Disk " + Math.round(data["p"]) + "%";
    });
}

function getDriveList() {
  fetch("/api?r=driveList", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((res) => {
      if (!res.ok) {
        failPopup("Failed to fetch disk list");
        throw new Error("Failed to fetch disk list");
      }
      return res.json();
    })
    .then((data) => {
      var htmlCode = "";
      for (drive of Array.from(data["drives"])) {
        var childrenHtmlCode = "";
        if (drive["children"] != null) {
          for (child of drive["children"]) {
            var childrenHtmlCode =
              childrenHtmlCode +
              `<button class="drive" onclick="driveInformationModal('${child["name"]}')">${child["name"]}</button>`;
          }
          var htmlCode =
            htmlCode +
            `<button class="drive" onclick="driveInformationModal('${drive["name"]}')">${drive["name"]}</button>${childrenHtmlCode}`;
        } else {
          var htmlCode =
            htmlCode +
            `<button class="drive" onclick="driveInformationModal('${drive["name"]}')">${drive["name"]}</button>`;
        }
      }
      document.getElementById("disks").innerHTML = htmlCode;
    });
}

function getUserList() {
  fetch("/api", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      r: "userList",
    }),
  })
    .then((res) => {
      if (!res.ok) {
        failPopup("Failed to fetch list of users");
        throw new Error("Failed to fetch list of users");
      }
      return res.json();
    })
    .then((data) => {
      document.getElementById("usersTable").innerHTML = data["text"];
    });
}

// User management

function deleteUser(username) {
  if (confirm(`Do you want to delete ${username}?`)) {
    fetch("/api", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: username,
        r: "deleteUser",
      }),
    })
      .then((res) => {
        if (!res.ok) {
          failPopup("Failed to delete user");
          throw new Error("Failed to delete user");
        }
        return res.json();
      })
      .then((data) => {
        getUserList();
      });
  }
}

function addNewUser() {
  document.getElementById("newUserModal").hidden = false;
}

function submitNewUser() {
  fetch("/api", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      r: "newUser",
      username: "",
      password: "",
      userChoosesPassword: false,
    }),
  })
    .then((res) => {
      if (!res.ok) {
        failPopup("Failed to submit new user");
        throw new Error("Failed to submit new user");
      }
      return res.json();
    })
    .then((data) => {
      // TODO Missing
    });
}

// Interface

function changePage(pageName) {
  for (page of document.querySelectorAll("#pages > div")) {
    console.log(page);
    if (page.id != pageName) {
      page.hidden = true;
    } else {
      page.hidden = false;
    }
  }

  if (pageName == "applications" && typeof allApps == "undefined") {
    renderApplicationManagerList();
  }
  if (pageName == "connections") {
    fetchFTPconnectionInformation();
  }
  if (pageName == "users") {
    getUserList();
  }
}

// Files / Stroage

function renderFiles(path) {
  fetch("/api", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      path: path,
      showHiddenFiles: document.getElementById("showHiddenFiles").checked,
      r: "filesRender",
    }),
  })
    .then((res) => {
      if (!res.ok) {
        failPopup("Failed to fetch list of files");
        throw new Error("Failed to fetch list of files");
      }
      return res.json();
    })
    .then((data) => {
      document.getElementById("filesContainer").innerHTML = data["content"];
    });
}

function navigateFolder(file) {
  currFPath = currFPath + file + "/";
  renderFiles(currFPath);
}

function downloadFile(file) {
  window.open("/api?r=callfile&file=" + btoa(currFPath + file));
}

function goFUp() {
  if (currFPath != "/") {
    currFPathReps = currFPath.split("/")[currFPath.split("/").length - 2] + "/";
    currFPath = currFPath.replace(currFPathReps, "");
    renderFiles(currFPath);
  }
}

function contextMenuF(filename) {
  document.getElementById("contextmenu").hidden = false;
  document.getElementById("contextmenu").style.top = mouseY + "px";
  document.getElementById("contextmenu").style.left = mouseX + "px";
  contextFMenuFile = currFPath + filename;
}

function driveInformationModal(driveName) {
  fetch("/api", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      r: "driveInformation",
      driveName: driveName,
    }),
  })
    .then((res) => {
      if (!res.ok) {
        failPopup("Failed to fetch drive information");
        throw new Error("Failed to fetch drive information");
      }
      return res.json();
    })
    .then((data) => {
      document.getElementById("driveName").innerText = data["drives"]["name"];
      document.getElementById("driveModel").innerText =
        data["drives"]["model"] == null ? "N/A" : data["drives"]["model"];
      document.getElementById("driveSize").innerText =
        data["drives"]["size"] == null
          ? "N/A"
          : Math.floor(Number(data["drives"]["size"]) / 1073741824) + " GB" ==
              "0 GB"
            ? data["drives"]["size"] + " B"
            : Math.floor(Number(data["drives"]["size"]) / 1073741824) + " GB";
      document.getElementById("driveMountpoint").innerText =
        data["drives"]["mountpoint"] == null
          ? "N/A"
          : data["drives"]["mountpoint"];
      document.getElementById("drivePath").innerText =
        data["drives"]["path"] == null ? "N/A" : data["drives"]["path"];
      document.getElementById("driveMounted").innerHTML = driveName.includes(
        "sda",
      )
        ? "True"
        : data["drives"]["mountpoint"] != null
          ? "True"
          : "False";
      document.getElementById("driveUssage").innerHTML = "N/A";
      for (drive of data["ussage"]) {
        if (drive["mounted"] == data["drives"]["mountpoint"]) {
          document.getElementById("driveUssage").innerHTML = drive["capacity"];
        }
      }

      document.getElementById("driveModal").hidden = false;
    });
}

// Packages

function renderApplicationManagerList() {
  fetch("/api", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      r: "packageDatabase",
    }),
  })
    .then((res) => {
      if (!res.ok) {
        failPopup("Failed to fetch package list");
        throw new Error("Failed to fetch package list");
      }
      return res.json();
    })
    .then((data) => {
      var responseJSON = JSON.parse(data["content"]);
      guiApps = responseJSON["gui"]; // ? Installed & has GUI
      anyApps = responseJSON["any"]; // ? Installed and can have GUI
      allApps = responseJSON["all"]; // ? All packages in the DB
      document.getElementById("loadingApplications").hidden = true;
      document.getElementById("packageSearchResults").hidden = true;
      document.getElementById("installedPackagesDetails").hidden = false;
      document.getElementById("installedAppsDetails").hidden = false;
      console.log(guiApps);
      var htmlCode = "";
      for (e of Array.from(guiApps)) {
        if (e != undefined) {
          var htmlCode =
            htmlCode +
            "<div class='package'><img src='" +
            e[1] +
            "'><br>" +
            e[0].split(".")[0].replace("-", " ") +
            "<br><button class='remove_package' onclick='removePackage(\"" +
            e[2] +
            "\", this)'>Remove</button></div>";
          console.log(e[1]);
        }
      }
      document.getElementById("installedApps").innerHTML = htmlCode;

      var htmlCode = "";
      for (e of Array.from(anyApps)) {
        if (e.length != 0) {
          if (e != undefined) {
            var htmlCode =
              htmlCode +
              "<div class='package_small'>" +
              e.split(".")[0].replace("-", " ") +
              "<button class='remove_package' onclick='removePackage(\"" +
              e +
              "\", this)'>Remove</button></div>";
            console.log(e[1]);
          }
        }
      }
      document.getElementById("installedPackages").innerHTML = htmlCode;
    });
}

function lookForPackage() {
  var packageName = document.getElementById("packageSearch").value;
  if (packageName != "" && packageName != null) {
    document.getElementById("packageSearchResults").hidden = false;
    document.getElementById("installedPackagesDetails").hidden = true;
    document.getElementById("installedAppsDetails").hidden = true;
    var htmlCode = "";
    if (packageName.length > 2) {
      for (e of anyApps) {
        if (e.includes(packageName)) {
          var htmlCode =
            htmlCode +
            `<div class=package_small>${e.split(".")[0]} <button class=remove_package onclick=\"removePackage('${e}', this)\">Remove</button></div>`;
        }
      }

      for (e of allApps) {
        if (e.includes(packageName)) {
          var htmlCode =
            htmlCode +
            `<div class=package_small>${e.split(".")[0]} <button class=install_package onclick=\"installPackage('${e}', this)\">Install</button></div>`;
        }
      }
    }
    document.getElementById("packageSearchResults").innerHTML = htmlCode;
  } else {
    document.getElementById("packageSearchResults").hidden = true;
    document.getElementById("installedPackagesDetails").hidden = false;
    document.getElementById("installedAppsDetails").hidden = false;
  }
}

function removePackage(packageName, button) {
  confirmModal(
    "Remove app",
    "<input type='password' placeholder='SUDO Password' id='sudoPasswordInput'>",
    function () {
      button.innerHTML = "In work";
      button.disabled = true;
      fetch("/api", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          r: "removePackage",
          packageName: packageName,
          sudoPassword: document.getElementById("sudoPasswordInput").value,
        }),
      })
        .then((res) => {
          if (!res.ok) {
            failPopup("Failed to remove package");
            button.innerHTML = "Failed";
            button.disabled = false;
            button.style.color = "rgb(255, 75, 75);";
            throw new Error("Failed to remove package");
          }
          return res.json();
        })
        .then((data) => {
          renderApplicationManagerList();
        });
    },
  );
}

function installPackage(packageName, button) {
  confirmModal(
    "Install package",
    "<input type='password' placeholder='SUDO Password' id='sudoPasswordInput'>",
    function () {
      button.innerHTML = "In work";
      button.disabled = true;
      fetch("/api", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          r: "installPackage",
          packageName: packageName,
          sudoPassword: document.getElementById("sudoPasswordInput").value,
        }),
      })
        .then((res) => {
          if (!res.ok) {
            failPopup("Failed to install package");
            button.innerHTML = "Failed";
            button.disabled = false;
            button.style.color = "rgb(255, 75, 75);";
            throw new Error("Failed to install package");
          }
          return res.json();
        })
        .then((data) => {
          renderApplicationManagerList();
        });
    },
  );
}

// Network

// FTP

function updateFTPConnectionSettings() {
  var enableFTP = document.getElementById("enableFTP").checked;
  var FTPlocalRoot = document.getElementById("ftpLocalRoot").value;
  var ftpUserUsername = document.getElementById("ftpUserUsername").value;
  var ftpUserPassword = document.getElementById("ftpUserPassword").value;

  if (ftpUserPassword.length == 0) {
    document.getElementById("ftpUserPassword").focus();
    return;
  }

  inputModal(
    "Sudo password",
    "Please enter your sudo password to change these settings",
    "sudoPasswordFTP",
    "password",
    function () {
      // TODO Not yet reading the sudo password
      document.getElementById("ftpSettingsApply").innerText = "Updating";
      fetch("/api", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          r: "updateFTPconfig",
          enableFTP: enableFTP,
          ftpLocalRoot: FTPlocalRoot,
          ftpUserUsername: ftpUserUsername,
          ftpUserPassword: ftpUserPassword,
          sudo: document.getElementById("sudoPasswordFTP").value,
        }),
      })
        .then((res) => {
          if (!res.ok) {
            res.json().then(function (jsonResponse) {
              document.getElementById("ftpSettingsApply").innerHTML =
                "Failed (retry)";
              document.getElementById("ftpError").innerHTML =
                jsonResponse["details"];
              failPopup("Failed to update FTP configuration");
              throw new Error("Failed to update FTP configuration");
            });
          } else {
            document.getElementById("ftpError").innerHTML = "";
          }
          return res.json(); // ! The JSON is empty => Fix on server side!!!!
        })
        .then((data) => {
          fetchFTPconnectionInformation();
          document.getElementById("ftpSettingsApply").innerText = "Apply";
        });
    },
  );
}

function fetchFTPconnectionInformation() {
  fetch("/api", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      r: "fetchFTPconfig",
    }),
  })
    .then((res) => {
      if (!res.ok) {
        failPopup("Can not fetch FTP configuration information");
        throw new Error("Failed to fetch FTP configuration information");
      }
      return res.json();
    })
    .then((data) => {
      document.getElementById("enableFTP").checked = data["enabled"];
      document.getElementById("ftpUserUsername").value =
        data["ftpUserUsername"];
      document.getElementById("ftpLocalRoot").value = data["ftpLocalRoot"];
    });
}

function otherConnectionsTab(pageName) {
  for (page of document.querySelectorAll("#connectionTabsPages > div")) {
    console.log(page);
    if (page.id != pageName) {
      page.hidden = true;
    } else {
      page.hidden = false;
    }
  }

  for (page of document.querySelectorAll("#conectionsTabs > button")) {
    console.log(page);
    if (page.id != pageName + "Button") {
      page.classList.remove("active");
    } else {
      page.classList.add("active");
    }
  }
}
