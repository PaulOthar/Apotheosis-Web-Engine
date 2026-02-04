import { EVENT_HEADER } from "../eventConstants.js";
import { EventQueue } from "../util/eventQueue.js";
import { absolute, square_circle } from "../util/custom_math.js";
import CONSTANTS from '../constants.json' with { type: "json" };

export const TILE_FLAGS = {
    WALLED		    :	0b00000001,
	BLOCKED		    :	0b00000010,
	KNOWN		    :	0b00000100,//This tile is known (has been seen before)
	SEEN		    :	0b00001000,//This tile is been seen now

	LEFT		    :	0b00010000,//Was sighted from the left
	RIGHT		    :	0b00100000,//Was sighted from the right
	TOP			    :	0b01000000,//Was sighted from the top
	BOTTOM		    :	0b10000000,//Was sighted from the bottom

	RAYCAST_TRUE    :	0b11111100,
	RAYCAST		    :	0b00001000,
	BLIND		    :	0b00000011,
	SIGHTED		    :	0b00001100
};

export class WorldTile{
    flags;

    texture_floor;
    texture_furniture;

    furniture_type;
    
    texture_wall;
    furniture_config;
    flood;

    constructor(){
        this.flags = 0;

        this.texture_floor = 0;
        this.texture_wall = 0;
        this.texture_furniture = 0;

        this.furniture_type = 0;
        this.furniture_config = 0;

        this.flood = 0;
    }
	
	/**
	 * @param {WorldTile} tile
	 */
	copy(tile){
		this.flags = tile.flags;
		this.texture_floor = tile.texture_floor;
		this.texture_wall = tile.texture_wall;
		this.texture_furniture = tile.texture_furniture;
		this.furniture_type = tile.furniture_type;
		this.furniture_config = tile.furniture_config;
		this.flood = tile.flood;
	}
	
	inspectFlags(){
		let entries = Object.entries(TILE_FLAGS);
		let result = new String();
		
		for(let i = 0; i < entries.length; i++){
			let entry = entries[i];
			if(this.flags & entry[1]){ result += (result.length > 0 ? "," : "") + entry[0] }
		}
		
		return result;
	}
}

export class WorldContext{
    source;
    world_x; world_y;

    changedTile;
    changedChunk;

    sight;
    #sightMaximum;//Soft limit. Generates optimized sight vectors
    #sightVectors;//Vectors of rays for the raycaster

    viewAngle;
    fieldOfView;

    tiles;//Every loaded tile
    chunkCodes;//Codes of loaded chunks (Used for loading new chunks)
    #chunkPresets;//Loaded premade chunks, to be loaded to tiles

    #occlusionFlags;

    /**
     * Loads and initializes the world context
     * @param {Map} source 
     */
    constructor(source){
        this.source = source;
        this.world_x = 0;
        this.world_y = 0;

        this.sight = 0;
        this.#sightMaximum = 0;
        this.#sightVectors = null;

        this.viewAngle = 90;
        this.fieldOfView = 85;//mostly square

        this.tiles = new Array(0x10000);
        this.chunkCodes = new Array(256);
        this.#chunkPresets = new Map();
        for(let i = 0; i < this.tiles.length; i++){ this.tiles[i] = new WorldTile(); }
        for(let i = 0; i < this.chunkCodes.length; i++){ this.chunkCodes[i] = 0x7fff7fff; }

        this.#occlusionFlags = TILE_FLAGS.RAYCAST;
    }

    getTile(x, y){ return this.tiles[x + (y << 8)]; }

    putFurniture(x, y, texture, type){
        let tile = this.getTile(x, y);
        tile.furniture_type = type;
        tile.texture_furniture = texture;
    }

    putWall(x, y, texture){
        this.putFurniture(x, y, texture, CONSTANTS.ORNAMENT_WALL);
        tile.flags = 1;
    }

    /**
     * Processes a event from the event queue
     * @param {Number} header encoded event header
     * @param {Number} payload raw event data
     * @param {EventQueue} eventQueue queue for stacking more events as result
     */
    handleEvent(event, header, payload, eventQueue){
        switch(header){
            case EVENT_HEADER.WORLD_UPDATE_CHUNK:
                this.updateChunks(eventQueue);
            return true;
        }
        return false;
    }

