import {ApotheosisEngine} from "../../engine.js"

export function flat_movement(engine, left, right, top, bottom){
    let x = 0; let y = 0; let speed = engine.camera_speed;

    if(left){ x = speed; }
    if(right){ x = -speed; }
    if(top){ y = speed; }
    if(bottom){ y = -speed; }

    engine.world_c.step(x, y);
}

/**
 * Renders a flat scene
 * @param {ApotheosisEngine} engine engine that holds all contexts
 */
export function flat_scene_render(engine){
    let SCREEN_WIDTH_D2 = engine.screen_c.SCREEN_WIDTH / 2;
    let SCREEN_HEIGHT_D2 = engine.screen_c.SCREEN_HEIGHT / 2;
    let world_x = engine.world_c.world_x + SCREEN_WIDTH_D2;
    let world_y = engine.world_c.world_y + SCREEN_HEIGHT_D2;

    let grid_x = (world_x >> 5) & 0xff;//where x in the (256x256 grid) we are
	let grid_y = (world_y >> 5) & 0xff;//where y in the (256x256 grid) we are
	let cell_x = world_x & 0x1f;//where x in the (32x32 cell) we are
	let cell_y = world_y & 0x1f;//where y in the (32x32 cell) we are

    //where in the cell located in the top left corner we are, so we can offset the screen.
    let corner_x = cell_x;
	let corner_y = cell_y;

    scene_render_top(engine, grid_x, grid_y, corner_x, corner_y);
    scene_render_middle(engine, grid_x, grid_y, corner_x, corner_y);
    scene_render_bottom(engine, grid_x, grid_y, corner_x, corner_y);
}

//-----------------------------------------------------------------------------------

/**
 * Renders the top part of the screen, using only safe methods of rendering.
 * @param {ApotheosisEngine} engine engine that holds all contexts
 * @param {Number} grid_x where x in the (256x256 grid) we are
 * @param {Number} grid_y where y in the (256x256 grid) we are
 * @param {Number} corner_x where x in the top left (32x32 cell) we are
 * @param {Number} corner_y where y in the top left (32x32 cell) we are
 * @see WorldTile used in chunk
 */
function scene_render_top(engine, grid_x, grid_y, corner_x, corner_y){
	let x1 = 0, y1 = 0, p1 = 0, x2 = 0, y2 = 0, p2 = 0;
	let gx1 = 0, gy1 = 0, gx2 = 0, gy2 = 0;
	let size1 = 0;

	const SCREEN_WIDTH = engine.screen_c.SCREEN_WIDTH;
	const SCREEN_WIDTH_D32 = engine.screen_c.SCREEN_WIDTH >> 5;

	let sizeinc = (SCREEN_WIDTH & 32) ? 1 : 0;

    x1 = -32; y1 = -32;

	x1 += corner_x; y1 += corner_y; x2 += corner_x; y2 += corner_y;
	p1 = x1 + (y1 * SCREEN_WIDTH); p2 = x2 + (y2 * SCREEN_WIDTH);
	gx1 += grid_x; gy1 += grid_y; gx2 += grid_x; gy2 += grid_y;

    size1 = SCREEN_WIDTH_D32 + sizeinc + 1;

	scene_render_row_safe(engine, x1, y1, p1, gx1, gy1, size1);
    //scene_render_row_safe(engine, x2, y2, p2, gx2, gy2, size1);
}

/**
 * Renders the middle part of the screen, using both safe and unsafe methods of rendering.
 * @param {ApotheosisEngine} engine engine that holds all contexts
 * @param {Number} grid_x where x in the (256x256 grid) we are
 * @param {Number} grid_y where y in the (256x256 grid) we are
 * @param {Number} corner_x where x in the top left (32x32 cell) we are
 * @param {Number} corner_y where y in the top left (32x32 cell) we are
 * @see WorldTile used in chunk
 */
