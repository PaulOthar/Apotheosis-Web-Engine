import { ScreenContext } from "./context/screen.js";
import { AssetContext } from "./context/asset.js";
import { TextureContext } from "./context/texture.js";
import { WorldContext } from "./context/world.js";

import { EventQueue } from "./util/eventQueue.js";
import { EVENT_PAYLOAD, EVENT_HEADER } from "./eventConstants.js";

import { isometric_scene_render, isometric_movement } from "./renderers/isometric/scene.js";
import { flat_scene_render, flat_movement } from "./renderers/flat/scene.js";
import { first_person_scene_render, first_person_movement } from "./renderers/first_person/scene.js";
import { _tech_chunk_view_movement, _tech_chunk_view_scene } from "./renderers/tech/chunk_view/scene.js";

export const ENGINE_FLAGS = {
    DEPTH_SHOW:         1 << 0,
    RAYCASTER_ALWAYS:   1 << 1,
    RAYCASTER_ALL:      1 << 2,
    MINI_VIEW:          1 << 3,
}
window.ENGINE_FLAGS = ENGINE_FLAGS;

export const ENGINE_RENDERERS = {
    ISOMETRIC:          1,
    FLAT:               2,
    FIRST_PERSON:       3,

    TECH_CHUNK:         128
}
window.ENGINE_RENDERERS = ENGINE_RENDERERS;

export class ApotheosisEngine{
    screen_c;
    asset_c;
    texture_c;
    world_c;
    
    events;
    event_c;

    flags;
    camera_speed;

    renderer_code;
    scene_function;
    movement_function;

    constructor(){
        this.screen_c = new ScreenContext();
        this.asset_c = new AssetContext(null);
        this.texture_c = new TextureContext(this.asset_c.data);
        this.world_c = new WorldContext(this.asset_c.data);

        this.events = new EventQueue(
            this, 
            this.screen_c,
            this.asset_c, 
            this.texture_c, 
            this.world_c
        );

        this.flags = 0; this.camera_speed = 8;
        
        this.renderer_code = 0; this.setRenderer(this.renderer_code);

        //Post initialization phase

        this.events.post(EVENT_HEADER.WORLD_UPDATE_CHUNK);//first chunk update
        this.initialize_mini_view(128, 128);
    }

    setRenderer(code){
        this.renderer_code = code;

        //yes, it could be an object that holds both scene and movement...
        //but it would also generate a bit of OOP overhead.
        switch(code){
            case ENGINE_RENDERERS.TECH_CHUNK:
                this.scene_function = _tech_chunk_view_scene;
                this.movement_function = _tech_chunk_view_movement;
                break;
            default:
            case ENGINE_RENDERERS.ISOMETRIC:
                this.scene_function = isometric_scene_render;
                this.movement_function = isometric_movement;
                break;
            case ENGINE_RENDERERS.FLAT:
                this.scene_function = flat_scene_render;
                this.movement_function = flat_movement;
                break;
            case ENGINE_RENDERERS.FIRST_PERSON:
                this.scene_function = first_person_scene_render;
                this.movement_function = first_person_movement;
                break;
        }
    }

    update(currentTime){
        while(this.events.process());

        if(this.world_c.changedTile || this.isFlag(ENGINE_FLAGS.RAYCASTER_ALWAYS)){
            this.world_c.clearOcclusion();
            if(this.isFlag(ENGINE_FLAGS.RAYCASTER_ALL)){ this.world_c.seeAll(); }
            else{ this.world_c.seeRays(); }
        }
    }

    render(currentTime){
        this.scene_function(this);

        if(this.isFlag(ENGINE_FLAGS.MINI_VIEW)){ this.update_mini_view(); this.render_mini_view(0); }
        if(this.isFlag(ENGINE_FLAGS.DEPTH_SHOW)){ this.screen_c.showDepth(); }
    }

    /**
     * Processes a event from the event queue
     * @param {Number} header encoded event header
     * @param {Number} payload raw event data
     * @param {EventQueue} eventQueue queue for stacking more events as result
     */
    handleEvent(event, header, payload, eventQueue){
        switch(header){
            case EVENT_HEADER.ENGINE_USER_ARROW:{
                this.movement_function(this,
                    payload & EVENT_PAYLOAD.ENGINE_USER_LEFT,
                    payload & EVENT_PAYLOAD.ENGINE_USER_RIGHT,
                    payload & EVENT_PAYLOAD.ENGINE_USER_TOP,
                    payload & EVENT_PAYLOAD.ENGINE_USER_BOTTOM
                );
                
                if(this.world_c.changedChunk){ eventQueue.post(EVENT_HEADER.WORLD_UPDATE_CHUNK); }
            } return true;
        }

        return false;
    }

    isFlag(flag){ return (this.flags & flag); }

    setFlag(flag, boolean){
        if(!boolean){ this.flags &= ~flag; return; }
        this.flags |= flag;
    }

    toggleFlag(flag){ this.flags ^= flag; }

    /**
     * Loads referentes from another source to the screen context.
     * @param {Uint32Array} pixels framebuffer
     * @param {Uint16Array} depth depthbuffer
     * @param {Number} width horizontal size
     * @param {Number} height vertical size
     */
    loadScreenReferences(pixels, depth, width, height){
        this.screen_c.define(pixels, depth, width, height);
    }

    loadAssetsFromJson(json){
        this.asset_c.incrementFromJson(json);
    }

    //Mini view related

    mini_view_screen;
    mini_view_renderer_code;

    initialize_mini_view(width, height){
        this.mini_view_screen = new ScreenContext();
        this.mini_view_screen.create(width, height);
        this.mini_view_renderer_code = 0;
    }

    swap_mini_view_config(){
        let prev_renderer_code = this.renderer_code;
        this.setRenderer(this.mini_view_renderer_code);
        this.mini_view_renderer_code = prev_renderer_code;
    }

    update_mini_view(){
        let screen_buffer = this.screen_c; this.screen_c = this.mini_view_screen;
        this.swap_mini_view_config();

        this.scene_function(this);

        this.swap_mini_view_config();
        this.screen_c = screen_buffer;
    }

    render_mini_view(coords){
        let screen_pixels = this.screen_c.pixels;
        let screen_width = this.screen_c.SCREEN_WIDTH;

        let pixels = this.mini_view_screen.pixels;
        let width = this.mini_view_screen.SCREEN_WIDTH;
        let height = this.mini_view_screen.SCREEN_HEIGHT;

        for(let y = 0; y < height; y++){
            let ptr = coords + y * screen_width;
            let mini_ptr = y * width;
            for(let x = 0; x < width; x++, ptr++, mini_ptr++){
                screen_pixels[ptr] = pixels[mini_ptr];
            }
        }
    }

    //Very specific stuff

    ___render(encoded){
        let built = this.texture_c.___export_texture(encoded);
        let line = 0;
        switch(built.length){
            case 256: line = 16; break;
            case 1024: line = 32; break;
            case 2048: line = 32; break;
            case 4096: line = 64; break;
        }
        let rows = built.length / line;

        const pixels = this.screen_c.pixels;
        const width = this.screen_c.SCREEN_WIDTH

        let coords = 0;
        for(let i = 0; i < built.length; i += line){
            for(let l = 0; l < line; l++){
                pixels[coords + l] = built[i + l];
            }
            coords += width;
        }

        this.render = function(){}
    }
}