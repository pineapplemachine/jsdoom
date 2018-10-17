import * as fs from "fs";

// import {findWad, testWad} from "@test/testWad";
// import * as jsdoom from "@src/index";

import {openTestWad} from "@test/open";

// testWad({
//     WADFile: WADTools.WADFile,
//     testWadDirectory: "./test-wads",
//     fileName: "doom1.wad",
//     verbose: true,
// }).then((status: number) => {
//     if(status){
//         console.log(`Tests FAILED with status code ${status}.`);
//     }else{
//         console.log("Tests PASSED.");
//     }
//     process.exit(status);
// }).catch((error: Error) => {
//     console.log("Tests FAILED due to an unhandled error.");
//     console.log(error);
//     process.exit(1);
// });
