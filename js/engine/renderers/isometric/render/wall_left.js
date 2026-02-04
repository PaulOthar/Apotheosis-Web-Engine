/**
 * Renders a parallelogram shaped texture to the buffer. (Steps towards X-)
 * BEWARE: This function does not account for screen dimentions safety.
 * @param {Uint32Array} frameBuffer frame to be written to.
 * @param {Uint16Array} depthBuffer buffer of depth, used in occlusion.
 * @param {Uint32Array} textureBuffer 16x16(256) texture buffer.
 * @param {Number} SCREEN_WIDTH width of the screen.
 * @param {Number} screenCoords placement coordinates.
 * @param {Number} screen_y where in y the first pixel will be rendered (used in depth calculations)
 */
export function render_wall_left_depthed(frameBuffer, depthBuffer, textureBuffer, SCREEN_WIDTH, screenCoords, screen_y){
    let depth = screen_y + 32;
    let color = 0;
    let textureCoords = 15;
    const SCREEN_WIDTH_M1 = SCREEN_WIDTH - 1;
    const SCREEN_WIDTH_M2 = SCREEN_WIDTH - 2;
    const SCREEN_WIDTH_T2_M1 = (SCREEN_WIDTH * 2) - 1;
    const SCREEN_WIDTH_T2 = SCREEN_WIDTH * 2;

    for(let i = 0; i < 16; i++){
        for(let l = 0; l < 16; l++){
            color = textureBuffer[textureCoords--];

            frameBuffer[screenCoords] = color;//Top right
            frameBuffer[screenCoords + SCREEN_WIDTH] = color;//Middle right
            frameBuffer[screenCoords + SCREEN_WIDTH_M1] = color;//Middle left
            frameBuffer[screenCoords + SCREEN_WIDTH_T2_M1] = color;//Bottom left

            depthBuffer[screenCoords] = depth;
            depthBuffer[screenCoords + SCREEN_WIDTH] = depth;
            depthBuffer[screenCoords + SCREEN_WIDTH_M1] = depth + 1;
            depthBuffer[screenCoords + SCREEN_WIDTH_T2_M1] = depth + 1;

            screenCoords += SCREEN_WIDTH_M2;//Step 1 down, 2 left
            depth += 1;
        }
        //Step back to the first pixel before this iteration, then step 2 down
        screenCoords += (SCREEN_WIDTH_T2) - ((SCREEN_WIDTH_M2) * 16)
        textureCoords += 32;
        depth -= 16;
    }
}

/**
 * Renders a parallelogram shaped texture to the buffer. (Steps towards X-)
 * BEWARE: This function does not account for screen dimentions safety.
 * @param {Uint32Array} frameBuffer frame to be written to.
 * @param {Uint16Array} depthBuffer buffer of depth, used in occlusion.
 * @param {Uint32Array} textureBuffer 16x16(256) texture buffer.
 * @param {Number} SCREEN_WIDTH width of the screen.
 * @param {Number} screenCoords placement coordinates.
 * @param {Number} screen_y where in y the first pixel will be rendered (used in depth calculations)
 */
export function render_wall_left_depthed_transparent(frameBuffer, depthBuffer, textureBuffer, SCREEN_WIDTH, screenCoords, screen_y){
    let depth = screen_y + 32;
    let color = 0;
    let textureCoords = 15;
    const SCREEN_WIDTH_M1 = SCREEN_WIDTH - 1;
    const SCREEN_WIDTH_M2 = SCREEN_WIDTH - 2;
    const SCREEN_WIDTH_T2_M1 = (SCREEN_WIDTH * 2) - 1;
    const SCREEN_WIDTH_T2 = SCREEN_WIDTH * 2;

    for(let i = 0; i < 16; i++){
        for(let l = 0; l < 16; l++,
            screenCoords += SCREEN_WIDTH_M2,//Step 1 down, 2 left
            depth += 1
        ){
            color = textureBuffer[textureCoords--];
            if(!color){ continue; }

            frameBuffer[screenCoords] = color;//Top right
            frameBuffer[screenCoords + SCREEN_WIDTH] = color;//Middle right
            frameBuffer[screenCoords + SCREEN_WIDTH_M1] = color;//Middle left
            frameBuffer[screenCoords + SCREEN_WIDTH_T2_M1] = color;//Bottom left

            depthBuffer[screenCoords] = depth;
            depthBuffer[screenCoords + SCREEN_WIDTH] = depth;
            depthBuffer[screenCoords + SCREEN_WIDTH_M1] = depth + 1;
            depthBuffer[screenCoords + SCREEN_WIDTH_T2_M1] = depth + 1;
        }
        //Step back to the first pixel before this iteration, then step 2 down
        screenCoords += (SCREEN_WIDTH_T2) - ((SCREEN_WIDTH_M2) * 16)
        textureCoords += 32;
        depth -= 16;
    }
}