    /**
     * Steps world coordinates based on specified incremental coordinates.
     * Will also update the flags "changedTile" and "chunkChanged".
     * @param {Number} x horizontal world axis
     * @param {Number} y vertical world axis
     * 
     * @see {Boolean} changedTile - indicates if tile was changed during step.
     * @see {Boolean} chunkChanged - indicates if chunk was changes during step.
     */
    step(x, y){
        this.changedTile = (((this.world_x & 0x1f) + x) & 0x20) > 0 || (((this.world_y & 0x1f) + y) & 0x20) > 0;
        this.changedChunk = (((this.world_x & 0x1ff) + x) & 0x200) > 0 || (((this.world_y & 0x1ff) + y) & 0x200) > 0;
        this.world_x += x; this.world_y += y;
    }

    /**
     * Steps world coordinates based on screen calculations incremental coordinates.
     * Will also update the flags "changedTile" and "chunkChanged".
     * @param {Number} x horizontal screen axis
     * @param {Number} y vertical screen axis
     * 
     * @see {Function} step(x, y)
     * @see {Boolean} changedTile - indicates if tile was changed during step.
     * @see {Boolean} chunkChanged - indicates if chunk was changes during step. 
     */
    stepScreen(x, y){
        this.step(
            y + (x >> 1), 
            y - (x >> 1)
        );
    }

    /**
     * Loads and precalculates sight related data, such as maximum sight range and sight vectors.
     * @param {Number} range 
     */
    loadSight(range){
        this.sight = range;
        this.#sightMaximum = range;
        this.#sightVectors = square_circle(range);
    }

