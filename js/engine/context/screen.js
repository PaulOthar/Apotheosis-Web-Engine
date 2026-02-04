/**
 * Screen context is a generic structure that interfaces with scene functions.
 * Used to abstract the output device that will be used to render.
 */
export class ScreenContext{
    SCREEN_WIDTH; SCREEN_HEIGHT;
    pixels; depth;

    /**
     * Creates a empty ScreenContext.
     */
    constructor(){
        this.pixels = null;
        this.depth = null;
        this.SCREEN_WIDTH = 0;
        this.SCREEN_HEIGHT = 0;
    }

    clear(color){
        const pix = color ? color : 0xff000000;
        let pixels = this.pixels;
        let depth = this.depth;
        for(let i = 0; i < pixels.length; i++){
            pixels[i] = pix; depth[i] = 0;
        }
    }

    /**
     * Initializes all attributes with new instances.
     * @param {Number} width horizontal size
     * @param {Number} height vertical size
     */
    create(width, height){
        this.pixels = new Uint32Array(width * height);
        this.depth = new Uint16Array(width * height);
        this.SCREEN_WIDTH = width;
        this.SCREEN_HEIGHT = height;
    }

    /**
     * Recives referentes from another source.
     * @param {Uint32Array} pixels framebuffer
     * @param {Uint16Array} depth depthbuffer
     * @param {Number} width horizontal size
     * @param {Number} height vertical size
     */
    define(pixels, depth, width, height){
        this.pixels = pixels;
        this.depth = depth;
        this.SCREEN_WIDTH = width;
        this.SCREEN_HEIGHT = height;
    }

    showDepth(){
        for(let i = 0; i < this.pixels.length; i++){
            let depth = this.depth[i];
            if(depth == 0){ continue; }
            if(depth > 255){ depth = (depth << 8) | 0xff; }
            else{ depth = ((~depth) << 16) | 0xff; }
            this.pixels[i] = depth | 0xff000000;
        }
    }

    /**
     * Calculates a screen coordinate based on current attributes and parameters.
     * @param {Number} x horizontal axis
     * @param {Number} y vertical Axis
     * @returns {Number} linear coordinates
     */
    coords(x, y){
        return x + (y * this.SCREEN_WIDTH);
    }

    /**
     * Creates a copy of a screen buffer
     * @param {ScreenContext} screen_c
     * @returns {ScreenContext} a static copy 
     */
    static create_copy(screen_c){
        let output = new ScreenContext();
        output.define(
            new Uint32Array(screen_c.pixels),
            new Uint32Array(screen_c.depth),
            screen_c.SCREEN_WIDTH,
            screen_c.SCREEN_HEIGHT
        );
        return output;
    }
}

window.ScreenContext = ScreenContext;