/**
 * Renders a halfed parallelogram shaped texture (bottom half) to the buffer. (Steps towards X-)
 * BEWARE: This function does not account for screen dimentions safety.
 * @param {Uint32Array} frameBuffer frame to be written to.
 * @param {Uint16Array} depthBuffer buffer of depth, used in occlusion.
 * @param {Uint32Array} textureBuffer 16x16(256) texture buffer.
 * @param {Number} SCREEN_WIDTH width of the screen.
 * @param {Number} screenCoords placement coordinates. (uses full sized wall coordinates)
 * @param {Number} screen_y where in y the first pixel will be rendered (used in depth calculations)
 */
export function render_wall_left_halved_depthed(frameBuffer, depthBuffer, textureBuffer, SCREEN_WIDTH, screenCoords, screen_y){
    let depth = screen_y + 32;
    let color = 0;
    let textureCoords = 143;
    const SCREEN_WIDTH_M1 = SCREEN_WIDTH - 1;
    const SCREEN_WIDTH_M2 = SCREEN_WIDTH - 2;
    const SCREEN_WIDTH_T2_M1 = (SCREEN_WIDTH * 2) - 1;
    const SCREEN_WIDTH_T2 = SCREEN_WIDTH * 2;
    screenCoords += SCREEN_WIDTH * 16;
    for(let i = 0; i < 8; i++){
        for(let l = 0; l < 16; l++){
            color = textureBuffer[textureCoords--];

            frameBuffer[screenCoords] = color;//Top right
            frameBuffer[screenCoords + SCREEN_WIDTH] = color;//Middle right
            frameBuffer[screenCoords + SCREEN_WIDTH_M1] = color;//Middle left
            frameBuffer[screenCoords + SCREEN_WIDTH_T2_M1] = color;//Bottom left

            depthBuffer[screenCoords] = depth;
            depthBuffer[screenCoords + SCREEN_WIDTH] = depth;
            depthBuffer[screenCoords + SCREEN_WIDTH_M1] = depth + 1;
            depthBuffer[screenCoords + SCREEN_WIDTH_T2_M1] = depth + 1;

            screenCoords += SCREEN_WIDTH_M2;//Step 1 down, 2 left
            depth += 1;
        }
        //Step back to the first pixel before this iteration, then step 2 down
        screenCoords += (SCREEN_WIDTH_T2) - ((SCREEN_WIDTH_M2) * 16)
        textureCoords += 32;
        depth -= 16;
    }
}

/**
 * Renders a parallelogram shaped texture to the buffer. (Steps towards X-)
 * This function does account for screen dimentions safety.
 * @param {Uint32Array} frameBuffer frame to be written to.
 * @param {Uint16Array} depthBuffer buffer of depth, used in occlusion.
 * @param {Uint32Array} textureBuffer 16x16(256) texture buffer.
 * @param {Number} SCREEN_WIDTH width of the screen.
 * @param {Number} SCREEN_WIDTH height of the screen.
 * @param {Number} screenCoords placement coordinates.
 * @param {Number} screen_x where in x the first pixel will be rendered (used in safety calculations)
 * @param {Number} screen_y where in y the first pixel will be rendered (used in safety and depth calculations)
 */