    /**
     * Sets the sight value, affecting the raycaster range.
     * if provided range is greater than the previously defined maximu, will default to maximum.
     * if provided range is lower than 0, will default to 0.
     * @param {Number} range (0 <= range <= maximum)
     */
    setSight(range){
        if(range > this.#sightMaximum){ this.sight = this.#sightMaximum; return; }
		else if(range < 0){ this.sight = 0; return; }
		this.sight = range;
    }

    //Raycaster

    /**
     * Clears all the occlusion data from the 'visible' tiles.
     */
    clearOcclusion(){
        let offset = this.sight + 3;
        let start_x = (this.world_x >> 5) & 0xff;
        let start_y = (this.world_y >> 5) & 0xff;
        let end_x = start_x + offset;
        let end_y = start_y + offset;
        start_x -= offset;
        start_y -= offset;

        let tiles = this.tiles;
        let flagsMask = ~this.#occlusionFlags;
        for(let y = start_y; y != end_y; y++){
            let ym = (y & 0xff) << 8;
            for(let x = start_x; x != end_x; x++){
                let index = (x & 0xff) | ym;
                tiles[index].flags &= flagsMask;
            }
        }
    }

    seeAll(){
        let offset = this.sight + 1;
        let start_x = (this.world_x >> 5) & 0xff;
        let start_y = (this.world_y >> 5) & 0xff;
        let end_x = start_x + offset;
        let end_y = start_y + offset;
        start_x -= offset;
        start_y -= offset;

        let tiles = this.tiles;

        let walled = TILE_FLAGS.WALLED;
        let sighted = TILE_FLAGS.SIGHTED;
        let raycasterMask = ~TILE_FLAGS.RAYCAST_TRUE;
        for(let y = start_y; y != end_y; y++){
            let ym = (y & 0xff) << 8;
            for(let x = start_x; x != end_x; x++){
                let xm = x & 0xff;
                let index = xm | ym;

                let flags = sighted;
                let tile = tiles[index];
                tile.flags &= raycasterMask;//Clears every raycaster mask

                if(!(tile.flags & walled)){//if it is not walled, just "see" it
                    tile.flags |= flags; continue;
                }

                //At this point, this tile is a wall
                let center = tile;

                index = ((x + 1) & 0xff) | ym; tile = tiles[index];
                if(!(tile.flags & walled)){ flags |= TILE_FLAGS.LEFT; }
                index = ((x - 1) & 0xff) | ym; tile = tiles[index];
                if(!(tile.flags & walled)){ flags |= TILE_FLAGS.RIGHT; }
                index = (((y - 1) & 0xff) << 8) | xm; tile = tiles[index];
                if(!(tile.flags & walled)){ flags |= TILE_FLAGS.BOTTOM; }
                index = (((y + 1) & 0xff) << 8) | xm; tile = tiles[index];
                if(!(tile.flags & walled)){ flags |= TILE_FLAGS.TOP; }

                center.flags |= flags;
            }
        }
    }

    seeRays(){
        const sight = this.sight;
        const tiles = this.tiles;

        let grid_x = (this.world_x >> 5) & 0xff;
        let grid_y = (this.world_y >> 5) & 0xff;

        let initial_dist_x = (this.world_x & 0x1f) / 32;//intentional float result
        let initial_dist_y = (this.world_y & 0x1f) / 32;//intentional float result

        let central_coords = (grid_x | (grid_y << 8));
        tiles[central_coords].flags |= TILE_FLAGS.SEEN;

        const flags_left = TILE_FLAGS.LEFT | TILE_FLAGS.SIGHTED;
        const flags_right = TILE_FLAGS.RIGHT | TILE_FLAGS.SIGHTED;
        const flags_top = TILE_FLAGS.TOP | TILE_FLAGS.SIGHTED;
        const flags_bottom = TILE_FLAGS.BOTTOM | TILE_FLAGS.SIGHTED;
        const flags_blind = TILE_FLAGS.WALLED;
        for(let i = 0; i < this.#sightVectors.length; i++){
            let ray_dir_x = this.#sightVectors[i].x;
            let ray_dir_y = this.#sightVectors[i].y;

            let delta_dist_x = ray_dir_x == 0 ? 9999999 : absolute(1 / ray_dir_x);
            let delta_dist_y = ray_dir_y == 0 ? 9999999 : absolute(1 / ray_dir_y);
            let side_dist_x = initial_dist_x;
            let side_dist_y = initial_dist_y;
            let addr_step_x = 0;
            let addr_step_y = 0;
            let horizontal_wall = 0;
            let vertical_wall = 0;

            if(ray_dir_x < 0){ 
                addr_step_x = -1; 
                horizontal_wall = flags_left; 
            }
            else {
                side_dist_x = 1 - side_dist_x;
                addr_step_x = 1;
                horizontal_wall = flags_right;
            }

            if(ray_dir_y < 0){ 
                addr_step_y = -1; 
                vertical_wall = flags_top; 
            }
            else {
                side_dist_y = 1 - side_dist_y;
                addr_step_y = 1;
                vertical_wall = flags_bottom;
            }

            side_dist_x *= delta_dist_x;
		    side_dist_y *= delta_dist_y;

            let local_x = grid_x;
            let local_y = grid_y;
            let local_coords = 0;

            let ishoriz = false;

            do{
                ishoriz = side_dist_x < side_dist_y;
                if(ishoriz){
                    side_dist_x += delta_dist_x;
                    local_x = (local_x + addr_step_x) & 0xff;
                    local_coords = local_x | (local_y << 8);
                    tiles[local_coords].flags |= horizontal_wall;
                }
                else{
                    side_dist_y += delta_dist_y;
                    local_y = (local_y + addr_step_y) & 0xff;
                    local_coords = local_x | (local_y << 8);
                    tiles[local_coords].flags |= vertical_wall;
                }
            }while(
                !(tiles[local_coords].flags & flags_blind) &&
                (
                    (side_dist_x < sight) ||
                    (side_dist_y < sight)
                )
            );
            //If we got here, then we reached a wall or the limit of the ray.

            if(tiles[local_coords].flags & flags_blind){//if we reached here due to a wall
                let tile = tiles[local_coords];

                if(ishoriz){ local_x = (local_x - addr_step_x) & 0xff; }
                else{ local_y = (local_y - addr_step_y) & 0xff; }
                let prev = tiles[local_x | (local_y << 8)];

                if(prev.flags & flags_blind){//if the previous was, in fact a wall, invalidate the flag def
                    tile.flags &= ~((ishoriz ? horizontal_wall : vertical_wall) & 0xf0);
                }
            }
        }
    }

    //Chunk building

    //Makeshift procedural function MUST REPLACE IN THE NEAR FUTURE
    #___loadProceduralChunk(chunk_x, chunk_y){
        const tiles = this.tiles;
        chunk_x = (chunk_x & 0xf) << 4;
        chunk_y = (chunk_y & 0xf) << 4;
        build_sector(tiles, chunk_x, chunk_y, 0, 0, 15, 15, 0, 1, 0, 0);//Chunk cleanup

        //PRNG ALGOL SHOUD BE MY OWN
        let rand = Math.floor(Math.random() * 0xffffffff);
        //debugger;
        for(let i = 0, randint = rand; i < 2; i++, randint >>= 8){
            let x = (randint & 0xf), y = (randint >> 4) & 0xf;
            this.putFurniture(chunk_x + x, chunk_y + y, 0, CONSTANTS.ORNAMENT_OCTAL);
        }
        for(let i = 0, randint = rand >> 4; i < 7; i++, randint >>= 4){
            let x = (randint & 0xf), y = (randint >> 4) & 0xf;
            this.putFurniture(chunk_x + x, chunk_y + y, 0, CONSTANTS.ORNAMENT_BUSH);
        }
    }
	
