import { static_sine, absolute } from "../../util/custom_math.js"
import { ApotheosisEngine } from "../../engine.js"
import { TILE_FLAGS } from "../../context/world.js";

export function first_person_movement(engine, left, right, top, bottom){
    let angle = engine.world_c.viewAngle; let speed = engine.camera_speed;

    if(left){ angle -= 5; }
    if(right){ angle += 5; }
    engine.world_c.viewAngle = angle;

    let x = Math.floor(engine.camera_speed * static_sine(angle + 90));
    let y = Math.floor(engine.camera_speed * static_sine(angle));
    if(top){ engine.world_c.step(x, y); return; }
    else if(bottom){ engine.world_c.step(-x, -y); return; }
}

function first_person_scene_render_floor(engine){
    const pixels = engine.screen_c.pixels, depth = engine.screen_c.depth;
    const width = engine.screen_c.SCREEN_WIDTH, height = engine.screen_c.SCREEN_HEIGHT;
    const world = engine.world_c, tiles = world.tiles;
    const sight = world.sight;

    const DEF_TEX_W = 16, DEF_TEX_H = 16;

    const angle_left = world.viewAngle + (world.fieldOfView >> 1);
    const angle_right = world.viewAngle - (world.fieldOfView >> 1);
    let left_x = static_sine(angle_left + 90);//cos(angle) = sin(angle + 90)
    let left_y = static_sine(angle_left);
    let right_x = static_sine(angle_right + 90);//cos(angle) = sin(angle + 90)
    let right_y = static_sine(angle_right);

    let posX = world.world_x / 32;
    let posY = world.world_y / 32;

    for(let y = ((height / 2) + 1); y < height; y++){
        let floorptr = y * width, ceilptr = (height - y - 1) * width;

        let rowDistance = height / ((y * 2) - height);
        let floorStepX = rowDistance * (left_x - right_x) / width;
        let floorStepY = rowDistance * (left_y - right_y) / width;
        let floorX = posX + rowDistance * right_x;
        let floorY = posY + rowDistance * right_y;
        if(rowDistance > sight){ continue; }
        for(let x = 0; x < width; x++, floorptr += 1, ceilptr += 1){
            let cellX = Math.floor(floorX) & 0xff;
            let cellY = Math.floor(floorY) & 0xff;
            let tx = Math.floor(DEF_TEX_W * (floorX - cellX)) & (DEF_TEX_W - 1);
            let ty = Math.floor(DEF_TEX_H * (floorY - cellY)) & (DEF_TEX_H - 1);
            floorX += floorStepX;
            floorY += floorStepY;

            let textureIndex = tiles[(cellY << 8) | cellX].texture_floor;
            let texture = engine.texture_c.objectTile[textureIndex];
            let textureDark = engine.texture_c.objectTile[textureIndex + 16];
            let pixelIndex = DEF_TEX_W * ty + tx;

            let color = texture[pixelIndex];
            pixels[floorptr] = color;

            if(textureIndex < 4){ continue; }

            color = textureDark[pixelIndex];
            pixels[ceilptr] = color;
        }
    }
}

class RayObject{
    ishoriz;
    side_dist_x;
    side_dist_y;
    //delta_dist_x;
    //delta_dist_y;
    local_coords;
    //line;

    constructor(){
        this.ishoriz = false;
        this.side_dist_x = 0;
        this.side_dist_y = 0;
        this.local_coords = 0;
    }

    update(ishoriz, side_dist_x, side_dist_y, local_coords){
        this.ishoriz = ishoriz;
        this.side_dist_x = side_dist_x;
        this.side_dist_y = side_dist_y;
        this.local_coords = local_coords;
    }
}

/**
 * Renders a first person scene
 * @param {ApotheosisEngine} engine engine that holds all contexts
 */
