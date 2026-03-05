const { exec } = require("child_process");
const os = require("os");

function runCommand(cmd) {
    return new Promise((resolve, reject) => {
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                reject(stderr || error.message);
            } else {
                resolve(stdout.trim());
            }
        });
    });
}

function interfaceExists(iface) {
    return os.networkInterfaces().hasOwnProperty(iface);
}

function validateIP(ipWithPrefix) {
    const regex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
    return regex.test(ipWithPrefix);
}

async function addIP(iface, ipWithPrefix) {
    if (!interfaceExists(iface)) {
        throw "Interface not found";
    }

    if (!validateIP(ipWithPrefix)) {
        throw "Invalid IP format";
    }

    return await runCommand(`sudo ip addr add ${ipWithPrefix} dev ${iface}`);
}

async function deleteIP(iface, ipWithPrefix){
    return await runCommand(`sudo ip addr del ${ipWithPrefix} dev ${iface}`);
}

async function addGateway(gateway) {
    return await runCommand(`sudo ip route add default via ${gateway}`);
}

async function deleteGateway(){
    return await runCommand(`sudo ip route del default`);
}

async function testPing(target = "8.8.8.8"){
    return await runCommand(`ping -c 3 ${target}`);
}

module.exports = {
    addIP,
    deleteIP,
    addGateway,
    deleteGateway,
    testPing
};