	/**
	 * @param {Number} chunk_x Tile space position
	 * @param {Number} chunk_y Tile space position
	 * @param {Uint8Array} chunkData Chunk stream of data
     * @param {EventQueue} eventQueue 
	 */
	loadChunk(chunk_x, chunk_y, chunkData, eventQueue){
        chunk_x = (chunk_x & 0xf) << 4;
        chunk_y = (chunk_y & 0xf) << 4;
		let chunkDWord = new Uint32Array(chunkData.buffer);
		
		let sectorSize = chunkData[1];
		let thingsSize = chunkData[2];
		
		for(let i = 3; i < 8; i++){//Loading environments
			let env = chunkData[i]; if(!env){ break; }
			eventQueue.postBuild(EVENT_HEADER.TEXTURE_LOAD_ENVIRONMENT, env);
		}

        const tiles = this.tiles;

        let index = 2;
        let range = index + sectorSize;
        for(;index < range; index++){ parse_sector(tiles, chunk_x, chunk_y, chunkDWord[index]); }

        range = index + thingsSize;
        for(;index < range; index++){ parse_thing(tiles, chunk_x, chunk_y, chunkDWord[index]); }
	}

    putChunk(virtual_x, virtual_y, chunk_data){
        let virtualCoords = build_coords(virtual_x, virtual_y, 0, 0, 0xffff, 16);
        this.#chunkPresets.set(virtualCoords, chunk_data);
    }

    #updateChunk(virtual_x, virtual_y, offset_x, offset_y, eventQueue){
        let virtualCoords = build_coords(virtual_x, virtual_y, offset_x, offset_y, 0xffff, 16);

        let local_chunk_x = (virtual_x + offset_x) & 0xf;
        let local_chunk_y = (virtual_y + offset_y) & 0xf;
        let localCoords = local_chunk_x | (local_chunk_y << 4);//build_coords(virtual_x, virtual_y, offset_x, offset_y, 0xf, 4);

        if(this.chunkCodes[localCoords] != virtualCoords){
            this.#___loadProceduralChunk(local_chunk_x, local_chunk_y);
            let preset = this.#chunkPresets.get(virtualCoords);
            if(preset){ this.loadChunk(local_chunk_x, local_chunk_y, preset, eventQueue); }
        }
        
        this.chunkCodes[localCoords] = virtualCoords;//should happen, no matter what
    }

    /**
     * @param {EventQueue} eventQueue 
     */
    updateChunks(eventQueue){
        let virtual_chunk_x = ((this.world_x >> 9) & 0xffff);
        let virtual_chunk_y = ((this.world_y >> 9) & 0xffff);
        
        this.#updateChunk(virtual_chunk_x, virtual_chunk_y, 0, 0, eventQueue);

        this.#updateChunk(virtual_chunk_x, virtual_chunk_y, 1, 0, eventQueue);
        this.#updateChunk(virtual_chunk_x, virtual_chunk_y, -1, 0, eventQueue);
        this.#updateChunk(virtual_chunk_x, virtual_chunk_y, 0, 1, eventQueue);
        this.#updateChunk(virtual_chunk_x, virtual_chunk_y, 0, -1, eventQueue);

        this.#updateChunk(virtual_chunk_x, virtual_chunk_y, 1, 1, eventQueue);
        this.#updateChunk(virtual_chunk_x, virtual_chunk_y, 1, -1, eventQueue);
        this.#updateChunk(virtual_chunk_x, virtual_chunk_y, -1, 1, eventQueue);
        this.#updateChunk(virtual_chunk_x, virtual_chunk_y, -1, -1, eventQueue);
    }
}