function scene_render_middle(engine, grid_x, grid_y, corner_x, corner_y){
    let x1 = 0, y1 = 0, p1 = 0, x2 = 0, y2 = 0, p2 = 0;
	let gx1 = 0, gy1 = 0, gx2 = 0, gy2 = 0;
	let size1 = 0;

    const SCREEN_WIDTH = engine.screen_c.SCREEN_WIDTH;
    const SCREEN_HEIGHT = engine.screen_c.SCREEN_HEIGHT;
	const SCREEN_WIDTH_D32 = engine.screen_c.SCREEN_WIDTH >> 5;

	let sizeinc = (SCREEN_WIDTH & 32) ? 1 : 0;

    x1 -= 32; gy1 = -1;

	x1 += corner_x; y1 += corner_y; x2 += corner_x; y2 += corner_y;
	p1 = x1 + (y1 * SCREEN_WIDTH); p2 = x2 + (y2 * SCREEN_WIDTH);
	gx1 += grid_x; gy1 += grid_y; gx2 += grid_x; gy2 += grid_y;

    size1 = SCREEN_WIDTH_D32 + sizeinc + 1;

    const SCREEN_WIDTH_T32 = SCREEN_WIDTH * 32;

	scene_render_row_unsafe(engine, x1, y1, p1, gx1, gy1, size1);
	y1 += 32; p1 += SCREEN_WIDTH_T32; gy1--;

	let height = (SCREEN_HEIGHT / 32) - 1;
	for(let i = 1;i<height;i++){
		scene_render_row(engine, x1, y1, p1, gx1, gy1, size1);
		y1 += 32; p1 += SCREEN_WIDTH_T32; gy1--;
	}
}

/**
 * Renders the bottom part of the screen, using only safe methods of rendering.
 * @param {ApotheosisEngine} engine engine that holds all contexts
 * @param {Number} grid_x where x in the (256x256 grid) we are
 * @param {Number} grid_y where y in the (256x256 grid) we are
 * @param {Number} corner_x where x in the top left (32x32 cell) we are
 * @param {Number} corner_y where y in the top left (32x32 cell) we are
 * @see WorldTile used in chunk
 */
function scene_render_bottom(engine, grid_x, grid_y, corner_x, corner_y){
	let x1 = 0, y1 = 0, p1 = 0, x2 = 0, y2 = 0, p2 = 0;
	let gx1 = 0, gy1 = 0, gx2 = 0, gy2 = 0;
	let size1 = 0;

	const SCREEN_WIDTH = engine.screen_c.SCREEN_WIDTH;
	const SCREEN_WIDTH_D32 = engine.screen_c.SCREEN_WIDTH >> 5;
	const SCREEN_HEIGHT = engine.screen_c.SCREEN_HEIGHT;
	const SCREEN_HEIGHT_D32 = SCREEN_HEIGHT >> 5;

	let sizeinc = (SCREEN_WIDTH & 32) ? 1 : 0;
	let height = ((SCREEN_HEIGHT_D32) * 32) -32;

    x1 = -32; y1 += height; gy1 = -SCREEN_HEIGHT_D32;

	x1 += corner_x; y1 += corner_y; x2 += corner_x; y2 += corner_y;
	p1 = x1 + (y1 * SCREEN_WIDTH); p2 = x2 + (y2 * SCREEN_WIDTH);
	gx1 += grid_x; gy1 += grid_y; gx2 += grid_x; gy2 += grid_y;

    size1 = SCREEN_WIDTH_D32 + sizeinc + 1;

	scene_render_row_safe(engine, x1, y1, p1, gx1, gy1, size1);
}

//-----------------------------------------------------------------------------------

/**
 * Renders a row of tiles, using both safe and unsafe methods.
 * @param {ApotheosisEngine} engine engine that holds all contexts
 * @param {Number} x x axis of the first tile, in screen space
 * @param {Number} y y axis of the first tile, in screen space
 * @param {Number} p coordinates(x + (y * width)) of the first tile, in screen space
 * @param {Number} gx x axis of the first tile, in world context space
 * @param {Number} gy y axis of the first tile, in world context space
 * @param {Number} size how many tiles we will render in this row (based on the screen width)
 */
