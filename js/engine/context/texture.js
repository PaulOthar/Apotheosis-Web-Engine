const spritesLabel = "sprites";
const palettesLabel = "palettes";
const fontsLabel = "fonts";
const environmentsLabel = "environments";

function searchTree(tree, target){
    let splitted = target.split(".");
    for(let i = 0; i < splitted.length; i++){
        tree = tree.get(splitted[i]);
        if(!tree){ return null; }
    }
    return tree;
}

/**
 * Stacks two sprites on top of each other, overwritting the reciver if they collide.
 * @param {Uint8Array} source 
 * @param {Uint8Array} reciver 
 */
function stackSprite(source, reciver){
    let size = source.length > reciver.length ? reciver.length : source.length;
    for(let i = 0; i < size; i++){
        let low = source[i] & 0x0f;
        let high = source[i] & 0xf0;
        let target = 0;
        target += low > 0 ? 1 : 0;
        target += high > 0 ? 2 : 0;
        switch(target){
            case 1: reciver[i] = low | (reciver[i] & 0xf0); break;
            case 2: reciver[i] = high | (reciver[i] & 0x0f); break;
            case 3: reciver[i] = source[i];
        }
    }
}

/**
 * 
 * @param {Map} branch
 * @param {Number} config
 */
function buildSprite(branch, config){
    let size = branch.get(branch.keys().toArray()[0]).length;
    let result = new Uint8Array(size);
    const symbol = ["A", "B", "C", "O"];
    let syndex = 0;

    for(;config > 0; syndex += (syndex < 4) ? 1 : 0){
        let found = branch.get(`${symbol[syndex]}${(config & 0xf).toString(16)}`);
        config >>= 4;
        if(!found){ continue; }
        stackSprite(found, result);
    }

    return result;
}

function buildPalette(bytes){
    let result = new Uint32Array(4);
    for(let i = 0; i < 4; i++){
        for(let l = 2; l >= 0; l--){
            result[i] <<= 8; result[i] |= bytes[(i * 3) + l];
        }
        result[i] |= 0xff000000;
    }
    return result;
}

/**
 * Loads a texture to memory, from a palette and a 4bpp image.
 * @param {Uint32Array} destination 
 * @param {Uint8Array} source 
 * @param {Array} colors 4x Uint32[4]
 */
function buildTexture(destination, source, colors){
    let palette = new Uint32Array(16);
    for(let i = 0; i < colors.length && i < 4; i++){
        for(let l = 0; l < 4; l++){
            palette[l + (i << 2)] = colors[i][l];
        }
    }

    //Grab the smallest of the two
    let size = source.length * 2;
    if(size > destination.length){ size = destination.length; }

    for(let i = 0; i < size; i++){
        let duo = source[i];
        let index = i << 1;
        if(palette[duo & 0xf]){ destination[index] = palette[duo & 0xf]; }
        if(palette[duo >> 4]){ destination[index + 1] = palette[duo >> 4]; }
    }
}

function buildShade(source, destination, shift){
    let size = source.length > destination.length ? destination.length : source.length;
    let mask = 0xff >> shift; mask |= (mask << 8) | (mask << 16) | (mask << 24);
    for(let i = 0; i < size; i++){
        destination[i] = ((source[i] >> shift) & mask) | 0xff000000;
    }
}

import CONSTANTS from '../constants.json' with { type: "json" };
import { EVENT_HEADER } from "../eventConstants.js";
import { EventQueue } from "../util/eventQueue.js";

export class TextureContext{
    source;//Textures source

    voidTexture;//16x16 Uint32[256]
    font;//16x16 chars of 8x8 pixels(1bpp) Uint8[2048]
    defaultOutline;//Palette with common outline

    objectHUD;//8 x Uint32[256]
    objectTile;//32 x Uint32[256]

    objectBasic;//32 x Uint32[256]
    objectTetra;//32 x Uint32[1024]
    objectOctal;//32 x Uint32[2048]
    objectHexal;//32 x Uint32[4096]

    environment;//Any sized map

    #accessMap;

    /**
     * Loads and initializes the texture context
     * @param {Map} source 
     */
    constructor(source){
        this.source = source;

        this.voidTexture = new Uint32Array(256);
        this.loadVoid(0x010101);
        this.font = new Uint8Array(2048);
        this.defaultOutline = new Uint32Array(4);
        this.defaultOutline[1] = 0xff020202;//Not-so-black
        this.defaultOutline[2] = 0xff808080;//Gray
        this.defaultOutline[3] = 0xffffffff;//White

        this.objectHUD = new Array(32);
        this.objectTile = new Array(32);
        this.objectBasic = new Array(32);
        this.objectTetra = new Array(32);
        this.objectOctal = new Array(32);
        this.objectHexal = new Array(32);

        for(let i = 0; i < 32; i++){
            this.objectHUD[i] = new Uint32Array(256);
            this.objectTile[i] = new Uint32Array(256);
            this.objectBasic[i] = new Uint32Array(256);
            this.objectTetra[i] = new Uint32Array(1024);
            this.objectOctal[i] = new Uint32Array(2048);
            this.objectHexal[i] = new Uint32Array(4096);

            for(let l = 0; l < 256; l++){ this.objectTile[i][l] = this.voidTexture[l]; }
        }

        this.environment = new Map();

        this.#accessMap = new Map();
        this.#accessMap.set(CONSTANTS.HUD, this.objectHUD);
        this.#accessMap.set(CONSTANTS.TILE, this.objectTile);
        this.#accessMap.set(CONSTANTS.BASIC, this.objectBasic);
        this.#accessMap.set(CONSTANTS.TETRA, this.objectTetra);
        this.#accessMap.set(CONSTANTS.OCTAL, this.objectOctal);
        this.#accessMap.set(CONSTANTS.HEXAL, this.objectHexal);
    }

