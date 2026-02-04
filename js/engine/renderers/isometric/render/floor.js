/**
 * Renders a diamond shaped texture to the buffer.
 * BEWARE: This function does not account for screen dimentions safety.
 * @param {Uint32Array} frameBuffer frame to be written to.
 * @param {Uint16Array} depthBuffer buffer of depth, used in occlusion.
 * @param {Uint32Array} textureBuffer 16x16(256) texture buffer.
 * @param {Number} SCREEN_WIDTH width of the screen.
 * @param {Number} screenCoords placement coordinates.
 */
export function render_floor(frameBuffer, depthBuffer, textureBuffer, SCREEN_WIDTH, screenCoords){
    let color = 0;
    let textureCoords = 0;
    const SCREEN_WIDTH_P1 = SCREEN_WIDTH + 1;
    const SCREEN_WIDTH_P2 = SCREEN_WIDTH + 2;
    const SCREEN_WIDTH_M2 = SCREEN_WIDTH - 2;

    for(let i = 0; i < 16; i++){
        for(let l = 0; l < 16; l++){
            color = textureBuffer[textureCoords++];

            frameBuffer[screenCoords] = color;//Top left
            frameBuffer[screenCoords + 1] = color;//Top right
            frameBuffer[screenCoords + SCREEN_WIDTH] = color;//Bottom left
            frameBuffer[screenCoords + SCREEN_WIDTH_P1] = color;//Bottom right

            depthBuffer[screenCoords] = 0;
            depthBuffer[screenCoords + 1] = 0;
            depthBuffer[screenCoords + SCREEN_WIDTH] = 0;
            depthBuffer[screenCoords + SCREEN_WIDTH_P1] = 0;

            screenCoords += SCREEN_WIDTH_P2;//Step 1 down, 2 right
        }
        //Step back to the first pixel before this iteration, then step 1 down, 2 left.
        screenCoords += (SCREEN_WIDTH_M2) - ((SCREEN_WIDTH_P2) * 16);
    }
}

/**
 * Renders a diamond shaped texture to the buffer.
 * BEWARE: This function does not account for screen dimentions safety.
 * @param {Uint32Array} frameBuffer frame to be written to.
 * @param {Uint16Array} depthBuffer buffer of depth, used in occlusion.
 * @param {Uint32Array} textureBuffer 16x16(256) texture buffer.
 * @param {Number} SCREEN_WIDTH width of the screen.
 * @param {Number} screenCoords placement coordinates.
 */
export function render_floor_transparent(frameBuffer, depthBuffer, textureBuffer, SCREEN_WIDTH, screenCoords){
    let color = 0;
    let textureCoords = 0;
    const SCREEN_WIDTH_P1 = SCREEN_WIDTH + 1;
    const SCREEN_WIDTH_P2 = SCREEN_WIDTH + 2;
    const SCREEN_WIDTH_M2 = SCREEN_WIDTH - 2;

    for(let i = 0; i < 16; i++){
        for(let l = 0; l < 16; l++,
            screenCoords += SCREEN_WIDTH_P2//Step 1 down, 2 right
        ){
            color = textureBuffer[textureCoords++];
            if(!color){ continue; }

            frameBuffer[screenCoords] = color;//Top left
            frameBuffer[screenCoords + 1] = color;//Top right
            frameBuffer[screenCoords + SCREEN_WIDTH] = color;//Bottom left
            frameBuffer[screenCoords + SCREEN_WIDTH_P1] = color;//Bottom right

            depthBuffer[screenCoords] = 0;
            depthBuffer[screenCoords + 1] = 0;
            depthBuffer[screenCoords + SCREEN_WIDTH] = 0;
            depthBuffer[screenCoords + SCREEN_WIDTH_P1] = 0;
        }
        //Step back to the first pixel before this iteration, then step 1 down, 2 left.
        screenCoords += (SCREEN_WIDTH_M2) - ((SCREEN_WIDTH_P2) * 16);
    }
}

/**
 * Renders a diamond shaped texture to the buffer.
 * This function does account for screen dimentions safety.
 * @param {Uint32Array} frameBuffer frame to be written to.
 * @param {Uint16Array} depthBuffer buffer of depth, used in occlusion.
 * @param {Uint32Array} textureBuffer 16x16(256) texture buffer.
 * @param {Number} SCREEN_WIDTH width of the screen.
 * @param {Number} SCREEN_HEIGHT width of the screen.
 * @param {Number} screenCoords placement coordinates.
 * @param {Number} screen_x where in x the first pixel will be rendered (used in safety calculations)
 * @param {Number} screen_y where in y the first pixel will be rendered (used in safety calculations)
 */