function scene_render_row(engine, x, y, p, gx, gy, size){
    gx &= 0xff; gy &= 0xff;//stupid byte bound for javascript only
    let gp = gx + (gy << 8);//grid position
    const TILE_WIDTH = 32;//not so magic number

    const screen_c = engine.screen_c;
    const texture_c = engine.texture_c;
    const tiles = engine.world_c.tiles;

	scene_render_tile_safe(screen_c, texture_c, x, y, p, tiles[gp]);
	x += TILE_WIDTH; p += TILE_WIDTH;
	gx--;
    gx &= 0xff; gy &= 0xff;//stupid byte bound for javascript only
    gp = gx + (gy << 8);
	for(let i = 1;i<size - 1;i++){
        if(!tiles[gp]){debugger}
		scene_render_tile(screen_c, texture_c, x, y, p, tiles[gp]);
		x += TILE_WIDTH; p += TILE_WIDTH;
		gx--;
        gx &= 0xff; gy &= 0xff;//stupid byte bound for javascript only
        gp = gx + (gy << 8);
	}
	scene_render_tile_safe(screen_c, texture_c, x, y, p, tiles[gp]);
}

/**
 * Renders a row of tiles, using both safe and unsafe methods.
 * @param {ApotheosisEngine} engine engine that holds all contexts
 * @param {Number} x x axis of the first tile, in screen space
 * @param {Number} y y axis of the first tile, in screen space
 * @param {Number} p coordinates(x + (y * width)) of the first tile, in screen space
 * @param {Number} gx x axis of the first tile, in world context space
 * @param {Number} gy y axis of the first tile, in world context space
 * @param {Number} size how many tiles we will render in this row (based on the screen width)
 */
function scene_render_row_unsafe(engine, x, y, p, gx, gy, size){
	gx &= 0xff; gy &= 0xff;//stupid byte bound for javascript only
	let gp = gx + (gy << 8);
	const TILE_WIDTH = 32;//not so magic number

    const screen_c = engine.screen_c;
    const texture_c = engine.texture_c;
    const tiles = engine.world_c.tiles;

	scene_render_tile_safe(screen_c, texture_c, x, y, p, tiles[gp]);
	x += TILE_WIDTH; p += TILE_WIDTH;
	gx--;
	gx &= 0xff; gy &= 0xff;//stupid byte bound for javascript only
	gp = gx + (gy << 8);
	for(let i = 1;i<size - 1;i++){
		scene_render_tile_unsafe(screen_c, texture_c, x, y, p, tiles[gp]);
		x += TILE_WIDTH; p += TILE_WIDTH;
		gx--;
		gx &= 0xff; gy &= 0xff;//stupid byte bound for javascript only
		gp = gx + (gy << 8);
	}
	scene_render_tile_safe(screen_c, texture_c, x, y, p, tiles[gp]);
}

/**
 * Renders a row of tiles, using only safe methods.
 * @param {ApotheosisEngine} engine engine that holds all contexts
 * @param {Number} x x axis of the first tile, in screen space
 * @param {Number} y y axis of the first tile, in screen space
 * @param {Number} p coordinates(x + (y * width)) of the first tile, in screen space
 * @param {Number} gx x axis of the first tile, in world context space
 * @param {Number} gy y axis of the first tile, in world context space
 * @param {Number} size how many tiles we will render in this row (based on the screen width)
 */
function scene_render_row_safe(engine, x, y, p, gx, gy, size){
	gx &= 0xff; gy &= 0xff;//stupid byte bound for javascript only
	let gp = gx + (gy << 8);
	const TILE_WIDTH = 32;//not so magic number

    const screen_c = engine.screen_c;
    const texture_c = engine.texture_c;
    const tiles = engine.world_c.tiles;

	for(let i = 0;i<size;i++){
		scene_render_tile_safe(screen_c, texture_c, x, y, p, tiles[gp]);
		x += TILE_WIDTH; p += TILE_WIDTH;
		gx--; 
		gx &= 0xff; gy &= 0xff;//stupid byte bound for javascript only
		gp = gx + (gy << 8);
	}
}

//-----------------------------------------------------------------------------------

import CONSTANTS from '../../constants.json' with { type: "json" };
import { TILE_FLAGS } from "../../context/world.js";
import { render_block, render_block_depthed, render_block_halved_depthed, render_block_safe, render_block_safe_depthed, render_block_safe_halved_depthed } from "./render/block.js";
import { render_stripe_left_depthed, render_stripe_left_safe_depthed, render_stripe_right_depthed, render_stripe_right_safe_depthed } from "./render/stipe.js";
import { scene_render_furniture, scene_render_safe_furniture } from "./sceneFurniture.js";