    /**
     * Processes a event from the event queue
     * @param {Number} header encoded event header
     * @param {Number} payload raw event data
     * @param {EventQueue} eventQueue queue for stacking more events as result
     */
    handleEvent(event, header, payload, eventQueue){
        switch(header){
            case EVENT_HEADER.TEXTURE_LOAD_ENVIRONMENT:
                let entry = this.source.get("environments");
                entry = entry.entries();
                entry = entry.toArray()[payload - 1];
                this.#loadEnvironment(entry[0], entry[1]);
            return true;
        }
        return false;
    }

    /**
     * Loads a texture to a specific type (tile, basic, tetra, octal, hexal)
     * @param {String} type the type of slot it will be loaded to
     * @param {Number} index the index of the specific slot
     * @param {String} encoded encoded texture data
     */
    stackTexture(type, index, encoded){
        let splitted = encoded.split(";");//Tile.Brick2;0;Clay_smooth
        let sprite = searchTree(this.source.get(spritesLabel), splitted[0]); if(!sprite){ throw new Error(`Sprite '${splitted[0]}' not found.`); }
        
        let config = Number.parseInt(splitted[1], 16);
        if(sprite instanceof Map){ sprite = buildSprite(sprite, config); }

        let colors = new Array();
        colors.push(this.defaultOutline);
        for(let i = 2; i < splitted.length; i++){
            let found = this.source.get(palettesLabel).get(splitted[i]);
            if(!found){ throw new Error(`Palette '${splitted[i]}' not found.`); }
            colors.push(buildPalette(found));
        }

        let slot = this.#accessMap.get(type)[index];
        buildTexture(slot, sprite, colors);
    }

    /**
     * Clears and then loads a texture to a specific type (tile, basic, tetra, octal, hexal)
     * @param {String} type the type of slot it will be loaded to
     * @param {Number} index the index of the specific slot
     * @param {String} encoded encoded texture data
     */
    loadTexture(type, index, encoded){
        let slot = this.#accessMap.get(type)[index];
        for(let i = 0; i < slot.length; i++){ slot[i] = 0; }
        this.stackTexture(type, index, encoded);
    }

    loadFont(name){
        let found = this.source.get(fontsLabel).get(name);
        if(found){ this.font = found; }
    }

    loadVoid(color){
        for(let i = 0; i < 256; i++){
            this.voidTexture[i] = color | 0xff000000;
        }
    }

    #getType(index){ return this.#accessMap.get(this.#accessMap.keys().toArray()[index]); }

    /**
     * Loads a texture based on a 9 bytes sequence
     * @param {Uint8Array} data 
     * @param {Array} palettes 
     */
    #load9BTexture(data, index){
        let location = data[index++];
        if(location == 0){ return -1; }
        let type = this.#getType(location & 0x7);
        let slot = type[location >> 3];

        let pathing = 0;
        for(let i = 0; i < 3; i++, index++){ pathing |= (data[index] << (i * 8)); }

        let branch = this.source.get(spritesLabel);
        let keys = branch.keys().toArray();
        for(let l = 0; l < 4; l++, pathing >>= 6){
            let val = pathing & 0x3f;
            if(val == 0){ break; } val -= 1;
            branch = branch.get(keys[val]);
            keys = branch.keys().toArray();
        }
        
        let spriteIndex = data[index++];
        let config = data[index++];
        let sprite = branch.get(keys[spriteIndex]);
        if(config != 0){
            config |= spriteIndex << 8;
            sprite = buildSprite(branch, config);
        }

        let colors = new Array(4);
        colors[0] = this.defaultOutline;
        const palettes = this.source.get(palettesLabel).values().toArray();
        for(let l = 1; l < 4; l++){
            colors[l] = buildPalette(palettes[data[index++]]);
        }

        buildTexture(slot, sprite, colors);
        if((location & 0x7) == CONSTANTS.TILE){ buildShade(slot, type[(location >> 3) + 16], 1); }
        return index;
    }

    #loadEnvironment(name, environment){
        let i = 0;
        for(let l = 0; l < 16; l++){
            let indx = this.#load9BTexture(environment, i);
            if(indx == -1){ break; } i = indx;
        }

        let splitted = name.split(".");
        this.environment.set(splitted[0], splitted[1]);
    }

    loadEnvironment(name){
        let found = this.source.get(environmentsLabel).get(name);
        if(!found){ throw new Error(`Environment '${name}' not found.`); }
        this.#loadEnvironment(name, found);
    }

    ___export_texture(encoded){
        let splitted = encoded.split(";");//Tile.Brick2;0;Clay_smooth
        let sprite = searchTree(this.source.get(spritesLabel), splitted[0]); if(!sprite){ throw new Error(`Sprite '${splitted[0]}' not found.`); }

        let config = Number.parseInt(splitted[1], 16);
        if(sprite instanceof Map){ sprite = buildSprite(sprite, config); }

        let colors = new Array();
        colors.push(this.defaultOutline);
        for(let i = 2; i < splitted.length; i++){
            let found = this.source.get(palettesLabel).get(splitted[i]);
            if(!found){ throw new Error(`Palette '${splitted[i]}' not found.`); }
            colors.push(buildPalette(found));
        }

        let slot = new Uint32Array(sprite.length * 2);
        buildTexture(slot, sprite, colors);

        return slot;
    }
}