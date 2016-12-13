"use strict";

function extractBone(unityAsset) {
  let transforms = {};
  let transformName = {};
  let rootPathId;

  for(let pathId in unityAsset.data) {
    let object = unityAsset.data[pathId];

    if(object._type === "SkinnedMeshRenderer") {
      rootPathId = object.m_RootBone.m_PathID;
    }
    else if(object._type === "Transform") {
      transforms[pathId] = {
        rotation: object.m_LocalRotation,
        position: object.m_LocalPosition,
        scale: object.m_LocalScale,
        children: object.m_Children.Array.map(c => c.m_PathID),
      };
    }
    else if(object._type === "GameObject") {
      let components = object.m_Component.Array.map(c => c.second.m_PathID);
      for(let id of components) {
        transformName[id] = object.m_Name;
      }
    }
  }

  //====================================
  // Build bone structure

  function getBoneRecursive(pathId) {
    let bone = Object.assign({}, transforms[pathId]);
    bone.name = transformName[pathId];
    bone.children = bone.children.map(getBoneRecursive);

    return bone;
  }

  let bone = getBoneRecursive(rootPathId);

  return bone;
}

module.exports = extractBone;
