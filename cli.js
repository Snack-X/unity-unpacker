#!/usr/bin/env node

"use strict";

const fs = require("fs");
const path = require("path");

const yargs = require("yargs");

const unpack = require("./index");

//==============================================================================

let options = yargs
  .usage("Usage: $0 [options] <.unity3d or .unity3d.lz4>")
  .option("output-dir", {
    alias: "o",
    describe: "Unpacked files' destination directory\nIf not specified, new directory will be created on current working directory, and set to the directory",
  })
  .option("dry-run", {
    alias: "D",
    describe: "Files won't be really extracted, but just parsed and informations will be printed",
    boolean: true,
    default: false,
  })
  .option("verbose", {
    alias: "v",
    describe: "Detailed information about assets will be printed",
    boolean: true,
    default: false,
  })
  .option("image", {
    describe: "Textures' output format",
    choices: [ "jpg", "png" ],
    default: "png",
  })
  .help()
  .demand(1) // file
  .argv;

//==============================================================================

let inFile = options._[0];
let inBuf = fs.readFileSync(inFile);

options.lz4 = inFile.endsWith(".unity3d.lz4");

let result = unpack(inBuf, options);

if(options.dryRun) process.exit(0);

if(!options.outputDir) {
  let dir = path.parse(inFile).base.replace(/\.unity3d(?:\.lz4)?$/, "");
  fs.mkdirSync(dir);
  options.outputDir = path.join(process.cwd(), dir);
}

for(let file of result) {
  let filename = path.join(options.outputDir, file.filename);

  switch(file.type) {
    case "mesh":
      fs.writeFileSync(filename, file.objData);
      break;
    case "texture":
      file.image.write(filename);
      break;
    case "bone":
      fs.writeFileSync(filename, JSON.stringify(file.data));
      break;
  }
}
