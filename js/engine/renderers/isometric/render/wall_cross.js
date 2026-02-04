import { render_wall_left_depthed } from "./wall_left.js";
import { render_wall_right_depthed } from "./wall_right.js";

function render_wall_vertical_half_depthed_transparent(frameBuffer, depthBuffer, textureBuffer, SCREEN_WIDTH, adjacent_step, screenCoords, depth, textureCoords, screen_step_next, screen_step_down, depth_step_next, depth_step_down, texture_step_next, texture_step_down){
    let color = 0;
    const SCREEN_WIDTH_ADJ = SCREEN_WIDTH + adjacent_step;
    const SCREEN_WIDTH_T2_ADJ = (SCREEN_WIDTH * 2) + adjacent_step;
    
    for(let i = 0; i < 16; i++){
        for(let l = 0; l < 8; l++, screenCoords += screen_step_next, depth += depth_step_next, textureCoords += texture_step_next){
            color = textureBuffer[textureCoords];
            if(!color){ continue; }
            frameBuffer[screenCoords] = color;
            frameBuffer[screenCoords + SCREEN_WIDTH] = color;
            frameBuffer[screenCoords + SCREEN_WIDTH_ADJ] = color;
            frameBuffer[screenCoords + SCREEN_WIDTH_T2_ADJ] = color;
            depthBuffer[screenCoords] = depth;
            depthBuffer[screenCoords + SCREEN_WIDTH] = depth;
            depthBuffer[screenCoords + SCREEN_WIDTH_ADJ] = depth + 1;
            depthBuffer[screenCoords + SCREEN_WIDTH_T2_ADJ] = depth + 1;
        }
        screenCoords += screen_step_down;
        depth += depth_step_down;
        textureCoords += texture_step_down;
    }
}

export function render_wall_cross_depthed_transparent(frameBuffer, depthBuffer, textureBuffer, SCREEN_WIDTH, screenCoords, screen_y, config){
    switch(config){
        case 0b0101: render_wall_left_depthed(frameBuffer, depthBuffer, textureBuffer, SCREEN_WIDTH, screenCoords, screen_y); return;
        case 0b1010: render_wall_right_depthed(frameBuffer, depthBuffer, textureBuffer, SCREEN_WIDTH, screenCoords, screen_y); return;
    }

    const SCREEN_WIDTH_M2 = SCREEN_WIDTH - 2;
    const SCREEN_WIDTH_T2 = SCREEN_WIDTH * 2;
    const SCREEN_WIDTH_P2 = SCREEN_WIDTH + 2;

    const leftCoords = screenCoords + 16 - (24 * SCREEN_WIDTH);
    const rightCoords = screenCoords - 15 - (24 * SCREEN_WIDTH);

    screen_y += 24;
    let depth = screen_y + 32;

    let color = 0xff00ff00;

    if(config & 0b0001){
        render_wall_vertical_half_depthed_transparent(
            frameBuffer, depthBuffer, textureBuffer,
            SCREEN_WIDTH, -1, leftCoords, depth, 7,
            SCREEN_WIDTH_M2, (SCREEN_WIDTH_T2) - ((SCREEN_WIDTH_M2) * 8),
            1, -16, 
            -1, 24
        );
    }
    if(config & 0b0010){
        render_wall_vertical_half_depthed_transparent(
            frameBuffer, depthBuffer, textureBuffer,
            SCREEN_WIDTH, 1, rightCoords, depth, 0,
            SCREEN_WIDTH_P2, (SCREEN_WIDTH_T2) - ((SCREEN_WIDTH_P2) * 8),
            1, -16, 
            1, 8
        );
    }
    if(config & 0b0100){
        render_wall_vertical_half_depthed_transparent(
            frameBuffer, depthBuffer, textureBuffer,
            SCREEN_WIDTH, -1, leftCoords + ((SCREEN_WIDTH_M2) * 8), depth + 8, 15,
            SCREEN_WIDTH_M2, (SCREEN_WIDTH_T2) - ((SCREEN_WIDTH_M2) * 8),
            1, -16, 
            -1, 24
        );
    }
    if(config & 0b1000){
        render_wall_vertical_half_depthed_transparent(
            frameBuffer, depthBuffer, textureBuffer,
            SCREEN_WIDTH, 1, rightCoords + ((SCREEN_WIDTH_P2) * 8), depth + 8, 8,
            SCREEN_WIDTH_P2, (SCREEN_WIDTH_T2) - ((SCREEN_WIDTH_P2) * 8),
            1, -16, 
            1, 8
        );
    }
}