const fs = require("fs")
const path = require("path")
const os = require("os")
const crypto = require("crypto")

const zentroxInstPath = path.join(os.homedir(), "zentrox/")

function hash512(str) {
    var hash = crypto.createHash("sha512")
    data = hash.update(str, "utf-8")
    return data.digest("hex")
}

