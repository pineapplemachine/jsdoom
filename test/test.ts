import * as fs from "fs";

import {WADFile} from "@src/wad/file";

import {testWriteIdentical} from "@test/writeIdentical";
import {testTextParse} from "@test/zTextParse";

async function runTests(): Promise<void> {
    await testWriteIdentical("./test-wads", "doom1.wad");
    await testTextParse();
}

runTests().then(() => {
    console.log("Tests PASSED.");
    process.exit(0);
}).catch((error: Error) => {
    console.log("Tests FAILED.");
    console.log(error);
    process.exit(1);
});