/**
 * Renders a single tile, using unsafe methods.
 * A tile may include walls, floor and furniture.
 * @param {ScreenContext} screen_c screen context, for interfacing with the output device
 * @param {TextureContext} texture_c texture context, for grabbing textures
 * @param {Number} x x axis of the tile, in screen space
 * @param {Number} y y axis of the tile, in screen space
 * @param {Number} p coordinates(x + (y * width)) of the tile, in screen space
 * @param {WorldTile} cell cell data
 */
function scene_render_tile(screen_c, texture_c, x, y, p, cell){
    let flags = cell.flags;//for more direct access
    if(!(flags & TILE_FLAGS.SIGHTED)){//if it isnt known nor has been seen, render voidTexture.
        render_block(screen_c.pixels, screen_c.depth, texture_c.voidTexture, screen_c.SCREEN_WIDTH, p);
        return;
    }

    let walled = cell.furniture_type == CONSTANTS.ORNAMENT_WALL;
    let graphics_index = walled ? cell.texture_furniture : cell.texture_floor;
    let texture_darkened = texture_c.objectTile[graphics_index + 16];
    graphics_index += (flags & TILE_FLAGS.SEEN) ? 0 : 16;
    let texture = texture_c.objectTile[graphics_index];

    const pixels = screen_c.pixels;//for more direct access
    const depth = screen_c.depth;//for more direct access
    const width = screen_c.SCREEN_WIDTH;//for more direct access

    if(!walled){
        render_block(pixels, depth, texture, width, p);
        if(graphics_index > 15){ return; }//This is a obscure tile, therefore doesnt render furniture
        //if(cell.flood){ render_floor_transparent(pixels, depth, texture_c.objectBasic[cell.flood], width, p); }
        if(cell.furniture_type > 0){ scene_render_furniture(screen_c, texture_c, x, y, p, cell); }
        return;
    }
    render_block(pixels, depth, texture_c.voidTexture, width, p);
	
    if(flags & TILE_FLAGS.TOP){//uses darkened
        render_block_halved_depthed(pixels, depth, texture_darkened, width, p - (width * 32), y - 32);}
    if(flags & TILE_FLAGS.LEFT){
        render_stripe_left_depthed(pixels, depth, texture, width, p - (width * 16), y - 16);}
    if(flags & TILE_FLAGS.RIGHT){
        render_stripe_right_depthed(pixels, depth, texture, width, p - (width * 16), y - 16);}
    if(flags & TILE_FLAGS.BOTTOM){
        render_block_depthed(pixels, depth, texture, width, p, y); return;}
}

/**
 * Renders a single tile, using safe(walls and furniture) and unsafe(floor) methods.
 * Ideal for rendering unsafe tiles at the very top of the screen.
 * A tile may include walls, floor and furniture.
 * @param {ScreenContext} screen_c screen context, for interfacing with the output device
 * @param {TextureContext} texture_c texture context, for grabbing textures
 * @param {Number} x x axis of the tile, in screen space
 * @param {Number} y y axis of the tile, in screen space
 * @param {Number} p coordinates(x + (y * width)) of the tile, in screen space
 * @param {WorldTile} cell cell data
 */
