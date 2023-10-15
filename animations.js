function flyOut(id, duration) {
    animationName_before = document.getElementById(id).style.animationName
    animationDuration_before = document.getElementById(id).style.animationDuration
    document.getElementById(id).style.animationDuration = duration+"ms"
    document.getElementById(id).style.animationName = "fly-out"
    document.getElementById(id).classList.add("fly-out")
    setTimeout(function () {
        document.getElementById(id).hidden = true
        document.getElementById(id).classList.remove("fly-out")
        document.getElementById(id).style.animationName = animationName_before
        document.getElementById(id).style.animationDuration = animationDuration_before
    }, duration-10)
}

function fadeOut(id, duration) {
    animationName_before = document.getElementById(id).style.animationName
    animationDuration_before = document.getElementById(id).style.animationDuration
    document.getElementById(id).style.animationDuration = duration+"ms"
    document.getElementById(id).style.animationName = "fade-out"
    document.getElementById(id).classList.add("fade-out")
    setTimeout(function () {
        document.getElementById(id).hidden = true
        document.getElementById(id).classList.remove("fade-out")
        document.getElementById(id).style.animationName = animationName_before
        document.getElementById(id).style.animationDuration = animationDuration_before
    }, duration-10)
}