//Specific calculations

function build_coords(x, y, xoff, yoff, mask, shift){
	return ((x + xoff) & mask) | (((y + yoff) & mask) << shift);
}

//Chunk construction functions

function build_wall(tiles, offset_x, offset_y, x1, y1, x2, y2, config, wall){
    x1 += offset_x; x2 += offset_x;
    y1 += offset_y; y2 += offset_y;
    y1 <<= 8; y2 <<= 8;

    let tile = 0;
    let wall_a_flags = 0, wall_a_type = 0, wall_a_index = 0;
    let wall_b_flags = 0, wall_b_type = 0, wall_b_index = 0;
    if(config & 0b0001){
        wall_a_flags = TILE_FLAGS.WALLED;
        wall_a_type = CONSTANTS.ORNAMENT_WALL;
        wall_a_index = wall;
    }
    if(config & 0b0010){
        wall_b_flags = TILE_FLAGS.WALLED;
        wall_b_type = CONSTANTS.ORNAMENT_WALL;
        wall_b_index = wall;
    }
    if(config & 0b0011){
        for(let y = y1; y <= y2; y += 0x100){
            tile = tiles[y | x1]; 
                tile.flags |= wall_a_flags; 
                tile.furniture_type |= wall_a_type; 
                tile.texture_furniture |= wall_a_index;
            tile = tiles[y | x2]; 
                tile.flags |= wall_b_flags; 
                tile.furniture_type |= wall_b_type; 
                tile.texture_furniture |= wall_b_index;
        }
    }

    wall_a_flags = 0, wall_a_type = 0, wall_a_index = 0;
    wall_b_flags = 0, wall_b_type = 0, wall_b_index = 0;
    if(config & 0b1000){
        wall_a_flags = TILE_FLAGS.WALLED;
        wall_a_type = CONSTANTS.ORNAMENT_WALL;
        wall_a_index = wall;
    }
    if(config & 0b0100){
        wall_b_flags = TILE_FLAGS.WALLED;
        wall_b_type = CONSTANTS.ORNAMENT_WALL;
        wall_b_index = wall;
    }
    if(config & 0b1100){
        for(let x = x1; x <= x2; x++){
            tile = tiles[x | y1];
                tile.flags |= wall_a_flags;
                tile.furniture_type |= wall_a_type;
                tile.texture_furniture |= wall_a_index;
            tile = tiles[x | y2];
                tile.flags |= wall_b_flags; 
                tile.furniture_type |= wall_b_type; 
                tile.texture_furniture |= wall_b_index;
        }
    }
}

