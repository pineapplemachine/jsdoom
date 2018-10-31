# @jsdoom/tools

This package contains tools for reading, writing, and manipulating WAD files,
written in TypeScript.

One day, it may grow up to become a fully-featured browser-based
[Doom port](https://doomwiki.org/wiki/Source_port).

## Structure overview

- `assets/` - Static files that are used in jsdoom web views.
- `cli/` - Shell or batch scripts for jsdoom CLI tools.
- `dist/` - TypeScript and Webpack build output goes in here.
- `node_modules/` - This directory is created and populated by `npm install`.
- `src/` - Library and CLI code is contained in this directory.
- `test/` - Code for jsdoom automated tests goes here.
- `test-wads/` - Automated tests may write WADs to this directory.
- `util/` - This directory contains utilities for jsdoom development.
- `web/` - HTML, CSS, and TypeScript code for jsdoom web views go here.

## Building jsdoom

### First steps

To build jsdoom and use it for yourself, you must first follow these steps:

1. Ensure that you have the [Node package manager](https://www.npmjs.com/get-npm)
or an equivalent tool installed in your environment.

2. Download or clone the jsdoom git repository. If you're reading this on
GitHub, you can download jsdoom's source code as a zip archive by clicking
on the green "Clone or download" button on the right-hand side near the
top of this repository's homepage and choosing the "Download ZIP" option
in the popup that appears.

3. Run `npm install` (or equivalent) in a command line in the root
repository directory. (That's the directory where this readme file is
actually located.)
This command installs JavaScript and TypeScript package dependencies.
Note that this step requires that the Node package manager has been installed.

Now you can run tests, use the CLI tools, and try out the web views.

### Running tests

After the first-time setup, you can run jsdoom's automated tests by entering
`npm test` in the root repository directory. This command will build the
project to run with Node.js and then begin tests.
The test runner will output messages to the log describing test successes or
failures. If any tests fail, then the test process will terminate with a
non-zero status code.

### Using the CLI tools

The jsdoom repository contains some CLI tools. Before they can be run,
you must enter `npm run build` in a command line in the root repository
directory. Once jsdoom has been built, CLI tools can be run by entering,
for example, `./cli/export.sh`.

### Web views

To try out the web views, you will first need to build the project.
You can do this by running `npm run tsc && npm run webpack` in the root
repository directory.

To access the web views, you will then need to host the files on an HTTP
server. You can do this locally by installing a simple HTTP server such
as [http-server](https://www.npmjs.com/package/http-server).
You can install http-server to your environment by running
`npm install -g http-server` in a command line. After it has been installed,
you can use it to serve jsdoom's web views by running `http-server` in
the root repository directory.
Then you can access the WAD inspector by opening a web browser and visiting
`http://localhost:8080/web/inspector.html`, assuming that you are using
`http-server` with its default settings. The port number after "localhost"
may be different depending on your server settings.

You can also make the web views available by hosting them on a remote
web server. There is one simple example currently hosted at
https://pineapplemachine.com/demos/jsdoom/inspect-2018-10-23/web/inspector.html.
