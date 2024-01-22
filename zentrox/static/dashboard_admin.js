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

window.onload = function () {
    setCPUBar()
    setRAMBar()
    setDiskBar()
}

setInterval(
    function () {
        setCPUBar()
        setRAMBar()
        setDiskBar()
    }, 5000
)