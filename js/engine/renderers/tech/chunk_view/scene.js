import { ApotheosisEngine } from "../../../engine.js";

export function _tech_chunk_view_movement(engine, left, right, top, bottom){
    let x = 0; let y = 0; let speed = engine.camera_speed;

    if(left){ x = speed; }
    if(right){ x = -speed; }
    if(top){ y = speed; }
    if(bottom){ y = -speed; }

    engine.world_c.step(x, y);
}

let distance_colors = new Uint32Array(17);
for(let i = 0; i < 16; i++){
    let color = 0xfff << i;
    distance_colors[i] = color | 0xff000000;
}
distance_colors[0] = 0xffffffff;
distance_colors[16] = 0xff885500;

/**
 * @param {ApotheosisEngine} engine engine that holds all contexts
 */
export function _tech_chunk_view_scene(engine){
    const pixels = engine.screen_c.pixels;
    const SCREEN_WIDTH = engine.screen_c.SCREEN_WIDTH;
    const chunks = engine.world_c.chunkCodes;
    let block_width = engine.screen_c.SCREEN_WIDTH >> 4;
    let block_height = engine.screen_c.SCREEN_HEIGHT >> 4;

    let local_chunk = new Int16Array(2);
    local_chunk[0] = (engine.world_c.world_x >> 9) & 0xffff;
    local_chunk[1] = (engine.world_c.world_y >> 9) & 0xffff;

    let current_chunk = new Uint32Array(1);
    let current_coords = new Int16Array(current_chunk.buffer);

    let length_1 = 0;
    let length_2 = 0;

    for(let y = 0; y < 16; y++){
        let chunk_ptr = ((15 - y) * 16) + 15;
        let block_coords = y * block_height * SCREEN_WIDTH;
        for(let x = 0; x < 16; x++, block_coords += block_width, chunk_ptr--){
            current_chunk[0] = chunks[chunk_ptr & 0xff];
            length_1 = Math.abs(current_coords[0] - local_chunk[0]);
            length_2 = Math.abs(current_coords[1] - local_chunk[1]);
            let distance = length_1;
            if(length_2 > length_1){ distance = length_2; }

            if(distance > 16) distance = 16;
            _tech_chunk_view_render_block(pixels, SCREEN_WIDTH, block_coords, block_width, block_height, distance_colors[distance]);
        }
    }
}

function _tech_chunk_view_render_block(pixels, SCREEN_WIDTH, coords, width, height, color){
    for(let y = 0; y < height; y++){
        if(y == height - 1){ color = 0xff000000; }
        let ptr = coords + y * SCREEN_WIDTH;
        for(let x = 0; x < width; x++, ptr++){
            pixels[ptr] = color;
        }
        pixels[ptr - 1] = 0xff000000;
    }
}