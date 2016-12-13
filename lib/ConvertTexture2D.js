"use strict";

const Jimp = require("jimp");
const UnpackETC1 = require("./UnpackETC1");

//==============================================================================

const A8 = 1;
const A4_R4_G4_B4 = 2;
const R8_G8_B8 = 3;
const R8_G8_B8_A8 = 4;
const A8_R8_G8_B8 = 5;
const R5_G6_B5 = 7;
const R4_G4_B4_A4 = 13;
// const PVRTC_RGB2 = 30;   // TODO
// const PVRTC_RGBA2 = 31;  // TODO
// const PVRTC_RGB4 = 32;   // TODO
// const PVRTC_RGBA4 = 33;  // TODO
const ETC1_RGB = 34;

const TEX_FORMAT_ALPHA = [ A8, A4_R4_G4_B4, R8_G8_B8_A8, A8_R8_G8_B8, R4_G4_B4_A4 ];
const TEX_FORMAT_NONALPHA = [ R8_G8_B8, R5_G6_B5, ETC1_RGB ];
const TEX_FORMAT = [].concat(TEX_FORMAT_NONALPHA, TEX_FORMAT_NONALPHA);

//==============================================================================

function convertTexture2D(texture) {
  let width = texture.m_Width;
  let height = texture.m_Height;
  let format = texture.m_TextureFormat;
  let data = texture["image data"];

  let img = new Jimp(width, height);
  let x = 0, y = 0;

  if(TEX_FORMAT_NONALPHA.indexOf(format) >= 0) img.rgba(false);
  else if(TEX_FORMAT_ALPHA.indexOf(format) >= 0) img.rgba(true);
  else throw "Unsupported format " + format;

  //====================================
  // Handle special formats first

  if(format === ETC1_RGB) {
    for(let o = 0 ; o < data.length ; o += 8) {
      let upper = data.readUInt32BE(o);
      let lower = data.readUInt32BE(o + 4);
      let block = UnpackETC1(upper, lower);

      for(let i = 0 ; i < 16 ; i++) {
        let dx = i % 4;
        let dy = ~~(i / 4);
        img.setPixelColor(Jimp.rgbaToInt(...block[i], 255), x + dx, y + dy);
      }

      if(width <= x + 4) { x = 0; y += 4; }
      else x += 4;
    }

    return img;
  }

  //====================================
  // And the others

  for(let o = 0 ; o < data.length ; ) {
    let r = 0, g = 0, b = 0, a = 255;

    if(format === A8) {
      a = data.readUInt8(o);
      o += 1;
    }
    else if(format === A4_R4_G4_B4) {
      // aaaarrrr ggggbbbb
      let v = data.readUInt16LE(o); o += 2;
      b = ( v        & 15) << 4;
      g = ((v >>  4) & 15) << 4;
      r = ((v >>  8) & 15) << 4;
      a = ((v >> 12) & 15) << 4;
    }
    else if(format === R8_G8_B8) {
      // rrrrrrrr gggggggg bbbbbbbb
      r = data.readUInt8(o);
      g = data.readUInt8(o+1);
      b = data.readUInt8(o+2);
      o += 3;
    }
    else if(format === R8_G8_B8_A8) {
      // rrrrrrrr gggggggg bbbbbbbb aaaaaaaa
      r = data.readUInt8(o);
      g = data.readUInt8(o+1);
      b = data.readUInt8(o+2);
      a = data.readUInt8(o+3);
      o += 4;
    }
    else if(format === A8_R8_G8_B8) {
      // aaaaaaaa rrrrrrrr gggggggg bbbbbbbb
      a = data.readUInt8(o);
      r = data.readUInt8(o+1);
      g = data.readUInt8(o+2);
      b = data.readUInt8(o+3);
      o += 4;
    }
    else if(format === R5_G6_B5) {
      // rrrrrggg gggbbbbb
      let v = data.readUInt16LE(o); o += 2;
      b = ( v        & 31) << 3;
      g = ((v >>  5) & 63) << 2;
      r = ((v >> 11) & 31) << 3;
    }
    else if(format === R4_G4_B4_A4) {
      // rrrrgggg bbbbaaaa
      let v = data.readUInt16LE(o); o += 2;
      a = ( v        & 15) << 4;
      b = ((v >>  4) & 15) << 4;
      g = ((v >>  8) & 15) << 4;
      r = ((v >> 12) & 15) << 4;
    }

    img.setPixelColor(Jimp.rgbaToInt(r, g, b, a), x, y);
    x++;
    if(x >= width) { x = 0; y++; }
  }

  return img;
}

module.exports = convertTexture2D;
