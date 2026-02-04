export function render_hexal_depthed(frameBuffer, depthBuffer, textureBuffer, SCREEN_WIDTH, screenCoords, screen_y, depthModifier){
    let depth = screen_y + 64 + depthModifier;
    let color = 0;
    let textureCoords = 0;
    for(let i = 0; i < 64; i++){
        for(let l = 0; l < 64; l++, screenCoords++){
            color = textureBuffer[textureCoords++];
            if(!color){ continue; }
            frameBuffer[screenCoords] = color;
            depthBuffer[screenCoords] = depth;
        }
        screenCoords += SCREEN_WIDTH - 64;
    }
}

export function render_hexal_safe_depthed(frameBuffer, depthBuffer, textureBuffer, SCREEN_WIDTH, SCREEN_HEIGHT, screenCoords, screen_x, screen_y, depthModifier){
    const SCREEN_WIDTH_M64 = SCREEN_WIDTH - 64;
    const SCREEN_HEIGHT_M64 = SCREEN_HEIGHT - 64;

    let minx = screen_x < 0 ? (-screen_x) : 0;
    let maxx = screen_x > SCREEN_WIDTH_M64 ? 64 - (screen_x - SCREEN_WIDTH_M64) : 64;

    let miny = screen_y < 0 ? (-screen_y) : 0;
	let maxy = screen_y > SCREEN_HEIGHT_M64 ? 64 - (screen_y - SCREEN_HEIGHT_M64) : 64;

    screenCoords += minx + (miny * SCREEN_WIDTH);
    let textureCoords = (minx + (miny * 64));

    let depth = screen_y + 64 + depthModifier;
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
        initialTextureCoords += 64; textureCoords = initialTextureCoords;
    }
}