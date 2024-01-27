function setCPUBar() {
    fetch("/api?r=cpuPercent", {
        "method": "GET",
        "headers": {
            "Content-Type": "application/json"
        }
    }).then((res) => res.json())
        .then((data) => {
            if (data["status"] == "s") {
                document.getElementById("cpu_bar").style.width = Math.floor(Number(data["p"] * 2)) + "px"
                document.getElementById("cpu_bar").title = "CPU " + Math.round(data["p"]) + "%"
            }
        })
}

function setRAMBar() {
    fetch("/api?r=ramPercent", {
        "method": "GET",
        "headers": {
            "Content-Type": "application/json"
        }
    }).then((res) => res.json())
        .then((data) => {
            if (data["status"] == "s") {
                document.getElementById("ram_bar").style.width = Math.floor(Number(data["p"]) * 2) + "px"
                document.getElementById("ram_bar").title = "RAM " + Math.round(data["p"]) + "%"
            }
        })
}

function setDiskBar() {
    fetch("/api?r=diskPercent", {
        "method": "GET",
        "headers": {
            "Content-Type": "application/json"
        }
    }).then((res) => res.json())
        .then((data) => {
            if (data["status"] == "s") {
                document.getElementById("disk_bar").style.width = Math.floor(Number(data["p"]) * 2) + "px"
                document.getElementById("disk_bar").title = "Disk " + Math.round(data["p"]) + "%"
            }
        })
}

function deleteUser(username) {
  if (confirm(`Do you want to delete ${username}?`)) {
  fetch("/api", {
      "method": "POST",
      "headers": {
          "Content-Type": "application/json"
      },
      "body": JSON.stringify({  
        "username": username,
        "r": "deleteUser"
      })
  }).then((res) => res.json())
      .then((data) => {
          if (data["status"] == "s") {
             fetch("/api?r=userList").then((res) => res.json()).then((data) => {
            if (data["status"] == "s") {
              document.getElementById("usersTable").innerHTML = data["text"]
            }
          }) 
          }
          else {
            alert("Can not delete user")
          }
      })
  } 
}

function changePage(pageName) {
  for (page of document.querySelectorAll("#pages > div")) {
    console.log(page)
    if (page.id != pageName) {
      page.hidden = true
    }
    else {
      page.hidden = false
    }
  }
  }

window.onload = function () {
    setCPUBar()
    setRAMBar()
}

setInterval(
    function () {
        setCPUBar()
        setRAMBar()
    }, 5000
)