export function render_floor_safe(frameBuffer, depthBuffer, textureBuffer, SCREEN_WIDTH, SCREEN_HEIGHT, screenCoords, screen_x, screen_y){
    let color = 0;
    let textureCoords = 0;
    const SCREEN_WIDTH_P1 = SCREEN_WIDTH + 1;
    const SCREEN_WIDTH_P2 = SCREEN_WIDTH + 2;
    const SCREEN_WIDTH_M2 = SCREEN_WIDTH - 2;
    const SCREEN_HEIGHT_M2 = SCREEN_HEIGHT - 2;

    for(let i = 0; i < 16; i++){
        for(let l = 0; l < 16; l++,
            screenCoords += SCREEN_WIDTH_P2,//Step 1 down, 2 right
            screen_x += 2,
            screen_y++
        ){
            color = textureBuffer[textureCoords++];
            if(screen_x < 0 || screen_y < 0 || screen_x > SCREEN_WIDTH_M2 || screen_y > SCREEN_HEIGHT_M2){ continue; }

            frameBuffer[screenCoords] = color;//Top left
            frameBuffer[screenCoords + 1] = color;//Top right
            frameBuffer[screenCoords + SCREEN_WIDTH] = color;//Bottom left
            frameBuffer[screenCoords + SCREEN_WIDTH_P1] = color;//Bottom right

            depthBuffer[screenCoords] = 0;
            depthBuffer[screenCoords + 1] = 0;
            depthBuffer[screenCoords + SCREEN_WIDTH] = 0;
            depthBuffer[screenCoords + SCREEN_WIDTH_P1] = 0;
        }
        //Step back to the first pixel before this iteration, then step 1 down, 2 left.
        screenCoords += (SCREEN_WIDTH_M2) - ((SCREEN_WIDTH_P2) * 16);
        screen_x -= 34;
		screen_y -= 15;
    }
}

/**
 * Renders a diamond shaped texture to the buffer.
 * This function does account for screen dimentions safety.
 * @param {Uint32Array} frameBuffer frame to be written to.
 * @param {Uint16Array} depthBuffer buffer of depth, used in occlusion.
 * @param {Uint32Array} textureBuffer 16x16(256) texture buffer.
 * @param {Number} SCREEN_WIDTH width of the screen.
 * @param {Number} SCREEN_HEIGHT width of the screen.
 * @param {Number} screenCoords placement coordinates.
 * @param {Number} screen_x where in x the first pixel will be rendered (used in safety calculations)
 * @param {Number} screen_y where in y the first pixel will be rendered (used in safety calculations)
 */
export function render_floor_safe_transparent(frameBuffer, depthBuffer, textureBuffer, SCREEN_WIDTH, SCREEN_HEIGHT, screenCoords, screen_x, screen_y){
    let color = 0;
    let textureCoords = 0;
    const SCREEN_WIDTH_P1 = SCREEN_WIDTH + 1;
    const SCREEN_WIDTH_P2 = SCREEN_WIDTH + 2;
    const SCREEN_WIDTH_M2 = SCREEN_WIDTH - 2;
    const SCREEN_HEIGHT_M2 = SCREEN_HEIGHT - 2;

    for(let i = 0; i < 16; i++){
        for(let l = 0; l < 16; l++,
            screenCoords += SCREEN_WIDTH_P2,//Step 1 down, 2 right
            screen_x += 2,
            screen_y++
        ){
            color = textureBuffer[textureCoords++];
            if(!color){ continue; }
            if(screen_x < 0 || screen_y < 0 || screen_x > SCREEN_WIDTH_M2 || screen_y > SCREEN_HEIGHT_M2){ continue; }

            frameBuffer[screenCoords] = color;//Top left
            frameBuffer[screenCoords + 1] = color;//Top right
            frameBuffer[screenCoords + SCREEN_WIDTH] = color;//Bottom left
            frameBuffer[screenCoords + SCREEN_WIDTH_P1] = color;//Bottom right

            depthBuffer[screenCoords] = 0;
            depthBuffer[screenCoords + 1] = 0;
            depthBuffer[screenCoords + SCREEN_WIDTH] = 0;
            depthBuffer[screenCoords + SCREEN_WIDTH_P1] = 0;
        }
        //Step back to the first pixel before this iteration, then step 1 down, 2 left.
        screenCoords += (SCREEN_WIDTH_M2) - ((SCREEN_WIDTH_P2) * 16);
        screen_x -= 34;
		screen_y -= 15;
    }
}