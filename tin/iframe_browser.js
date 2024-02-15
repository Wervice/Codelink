// <base href="">

function loadWebsite() {
    fetch(document.getElementById("url").value, {
        "method": "GET"
    }).then((res) => res.text())
        .then((data) => {
            iframe = document.getElementById("iframe")
            setTimeout(function () {dataP = new DOMParser()
                dataP.parseFromString(data, "text/html")
                dataParsed = dataP.documentElement.innerHTML
                iframe.contentWindow.document.open();
                iframe.contentWindow.document.write(dataParsed);
                iframe.contentWindow.document.close();}, 500)
            
        })
}