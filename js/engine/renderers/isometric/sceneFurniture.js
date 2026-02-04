import CONSTANTS from '../../constants.json' with { type: "json" };

import { ScreenContext } from "../../context/screen.js";
import { TextureContext } from "../../context/texture.js";
import { WorldTile } from "../../context/world.js";

import { render_floor_safe_transparent, render_floor_transparent } from "./render/floor.js";
import { render_wall_left_depthed_transparent, render_wall_left_safe_depthed_transparent } from "./render/wall_left.js";
import { render_wall_right_depthed_transparent, render_wall_right_safe_depthed_transparent } from "./render/wall_right.js";
import { render_tetra_depthed, render_tetra_safe_depthed } from "../common/tetra.js";
import { render_octal_depthed_volatile, render_octal_safe_depthed_volatile } from "../common/octal.js";
import { render_hexal_depthed, render_hexal_safe_depthed } from "../common/hexal.js";
import { render_wall_cross_depthed_transparent } from './render/wall_cross.js';

/**
 * 
 * @param {ScreenContext} screen_c screen context, for interfacing with the output device
 * @param {TextureContext} texture_c texture context, for grabbing textures
 * @param {Number} x x axis of the tile, in screen space
 * @param {Number} y y axis of the tile, in screen space
 * @param {Number} p coordinates(x + (y * SCREEN_WIDTH)) of the tile, in screen space
 * @param {WorldTile} cell 
 */
export function scene_render_furniture(screen_c, texture_c, x, y, p, cell){
    const pixels = screen_c.pixels;
    const depth = screen_c.depth;
    const width = screen_c.SCREEN_WIDTH;
    const height = screen_c.SCREEN_HEIGHT;
    let texture = null;

    switch(cell.furniture_type){
        case CONSTANTS.ORNAMENT_TETRA: texture = texture_c.objectTetra[cell.texture_furniture];
            x -= 15; y -= 8; p = screen_c.coords(x, y);
            render_tetra_depthed(pixels, depth, texture, width, p, y, -8);
            if(cell.furniture_config){ texture = texture_c.objectTetra[cell.furniture_config];
                p -= screen_c.SCREEN_WIDTH * 16;
                render_tetra_depthed(pixels, depth, texture, width, p, y, -8);
            }
            break;
        case CONSTANTS.ORNAMENT_OCTAL: texture = texture_c.objectOctal[cell.texture_furniture];
            x -= 15; y -= 40; p = screen_c.coords(x, y);
            let type = cell.furniture_config;
            if(y <= 0){ render_octal_safe_depthed_volatile(pixels, depth, texture, width, height, p, x, y, -8, type); break; }
            render_octal_depthed_volatile(pixels, depth, texture, width, p, y, -8, type); break;
        case CONSTANTS.ORNAMENT_HEXAL: texture = texture_c.objectHexal[cell.texture_furniture];
            x -= 32; y -= 32; p = screen_c.coords(x, y);
            if(y <= 0){ render_hexal_safe_depthed(pixels, depth, texture, width, height, p, x, y, 0); break; }
            render_hexal_depthed(pixels, depth, texture, width, p, y, 0); break;
		
		case CONSTANTS.ORNAMENT_FENCE: texture = texture_c.objectBasic[cell.texture_furniture];
			if(cell.furniture_config == CONSTANTS.ORNAMENT_FENCE_VERTICAL){
				x += 16; y -= 24; p = screen_c.coords(x, y);
	            render_wall_left_depthed_transparent(pixels, depth, texture, width, p, y);
			break;}
				x -= 15; y -= 24; p = screen_c.coords(x, y);
	            render_wall_right_depthed_transparent(pixels, depth, texture, width, p, y);
			break;
        case CONSTANTS.ORNAMENT_BUSH: texture = texture_c.objectBasic[cell.texture_furniture];
            let X = x, Y = y; p = screen_c.coords(X, Y);
            render_wall_cross_depthed_transparent(pixels, depth, texture, width, p, y, 0xf);
            render_wall_left_depthed_transparent(pixels, depth, texture, width, p - ((width * 16) - 32), y - 16);
            render_wall_right_depthed_transparent(pixels, depth, texture, width, p - ((width * 16) + 31), y - 16);
            break;
        case CONSTANTS.ORNAMENT_FLOOR: texture = texture_c.objectBasic[cell.texture_furniture];
            render_floor_transparent(pixels, depth, texture, width, p);
            break;
        
    }
}

export function scene_render_safe_furniture(screen_c, texture_c, x, y, p, cell){
    const pixels = screen_c.pixels;
    const depth = screen_c.depth;
    const width = screen_c.SCREEN_WIDTH;
    const height = screen_c.SCREEN_HEIGHT;
    let texture = null;

    switch(cell.furniture_type){
        case CONSTANTS.ORNAMENT_TETRA: texture = texture_c.objectTetra[cell.texture_furniture];
            x -= 15; y -= 8; p = screen_c.coords(x, y);
            render_tetra_safe_depthed(pixels, depth, texture, width, height, p, x, y, -8);
            if(cell.furniture_config){ texture = texture_c.objectTetra[cell.furniture_config];
                p -= screen_c.SCREEN_WIDTH * 16;
                render_tetra_safe_depthed(pixels, depth, texture, width, height, p, x, y, -8);
            }
            break;
        case CONSTANTS.ORNAMENT_OCTAL: texture = texture_c.objectOctal[cell.texture_furniture];
            x -= 15; y -= 40; p = screen_c.coords(x, y);
            let type = cell.furniture_config;
            render_octal_safe_depthed_volatile(pixels, depth, texture, width, height, p, x, y, -8, type);
            break;
        case CONSTANTS.ORNAMENT_HEXAL: texture = texture_c.objectHexal[cell.texture_furniture];
            x -= 32; y -= 32; p = screen_c.coords(x, y);
            render_hexal_safe_depthed(pixels, depth, texture, width, height, p, x, y, 0);
            break;
		
        case CONSTANTS.ORNAMENT_FENCE: texture = texture_c.objectBasic[cell.texture_furniture];
			if(cell.furniture_config == CONSTANTS.ORNAMENT_FENCE_VERTICAL){
				x += 16; y -= 24; p = screen_c.coords(x, y);
		        render_wall_left_safe_depthed_transparent(pixels, depth, texture, width, height, p, x, y);
			break;}
				x -= 15; y -= 24; p = screen_c.coords(x, y);
		        render_wall_right_safe_depthed_transparent(pixels, depth, texture, width, height, p, x, y);
			break;
        case CONSTANTS.ORNAMENT_BUSH: texture = texture_c.objectBasic[cell.texture_furniture];
            let X = x, Y = y; p = screen_c.coords(X, Y);
            render_wall_left_safe_depthed_transparent(pixels, depth, texture, width, height, p - ((width * 16) - 32), x + 32, y - 16);
            render_wall_right_safe_depthed_transparent(pixels, depth, texture, width, height, p - ((width * 16) + 31), x - 31, y - 16);
            break;
        case CONSTANTS.ORNAMENT_FLOOR: texture = texture_c.objectBasic[cell.texture_furniture];
            render_floor_safe_transparent(pixels, depth, texture, width, p);
            break;
    }
}