function scene_render_tile_unsafe(screen_c, texture_c, x, y, p, cell){
    let flags = cell.flags;//for more direct access
    if(!(flags & TILE_FLAGS.SIGHTED)){//if it isnt known nor has been seen, render voidTexture.
        render_block(screen_c.pixels, screen_c.depth, texture_c.voidTexture, screen_c.SCREEN_WIDTH, p);
        return;
    }

    let walled = cell.furniture_type == CONSTANTS.ORNAMENT_WALL;
    let graphics_index = walled ? cell.texture_furniture : cell.texture_floor;
    let texture_darkened = texture_c.objectTile[graphics_index + 16];
    graphics_index += (flags & TILE_FLAGS.SEEN) ? 0 : 16;
    let texture = texture_c.objectTile[graphics_index];

    let pixels = screen_c.pixels;//for more direct access
    let depth = screen_c.depth;//for more direct access
    let width = screen_c.SCREEN_WIDTH;//for more direct access
    let height = screen_c.SCREEN_HEIGHT;//for more direct access

    if(!walled){
        render_block(pixels, depth, texture, width, p);
        if(graphics_index > 15){ return; }//This is a obscure tile, therefore doesnt render furniture
        //if(cell.flood){ render_floor_transparent(pixels, depth, texture_c.objectBasic[cell.flood], width, p); }
        if(cell.furniture_type > 0){ scene_render_safe_furniture(screen_c, texture_c, x, y, p, cell); }
        return;
    }
    render_block(pixels, depth, texture_c.voidTexture, width, p);

    if(flags & TILE_FLAGS.TOP){//uses darkened
        render_block_safe_halved_depthed(pixels, depth, texture_darkened, width, height, p - (width * 32), x, y - 32);}
    if(flags & TILE_FLAGS.LEFT){
        render_stripe_left_depthed(pixels, depth, texture, width, p - (16 * width), y - 16);}
    if(flags & TILE_FLAGS.RIGHT){
        render_stripe_right_depthed(pixels, depth, texture, width, p - (16 * width), y - 16);}
    if(flags & TILE_FLAGS.BOTTOM){
        render_block_depthed(pixels, depth, texture, width, p, y); return;}
    
}

/**
 * Renders a single tile, using safe(walls and furniture) and unsafe(floor) methods.
 * Ideal for rendering unsafe tiles at the very top of the screen.
 * A tile may include walls, floor and furniture.
 * @param {ScreenContext} screen_c screen context, for interfacing with the output device
 * @param {TextureContext} texture_c texture context, for grabbing textures
 * @param {Number} x x axis of the tile, in screen space
 * @param {Number} y y axis of the tile, in screen space
 * @param {Number} p coordinates(x + (y * width)) of the tile, in screen space
 * @param {WorldTile} cell cell data
 */
function scene_render_tile_safe(screen_c, texture_c, x, y, p, cell){
    let flags = cell.flags;//for more direct access
    if(!(flags & TILE_FLAGS.SIGHTED)){//if it isnt known nor has been seen, render voidTexture.
        render_block_safe(screen_c.pixels, screen_c.depth, texture_c.voidTexture, screen_c.SCREEN_WIDTH, screen_c.SCREEN_HEIGHT, p, x, y);
        return;
    }

    let walled = cell.furniture_type == CONSTANTS.ORNAMENT_WALL;
    let graphics_index = walled ? cell.texture_furniture : cell.texture_floor;
    let texture_darkened = texture_c.objectTile[graphics_index + 16];
    graphics_index += (flags & TILE_FLAGS.SEEN) ? 0 : 16;
    let texture = texture_c.objectTile[graphics_index];

    let pixels = screen_c.pixels;//for more direct access
    let depth = screen_c.depth;//for more direct access
    let width = screen_c.SCREEN_WIDTH;//for more direct access
    let height = screen_c.SCREEN_HEIGHT;//for more direct access

    if(!walled){
        render_block_safe(pixels, depth, texture, width, height, p, x, y);
        if(graphics_index > 15){ return; }//This is a obscure tile, therefore doesnt render furniture
        //if(cell.flood){ render_floor_safe_transparent(pixels, depth, texture_c.objectBasic[cell.flood], width, height, p, x, y); }
        if(cell.furniture_type > 0){ scene_render_safe_furniture(screen_c, texture_c, x, y, p, cell); }
        return;
    }
    render_block_safe(pixels, depth, texture_c.voidTexture, width, height, p, x, y);

    if(flags & TILE_FLAGS.TOP){//uses darkened
        render_block_safe_halved_depthed(pixels, depth, texture_darkened, width, height, p - (width * 32), x, y - 32);}
    if(flags & TILE_FLAGS.LEFT){
        render_stripe_left_safe_depthed(pixels, depth, texture, width, height, p - (16 * width), x, y - 16);}
    if(flags & TILE_FLAGS.RIGHT){
        render_stripe_right_safe_depthed(pixels, depth, texture, width, height, p - (16 * width), x, y - 16);}
    if(flags & TILE_FLAGS.BOTTOM){
        render_block_safe_depthed(pixels, depth, texture, width, height, p, x, y); return;}
}