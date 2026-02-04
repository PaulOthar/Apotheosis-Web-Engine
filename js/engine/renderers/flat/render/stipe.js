/**
 * Renders a vertical stripe texture to the buffer.
 * BEWARE: This function does not account for screen dimentions safety.
 * @param {Uint32Array} frameBuffer frame to be written to.
 * @param {Uint16Array} depthBuffer buffer of depth, used in occlusion.
 * @param {Uint32Array} textureBuffer 16x16(256) texture buffer.
 * @param {Number} SCREEN_WIDTH width of the screen.
 * @param {Number} screenCoords placement coordinates.
 */
export function render_stripe_left_depthed(frameBuffer, depthBuffer, textureBuffer, SCREEN_WIDTH, screenCoords, screen_y){
    let depth = screen_y + 32
    let color = 0;
    let textureCoords = 0;
    const SCREEN_WIDTH_P1 = SCREEN_WIDTH + 1;

    for(let i = 0; i < 16; i++){
        for(let l = 0; l < 4; l++){
            color = textureBuffer[textureCoords++];

            frameBuffer[screenCoords] = color;//Top left
            frameBuffer[screenCoords + 1] = color;//Top right
            frameBuffer[screenCoords + SCREEN_WIDTH] = color;//Bottom left
            frameBuffer[screenCoords + SCREEN_WIDTH_P1] = color;//Bottom right

            depthBuffer[screenCoords] = depth;
            depthBuffer[screenCoords + 1] = depth;
            depthBuffer[screenCoords + SCREEN_WIDTH] = depth;
            depthBuffer[screenCoords + SCREEN_WIDTH_P1] = depth;

            screenCoords += 2;//2 Right
        }
        //Step back to the first pixel before this iteration, then step 2 down.
        screenCoords += (SCREEN_WIDTH * 2) - 8;
        textureCoords += 12;
    }
}

/**
 * Renders a vertical stripe texture to the buffer.
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
export function render_stripe_left_safe_depthed(frameBuffer, depthBuffer, textureBuffer, SCREEN_WIDTH, SCREEN_HEIGHT, screenCoords, screen_x, screen_y){
    let depth = screen_y + 32
    let color = 0;
    let textureCoords = 0;
    const SCREEN_WIDTH_P1 = SCREEN_WIDTH + 1;
    const SCREEN_WIDTH_M2 = SCREEN_WIDTH - 2;
    const SCREEN_HEIGHT_M2 = SCREEN_HEIGHT - 2;

    for(let i = 0; i < 16; i++){
        if(screen_y < 0 || screen_y > SCREEN_HEIGHT_M2){
            screen_y += 2;
            screenCoords += (SCREEN_WIDTH * 2);
            textureCoords += 16;
        continue;}
        for(let l = 0; l < 4; l++,
            screenCoords += 2,//2 Right
            screen_x += 2
        ){
            color = textureBuffer[textureCoords++];
            if(screen_x < 0 || screen_x > SCREEN_WIDTH_M2){ continue; }

            frameBuffer[screenCoords] = color;//Top left
            frameBuffer[screenCoords + 1] = color;//Top right
            frameBuffer[screenCoords + SCREEN_WIDTH] = color;//Bottom left
            frameBuffer[screenCoords + SCREEN_WIDTH_P1] = color;//Bottom right

            depthBuffer[screenCoords] = depth;
            depthBuffer[screenCoords + 1] = depth;
            depthBuffer[screenCoords + SCREEN_WIDTH] = depth;
            depthBuffer[screenCoords + SCREEN_WIDTH_P1] = depth;
        }
        //Step back to the first pixel before this iteration, then step 2 Down.
        screenCoords += (SCREEN_WIDTH * 2) - 8;
        textureCoords += 12;
        screen_x -= 8;
		screen_y += 2;
    }
}

/**
 * Renders a vertical stripe texture to the buffer.
 * BEWARE: This function does not account for screen dimentions safety.
 * @param {Uint32Array} frameBuffer frame to be written to.
 * @param {Uint16Array} depthBuffer buffer of depth, used in occlusion.
 * @param {Uint32Array} textureBuffer 16x16(256) texture buffer.
 * @param {Number} SCREEN_WIDTH width of the screen.
 * @param {Number} screenCoords placement coordinates.
 */
export function render_stripe_right_depthed(frameBuffer, depthBuffer, textureBuffer, SCREEN_WIDTH, screenCoords, screen_y){
    let depth = screen_y + 32
    let color = 0;
    let textureCoords = 12;
    const SCREEN_WIDTH_P1 = SCREEN_WIDTH + 1;
    screenCoords += 24;

    for(let i = 0; i < 16; i++){
        for(let l = 0; l < 4; l++){
            color = textureBuffer[textureCoords++];

            frameBuffer[screenCoords] = color;//Top left
            frameBuffer[screenCoords + 1] = color;//Top right
            frameBuffer[screenCoords + SCREEN_WIDTH] = color;//Bottom left
            frameBuffer[screenCoords + SCREEN_WIDTH_P1] = color;//Bottom right

            depthBuffer[screenCoords] = depth;
            depthBuffer[screenCoords + 1] = depth;
            depthBuffer[screenCoords + SCREEN_WIDTH] = depth;
            depthBuffer[screenCoords + SCREEN_WIDTH_P1] = depth;

            screenCoords += 2;//2 Right
        }
        //Step back to the first pixel before this iteration, then step 2 down.
        screenCoords += (SCREEN_WIDTH * 2) - 8;
        textureCoords += 12;
    }
}

/**
 * Renders a vertical stripe texture to the buffer.
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
export function render_stripe_right_safe_depthed(frameBuffer, depthBuffer, textureBuffer, SCREEN_WIDTH, SCREEN_HEIGHT, screenCoords, screen_x, screen_y){
    let depth = screen_y + 32
    let color = 0;
    let textureCoords = 12;
    const SCREEN_WIDTH_P1 = SCREEN_WIDTH + 1;
    const SCREEN_WIDTH_M2 = SCREEN_WIDTH - 2;
    const SCREEN_HEIGHT_M2 = SCREEN_HEIGHT - 2;
    screenCoords += 24; screen_x += 24;

    for(let i = 0; i < 16; i++){
        if(screen_y < 0 || screen_y > SCREEN_HEIGHT_M2){
            screen_y += 2;
            screenCoords += (SCREEN_WIDTH * 2);
            textureCoords += 16;
        continue;}
        for(let l = 0; l < 4; l++,
            screenCoords += 2,//2 Right
            screen_x += 2
        ){
            color = textureBuffer[textureCoords++];
            if(screen_x < 0 || screen_x > SCREEN_WIDTH_M2){ continue; }

            frameBuffer[screenCoords] = color;//Top left
            frameBuffer[screenCoords + 1] = color;//Top right
            frameBuffer[screenCoords + SCREEN_WIDTH] = color;//Bottom left
            frameBuffer[screenCoords + SCREEN_WIDTH_P1] = color;//Bottom right

            depthBuffer[screenCoords] = depth;
            depthBuffer[screenCoords + 1] = depth;
            depthBuffer[screenCoords + SCREEN_WIDTH] = depth;
            depthBuffer[screenCoords + SCREEN_WIDTH_P1] = depth;
        }
        //Step back to the first pixel before this iteration, then step 2 Down.
        screenCoords += (SCREEN_WIDTH * 2) - 8;
        textureCoords += 12;
        screen_x -= 8;
		screen_y += 2;
    }
}