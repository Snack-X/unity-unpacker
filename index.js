"use strict";

const Unity = require("unity-parser");

const ConvertTexture2D = require("./lib/ConvertTexture2D");
const ConvertMesh = require("./lib/ConvertMesh");
const ExtractBone = require("./lib/ExtractBone");

//==============================================================================

function unpack(inBuf, opt = {}) {
  let options = Object.assign({
    dryRun: false,
    verbose: false,
    image: "png",
    lz4: false,
  }, opt);

  const LOG = msg => { if(options.verbose) console.log(msg); };

  let unityBundle;
  try {
    unityBundle = Unity.load(inBuf, options.lz4);
  } catch(e) {
    console.log(e);
    throw "Error while reading .unity3d file";
  }

  LOG("[ ] .unity3d file has loaded and parsed");

  let data = [];

  for(let i = 0 ; i < unityBundle.length ; i++) {
    let unityAsset = unityBundle[i];

    let suffix = "";
    if(1 < unityBundle.length) suffix += i + "_";

    for(let pathId in unityAsset.data) {
      let object = unityAsset.data[pathId];

      LOG(`[ ] ${pathId} - ${object._type}`);

      if(object._type === "Mesh") {
        LOG(`[+] Extracting Mesh as OBJ format`);

        let filename = suffix + object.m_Name + ".obj";
        let obj = ConvertMesh(object);

        data.push({ type: "mesh", filename, objData: obj });
      }
      else if(object._type === "Texture2D") {
        LOG(`[+] Extracting Texture2D`);

        let filename = suffix + object.m_Name + "." + options.image;
        let img = ConvertTexture2D(object);

        data.push({ type: "texture", filename, image: img });
      }
      else if(object._type === "SkinnedMeshRenderer") {
        LOG(`[+] Extracting bones as JSON format`);

        let filename = suffix + "bone.json";
        let bone = ExtractBone(unityAsset);

        data.push({ type: "bone", filename, data: bone });
      }
    }
  }

  return data;
}

module.exports = unpack;