export function render_wall_left_safe_depthed(frameBuffer, depthBuffer, textureBuffer, SCREEN_WIDTH, SCREEN_HEIGHT, screenCoords, screen_x, screen_y){
    let depth = screen_y + 32;
    let color = 0;
    let textureCoords = 15;
    const SCREEN_WIDTH_M1 = SCREEN_WIDTH - 1;
    const SCREEN_WIDTH_M2 = SCREEN_WIDTH - 2;
    const SCREEN_WIDTH_T2_M1 = (SCREEN_WIDTH * 2) - 1;
    const SCREEN_WIDTH_T2 = SCREEN_WIDTH * 2;
    const SCREEN_HEIGHT_M3 = SCREEN_HEIGHT - 3;

    for(let i = 0; i < 16; i++){
        for(let l = 0; l < 16; l++, 
            screenCoords += SCREEN_WIDTH_M2,//Step 1 down, 2 left
            depth += 1,
            screen_x -= 2,
            screen_y++
        ){
            color = textureBuffer[textureCoords--];
            if(screen_x < 1 || screen_y < 0 || screen_x > SCREEN_WIDTH_M2 || screen_y > SCREEN_HEIGHT_M3){ continue; }
            
            frameBuffer[screenCoords] = color;//Top right
            frameBuffer[screenCoords + SCREEN_WIDTH] = color;//Middle right
            frameBuffer[screenCoords + SCREEN_WIDTH_M1] = color;//Middle left
            frameBuffer[screenCoords + SCREEN_WIDTH_T2_M1] = color;//Bottom left

            depthBuffer[screenCoords] = depth;
            depthBuffer[screenCoords + SCREEN_WIDTH] = depth;
            depthBuffer[screenCoords + SCREEN_WIDTH_M1] = depth + 1;
            depthBuffer[screenCoords + SCREEN_WIDTH_T2_M1] = depth + 1;
        }
        //Step back to the first pixel before this iteration, then step 2 down
        screenCoords += (SCREEN_WIDTH_T2) - ((SCREEN_WIDTH_M2) * 16)
        textureCoords += 32;
        depth -= 16;
        screen_x += 32;
		screen_y -= 14;
    }
}

/**
 * Renders a parallelogram shaped texture to the buffer. (Steps towards X-)
 * This function does account for screen dimentions safety.
 * @param {Uint32Array} frameBuffer frame to be written to.
 * @param {Uint16Array} depthBuffer buffer of depth, used in occlusion.
 * @param {Uint32Array} textureBuffer 16x16(256) texture buffer.
 * @param {Number} SCREEN_WIDTH width of the screen.
 * @param {Number} SCREEN_WIDTH height of the screen.
 * @param {Number} screenCoords placement coordinates.
 * @param {Number} screen_x where in x the first pixel will be rendered (used in safety calculations)
 * @param {Number} screen_y where in y the first pixel will be rendered (used in safety and depth calculations)
 */
export function render_wall_left_safe_depthed_transparent(frameBuffer, depthBuffer, textureBuffer, SCREEN_WIDTH, SCREEN_HEIGHT, screenCoords, screen_x, screen_y){
    let depth = screen_y + 32;
    let color = 0;
    let textureCoords = 15;
    const SCREEN_WIDTH_M1 = SCREEN_WIDTH - 1;
    const SCREEN_WIDTH_M2 = SCREEN_WIDTH - 2;
    const SCREEN_WIDTH_T2_M1 = (SCREEN_WIDTH * 2) - 1;
    const SCREEN_WIDTH_T2 = SCREEN_WIDTH * 2;
    const SCREEN_HEIGHT_M3 = SCREEN_HEIGHT - 3;

    for(let i = 0; i < 16; i++){
        for(let l = 0; l < 16; l++, 
            screenCoords += SCREEN_WIDTH_M2,//Step 1 down, 2 left
            depth += 1,
            screen_x -= 2,
            screen_y++
        ){
            color = textureBuffer[textureCoords--];
            if(!color){ continue; }
            if(screen_x < 1 || screen_y < 0 || screen_x > SCREEN_WIDTH_M2 || screen_y > SCREEN_HEIGHT_M3){ continue; }
            
            frameBuffer[screenCoords] = color;//Top right
            frameBuffer[screenCoords + SCREEN_WIDTH] = color;//Middle right
            frameBuffer[screenCoords + SCREEN_WIDTH_M1] = color;//Middle left
            frameBuffer[screenCoords + SCREEN_WIDTH_T2_M1] = color;//Bottom left

            depthBuffer[screenCoords] = depth;
            depthBuffer[screenCoords + SCREEN_WIDTH] = depth;
            depthBuffer[screenCoords + SCREEN_WIDTH_M1] = depth + 1;
            depthBuffer[screenCoords + SCREEN_WIDTH_T2_M1] = depth + 1;
        }
        //Step back to the first pixel before this iteration, then step 2 down
        screenCoords += (SCREEN_WIDTH_T2) - ((SCREEN_WIDTH_M2) * 16)
        textureCoords += 32;
        depth -= 16;
        screen_x += 32;
		screen_y -= 14;
    }
}

