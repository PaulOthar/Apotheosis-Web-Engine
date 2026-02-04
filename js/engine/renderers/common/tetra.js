export function render_tetra_depthed(frameBuffer, depthBuffer, textureBuffer, SCREEN_WIDTH, screenCoords, screen_y, depthModifier){
    let depth = screen_y + 32 + depthModifier;
    let color = 0;
    let textureCoords = 0;
    for(let i = 0; i < 32; i++){
        for(let l = 0; l < 32; l++, screenCoords++){
            color = textureBuffer[textureCoords++];
            if(!color){ continue; }
            frameBuffer[screenCoords] = color;
            depthBuffer[screenCoords] = depth;
        }
        screenCoords += SCREEN_WIDTH - 32;
    }
}

export function render_tetra_safe_depthed(frameBuffer, depthBuffer, textureBuffer, SCREEN_WIDTH, SCREEN_HEIGHT, screenCoords, screen_x, screen_y, depthModifier){
    const SCREEN_WIDTH_M32 = SCREEN_WIDTH - 32;
    const SCREEN_HEIGHT_M32 = SCREEN_HEIGHT - 32;

    let minx = screen_x < 0 ? (-screen_x) : 0;
    let maxx = screen_x > SCREEN_WIDTH_M32 ? 32 - (screen_x - SCREEN_WIDTH_M32) : 32;

    let miny = screen_y < 0 ? (-screen_y) : 0;
	let maxy = screen_y > SCREEN_HEIGHT_M32 ? 32 - (screen_y - SCREEN_HEIGHT_M32) : 32;

    screenCoords += minx + (miny * SCREEN_WIDTH);
    let textureCoords = (minx + (miny * 32));

    let depth = screen_y + 32 + depthModifier;
    let color = 0;

    let initialScreenCoords = screenCoords;
    let initialTextureCoords = textureCoords;
    for(let i = miny; i < maxy; i++){
        for(let l = minx; l < maxx; l++, screenCoords++, textureCoords++){
            color = textureBuffer[textureCoords];
            if(!color){ continue; }
            frameBuffer[screenCoords] = color;
            depthBuffer[screenCoords] = depth;
        }
        initialScreenCoords += SCREEN_WIDTH; screenCoords = initialScreenCoords;
        initialTextureCoords += 32; textureCoords = initialTextureCoords;
    }
}

export function render_tetra_depthed_volatile(frameBuffer, depthBuffer, textureBuffer, SCREEN_WIDTH, screenCoords, screen_y, depthModifier, orientation){
    let depth = screen_y + 32 + depthModifier;
    let color = 0;

    let textureStart = 0;
    let textureStep = 1;
    let textureIncrement = 0;
    switch(orientation){
        default: break;
        case 1: textureStart = 31; textureStep = -1; textureIncrement = 64; break;
    }

    let textureCoords = textureStart;
    for(let i = 0; i < 32; i++){
        for(let l = 0; l < 32; l++, screenCoords++){
            color = textureBuffer[textureCoords];
            textureCoords += textureStep;
            if(!color){ continue; }
            frameBuffer[screenCoords] = color;
            depthBuffer[screenCoords] = depth;
        }
        textureCoords += textureIncrement;
        screenCoords += SCREEN_WIDTH - 32;
    }
}

export function render_tetra_safe_depthed_volatile(frameBuffer, depthBuffer, textureBuffer, SCREEN_WIDTH, SCREEN_HEIGHT, screenCoords, screen_x, screen_y, depthModifier, orientation){
    const SCREEN_WIDTH_M32 = SCREEN_WIDTH - 32;
    const SCREEN_HEIGHT_M32 = SCREEN_HEIGHT - 32;

    let minx = screen_x < 0 ? (-screen_x) : 0;
    let maxx = screen_x > SCREEN_WIDTH_M32 ? 32 - (screen_x - SCREEN_WIDTH_M32) : 32;

    let miny = screen_y < 0 ? (-screen_y) : 0;
	let maxy = screen_y > SCREEN_HEIGHT_M32 ? 32 - (screen_y - SCREEN_HEIGHT_M32) : 32;

    let textureStart = minx;
    let textureStep = 1;
    switch(orientation){
        default: break;
        case 1: textureStart = 31 - minx; textureStep = -1; break;
    }

    screenCoords += minx + (miny * SCREEN_WIDTH);
    let textureCoords = (textureStart + (miny * 32));

    let depth = screen_y + 32 + depthModifier;
    let color = 0;

    let initialScreenCoords = screenCoords;
    let initialTextureCoords = textureCoords;
    for(let i = miny; i < maxy; i++){
        for(let l = minx; l < maxx; l++, screenCoords++, textureCoords += textureStep){
            color = textureBuffer[textureCoords];
            if(!color){ continue; }
            frameBuffer[screenCoords] = color;
            depthBuffer[screenCoords] = depth;
        }
        initialScreenCoords += SCREEN_WIDTH; screenCoords = initialScreenCoords;
        initialTextureCoords += 32; textureCoords = initialTextureCoords;
    }
}