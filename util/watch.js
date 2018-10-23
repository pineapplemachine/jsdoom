// Watch a file or directory recursively and run a shell
// command any time a change to that path is observed.
// Usage:
// node watch.js <paths> <command>
// For example:
// node watch.js style.scss "sass style.scss style.css"

const childProcess = require("child_process");
const fs = require("fs");
const path = require("path");

const paths = process.argv.slice(2, process.argv.length - 1);
const command = process.argv[process.argv.length - 1];

const joinedPaths = paths.map(p => `"${p}"`).join(", ");
console.log(`Running "${command}" on changes to "${joinedPaths}".`);

function watch(watchPath) {
    let running = false;
    let lastRunTime = 0;
    fs.watch(watchPath, {recursive: true}, function(type, name) {
        if(path.basename(name).startsWith(".")){
            return;
        }
        const now = (new Date()).getTime();
        if(running || (now - lastRunTime) < 250){
            return;
        }
        console.log((new Date()).toISOString() + " > " + command);
        running = true;
        lastRunTime = now;
        const proc = childProcess.exec(command);
        proc.stdout.on("data", function(data){
            process.stdout.write(data.toString());
        });
        proc.stderr.on("data", function(data){
            process.stderr.write(data.toString());
        });
        proc.on("exit", function(){
            running = false;
        });
    });
}

for(const path of paths){
    watch(path);
}