/**
 * Renders a halfed parallelogram shaped texture (bottom half) to the buffer. (Steps towards X-)
 * This function does account for screen dimentions safety.
 * @param {Uint32Array} frameBuffer frame to be written to.
 * @param {Uint16Array} depthBuffer buffer of depth, used in occlusion.
 * @param {Uint32Array} textureBuffer 16x16(256) texture buffer.
 * @param {Number} SCREEN_WIDTH width of the screen.
 * @param {Number} SCREEN_WIDTH height of the screen.
 * @param {Number} screenCoords placement coordinates.
 * @param {Number} screen_x where in x the first pixel will be rendered (used in safety calculations)
 * @param {Number} screen_y where in y the first pixel will be rendered (used in safety and depth calculations)
 */
export function render_wall_left_safe_halved_depthed(frameBuffer, depthBuffer, textureBuffer, SCREEN_WIDTH, SCREEN_HEIGHT, screenCoords, screen_x, screen_y){
    let depth = screen_y + 32;
    let color = 0;
    let textureCoords = 143;
    const SCREEN_WIDTH_M1 = SCREEN_WIDTH - 1;
    const SCREEN_WIDTH_M2 = SCREEN_WIDTH - 2;
    const SCREEN_WIDTH_T2_M1 = (SCREEN_WIDTH * 2) - 1;
    const SCREEN_WIDTH_T2 = SCREEN_WIDTH * 2;
    const SCREEN_HEIGHT_M3 = SCREEN_HEIGHT - 3;
    screenCoords += SCREEN_WIDTH * 16;
    screen_y += 16;
    for(let i = 0; i < 8; i++){
        for(let l = 0; l < 16; l++, 
            screenCoords += SCREEN_WIDTH_M2,//Step 1 down, 2 left
            depth += 1,
            screen_x -= 2,
            screen_y++
        ){
            color = textureBuffer[textureCoords--];
            if(screen_x < 1 || screen_y < 0 || screen_x > SCREEN_WIDTH_M2 || screen_y > SCREEN_HEIGHT_M3){ continue; }

            frameBuffer[screenCoords] = color;//Top right
            frameBuffer[screenCoords + SCREEN_WIDTH] = color;//Middle right
            frameBuffer[screenCoords + SCREEN_WIDTH_M1] = color;//Middle left
            frameBuffer[screenCoords + SCREEN_WIDTH_T2_M1] = color;//Bottom left

            depthBuffer[screenCoords] = depth;
            depthBuffer[screenCoords + SCREEN_WIDTH] = depth;
            depthBuffer[screenCoords + SCREEN_WIDTH_M1] = depth + 1;
            depthBuffer[screenCoords + SCREEN_WIDTH_T2_M1] = depth + 1;
        }
        //Step back to the first pixel before this iteration, then step 2 down
        screenCoords += (SCREEN_WIDTH_T2) - ((SCREEN_WIDTH_M2) * 16)
        textureCoords += 32;
        depth -= 16;
        screen_x += 32;
		screen_y -= 14;
    }
}