export function first_person_scene_render(engine){
    const pixels = engine.screen_c.pixels, depth = engine.screen_c.depth;
    const width = engine.screen_c.SCREEN_WIDTH, height = engine.screen_c.SCREEN_HEIGHT;
    
    for(
        let y = 0, ptr = 0, ptr2 = (width * (height / 2));
        y < (height / 2);
         y++, ptr = width * y, ptr2 = (width * (y + (height/2)))
    ){ for(let x = 0; x < width; x++){
        pixels[ptr++] = 0xffface87;
        pixels[ptr2++] = 0xff505050;
    } }

    const world = engine.world_c;
    const tiles = world.tiles;
    const sight = world.sight;
    const flag_wall = TILE_FLAGS.WALLED;

    const DEF_TEX_W = 16;
    const DEF_TEX_H = 16;

    let posX = world.world_x / 32;
    let posY = world.world_y / 32;

    const angle_left = world.viewAngle + (world.fieldOfView >> 1);
    const angle_right = world.viewAngle - (world.fieldOfView >> 1);
    let left_x = static_sine(angle_left + 90);//cos(angle) = sin(angle + 90)
    let left_y = static_sine(angle_left);
    let right_x = static_sine(angle_right + 90);//cos(angle) = sin(angle + 90)
    let right_y = static_sine(angle_right);

    let inc_x = (left_x - right_x) / (width);
    let inc_y = (left_y - right_y) / (width);
    let ray_dir_x = right_x;
    let ray_dir_y = right_y;

    first_person_scene_render_floor(engine);

    let object_stack = new Array(engine.world_c.sight * 2);
    for(let i = 0; i < object_stack.length; i++){ object_stack[i] = new RayObject(); }
    let object_stack_size = 0;

    //Wall casting
    for(let i = 0; i < width; i++
        ,ray_dir_x += inc_x, ray_dir_y += inc_y
    ){
        let mapX = Math.floor(posX);//Should replace local_x
        let mapY = Math.floor(posY);//Should replace local_y
        let delta_dist_x = ray_dir_x == 0 ? 9999999 : absolute(1 / ray_dir_x);
        let delta_dist_y = ray_dir_y == 0 ? 9999999 : absolute(1 / ray_dir_y);
        let side_dist_x = 0, side_dist_y = 0;
        let addr_step_x = 0, addr_step_y = 0;

        if(ray_dir_x < 0){ addr_step_x = -1; side_dist_x = (posX - mapX);/*Could be precalculated*/ }
        else { addr_step_x = 1; side_dist_x = (mapX + 1 - posX);/*Could be precalculated*/ }
        if(ray_dir_y < 0){ addr_step_y = -1; side_dist_y = (posY - mapY);/*Could be precalculated*/ }
        else { addr_step_y = 1; side_dist_y = (mapY + 1 - posY);/*Could be precalculated*/ }
        
        side_dist_x *= delta_dist_x; side_dist_y *= delta_dist_y;
        
        let local_x = mapX & 0xff;
        let local_y = mapY & 0xff;
        let local_coords = 0;//could be the grabbed tile, instead of a coordinate

        let ishoriz = false;
        let hit = false;//pretty much useless, since we can read the tile

        object_stack_size = 0;
        do{
            ishoriz = side_dist_x < side_dist_y;
            if(ishoriz){
                side_dist_x += delta_dist_x;
                mapX += addr_step_x; local_x = mapX & 0xff;
            }
            else{
                side_dist_y += delta_dist_y;
                mapY += addr_step_y; local_y = mapY & 0xff;
            }
            local_coords = local_x | (local_y << 8);
            hit = tiles[local_coords].flags & flag_wall;

            if(tiles[local_coords].furniture_type){
                object_stack[object_stack_size++].update(ishoriz, side_dist_x, side_dist_y, local_coords);
            }
        }while(
            !hit &&
            (
                (side_dist_x < sight) ||
                (side_dist_y < sight)
            )
        );
        if(object_stack_size){
            render_ray_objects(engine, object_stack, object_stack_size, i, posX, posY, ray_dir_x, ray_dir_y, delta_dist_x, delta_dist_y); 
        }
    }
}

import CONSTANTS from '../../constants.json' with { type: "json" };