function build_fence(tiles, offset_x, offset_y, x1, y1, x2, y2, config, floor, wall, fence){
    x1 += offset_x; x2 += offset_x;
    y1 += offset_y; y2 += offset_y;
    y1 <<= 8; y2 <<= 8;
    
    let tile = null;
    let type = CONSTANTS.ORNAMENT_FENCE;
    let horizontal = CONSTANTS.ORNAMENT_FENCE_HORIZONTAL;
    let vertical = CONSTANTS.ORNAMENT_FENCE_VERTICAL;
    
    if(config & 0b0001){
        for(let y = y1; y <= y2; y += 0x100){ tile = tiles[y | x2];
            tile.flags = 0;
            tile.furniture_type = type;
            tile.furniture_config = vertical;
            tile.texture_floor = floor;
            tile.texture_furniture = fence;
        }
        tile = tiles[y1 | x2]; tile.furniture_type = CONSTANTS.ORNAMENT_WALL; tile.texture_furniture = wall;
        tile = tiles[y2 | x2]; tile.furniture_type = CONSTANTS.ORNAMENT_WALL; tile.texture_furniture = wall;
    }
    if(config & 0b0010){
        for(let y = y1; y <= y2; y += 0x100){ tile = tiles[y | x1];
            tile.flags = 0;
            tile.furniture_type = type;
            tile.furniture_config = vertical;
            tile.texture_floor = floor;
            tile.texture_furniture = fence;
        }
        tile = tiles[y1 | x1]; tile.furniture_type = CONSTANTS.ORNAMENT_WALL; tile.texture_furniture = wall;
        tile = tiles[y2 | x1]; tile.furniture_type = CONSTANTS.ORNAMENT_WALL; tile.texture_furniture = wall;
    }
    if(config & 0b0100){
        for(let x = x1; x <= x2; x++){ tile = tiles[x | y2];
            tile.flags = 0;
            tile.furniture_type = type;
            tile.furniture_config = horizontal;
            tile.texture_floor = floor;
            tile.texture_furniture = fence;
        }
        tile = tiles[x1 | y2]; tile.furniture_type = CONSTANTS.ORNAMENT_WALL; tile.texture_furniture = wall;
        tile = tiles[x2 | y2]; tile.furniture_type = CONSTANTS.ORNAMENT_WALL; tile.texture_furniture = wall;
    }
    if(config & 0b1000){
        for(let x = x1; x <= x2; x++){ tile = tiles[x | y1];
            tile.flags = 0;
            tile.furniture_type = type;
            tile.furniture_config = horizontal;
            tile.texture_floor = floor;
            tile.texture_furniture = fence;
        }
        tile = tiles[x1 | y1]; tile.furniture_type = CONSTANTS.ORNAMENT_WALL; tile.texture_furniture = wall;
        tile = tiles[x2 | y1]; tile.furniture_type = CONSTANTS.ORNAMENT_WALL; tile.texture_furniture = wall;
    }
}

function build_sector(tiles, offset_x, offset_y, x1, y1, x2, y2, floor, wall, config, fence){
    if(x1 > x2){ x1 ^= x2; x2 ^= x1; x1 ^= x2; }
    if(y1 > y2){ y1 ^= y2; y2 ^= y1; y1 ^= y2; }

    if(fence){
        build_fence(tiles, offset_x, offset_y, x1, y1, x2, y2, config, floor, wall, fence);
    return; }
    
    let X = x2 + 1;
    let Y = y2 + 1;
    //Initializes the block
    for(let y = y1; y < Y; y++){
        let Y = (y + offset_y) << 8;
        for(let x = x1; x < X; x++){
            let coords = (x + offset_x) | Y;
            let tile = tiles[coords];
            tile.texture_floor = floor;

            tile.flags = 0;

            tile.texture_furniture = 0;
            tile.furniture_type = 0;
            tile.furniture_config = 0;
            tile.flood = 0;
        }
    }
    build_wall(tiles, offset_x, offset_y, x1, y1, x2, y2, config, wall);
}

//Chunk data parsing

function parse_sector(tiles, offset_x, offset_y, data){
    let X = data & 0xf; data >>= 4;
    let Y = data & 0xf; data >>= 4;
    let x = data & 0xf; data >>= 4;
    let y = data & 0xf; data >>= 4;
    let floor = data & 0xf; data >>= 4;
    let wall = data & 0xf; data >>= 4;
    let config = data & 0xf; data >>= 4;
    let fence = data & 0xf; data >>= 4;

    build_sector(tiles, offset_x, offset_y, X, Y, x, y, floor, wall, config, fence);
}

function parse_thing(tiles, offset_x, offset_y, data){
    let X = data & 0xf; data >>= 4;
    let Y = data & 0xf; data >>= 4;
    let type = data & 0xff; data >>= 8;
    let texture = data & 0xff; data >>= 8;
    let config = data & 0xff; data >>= 8;

    let tile = tiles[(X + offset_x) + ((Y + offset_y) << 8)];
    tile.flags = (config & 0x80) ? 1 : 0;
    tile.texture_furniture = texture;
    tile.furniture_type = type;
    tile.furniture_config = config;
}