function render_ray_objects(engine, ray_objects, size, line, posX, posY, ray_dir_x, ray_dir_y, delta_dist_x, delta_dist_y){
    const pixels = engine.screen_c.pixels, depth = engine.screen_c.depth;
    const width = engine.screen_c.SCREEN_WIDTH, height = engine.screen_c.SCREEN_HEIGHT;
    const world = engine.world_c;
    const tiles = world.tiles;
    const texture_c = engine.texture_c;

    const DEF_TEX_W = 16;
    const DEF_TEX_H = 16;
    
    for(let i = size - 1; i > -1; i--){
        let object = ray_objects[i];
        let ishoriz = object.ishoriz;
        let side_dist_x = object.side_dist_x;
        let side_dist_y = object.side_dist_y;
        let local_coords = object.local_coords;

        //Texture acquisition (which line of which texture)
        let TEXTURE_WIDTH = DEF_TEX_W, TEXTURE_HEIGHT = DEF_TEX_H;
        let textureIndex = tiles[local_coords].texture_furniture;
        let texture = null;

        //Rendering bounds definition
        let wallDistance = 0;
        let lineHeight = 0;
        let wallX = 0;
        let dstart = 0, dend = 0;


        wallDistance = ishoriz ? (side_dist_x - delta_dist_x) : (side_dist_y - delta_dist_y);
        lineHeight = Math.floor(height / wallDistance);

        //Texture line location calculations
        
        if(ishoriz){ wallX = (wallDistance * ray_dir_y) + posY; }
        else{ wallX = (wallDistance * ray_dir_x) + posX; }
        wallX -= Math.floor(wallX);

        let isObject = false;
        switch(tiles[local_coords].furniture_type){
            default: break;
            case CONSTANTS.ORNAMENT_TETRA:
            case CONSTANTS.ORNAMENT_OCTAL:
            case CONSTANTS.ORNAMENT_HEXAL: isObject = true;
                let delta_dist = (ishoriz ? delta_dist_x : delta_dist_y) / 2;
                wallDistance += delta_dist;

                lineHeight = Math.floor(height / wallDistance);
                if(ishoriz){ wallX = (wallDistance * ray_dir_y) + posY;
                    let furny = (local_coords >> 8) & 0xff; if(wallX > (furny + 1) || wallX < (furny)){ continue; } 
                } else{ wallX = (wallDistance * ray_dir_x) + posX;
                    let furnx = local_coords & 0xff; if(wallX > (furnx + 1) || wallX < (furnx)){ continue; } 
                }
                wallX -= Math.floor(wallX);
                break;
        }

        switch(tiles[local_coords].furniture_type){
            case CONSTANTS.ORNAMENT_WALL:
                texture = texture_c.objectTile[textureIndex];
                break;
            case CONSTANTS.ORNAMENT_FENCE:
                if((tiles[local_coords].furniture_config == CONSTANTS.ORNAMENT_FENCE_HORIZONTAL && ishoriz) ||
                    (tiles[local_coords].furniture_config == CONSTANTS.ORNAMENT_FENCE_VERTICAL && !ishoriz)
                ){
                    continue;
                }
            case CONSTANTS.ORNAMENT_BUSH:
                texture = texture_c.objectBasic[textureIndex];
                break;
            case CONSTANTS.ORNAMENT_TETRA: TEXTURE_WIDTH = 32; TEXTURE_HEIGHT = 32;
                //Width shortening
                if(wallX > 0.75 || wallX < 0.25){ continue; } wallX = (wallX - 0.25) * 2;
                //Height shortening
                lineHeight = lineHeight >> 1; 
                //Lowering (1 = 32, 2 = 16, 3 = 8...)
                dstart = (lineHeight >> 1) + (lineHeight >> 3); dend = dstart;
                texture = texture_c.objectTetra[textureIndex];
                break;
            case CONSTANTS.ORNAMENT_OCTAL: TEXTURE_WIDTH = 32; TEXTURE_HEIGHT = 64;
                //Width shortening
                if(wallX > 0.75 || wallX < 0.25){ continue; } wallX = (wallX - 0.25) * 2;
                dstart = lineHeight >> 3; dend = dstart;
                texture = texture_c.objectOctal[textureIndex];
                break;
            case CONSTANTS.ORNAMENT_HEXAL: TEXTURE_WIDTH = 64; TEXTURE_HEIGHT = 64;
                texture = texture_c.objectHexal[textureIndex];
                dstart = lineHeight >> 3; dend = dstart;
                break;
            default: continue;
        }

        let depthness = Math.floor((height / engine.world_c.sight) * wallDistance);

        //Line bounds calculations
        dstart += (height - lineHeight) >> 1;
        dend += (height + lineHeight) >> 1;
        let upWall = 0;
        if(dstart < 0){ upWall -= dstart; dstart = 0; }
        if(dend > height){dend = height}
        let ptr = line + (dstart * width);

        //Texture step calculation
        let textureX = Math.floor(wallX * TEXTURE_WIDTH);
        if(!((ishoriz && (ray_dir_x > 0)) || (!ishoriz && (ray_dir_y < 0)))) {
            textureX = TEXTURE_WIDTH - textureX - 1;//what is the purpose of this?
        }
        let textureStep = TEXTURE_HEIGHT / lineHeight;
        let textureCount = upWall * textureStep;
        let texturePixel = textureX + (Math.floor(textureCount) * TEXTURE_WIDTH); textureCount %= 1;

        if(isObject){ ishoriz = false; }

        let color = texture[texturePixel];
        if(ishoriz){ color = ((color >> 1) & 0x7f7f7f); if(color){ color |= 0xff000000; } }
        for(let wh = dstart; wh < dend; wh++, ptr += width, textureCount += textureStep){
            if(textureCount >= 1){ 
                let texCountFloor = Math.floor(textureCount);
                texturePixel += texCountFloor * TEXTURE_WIDTH; textureCount -= texCountFloor; 
                color = texture[texturePixel];
                if(ishoriz){
                    color = ((color >> 1) & 0x7f7f7f);
                    if(color){ color |= 0xff000000; }
                }
            }
            if(!color){ continue; }
            pixels[ptr] = color;
            depth[ptr] = depthness;
        }
    }
}