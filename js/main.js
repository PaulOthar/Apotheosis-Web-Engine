import { CanvasManager } from "./resource/screen.js";
import { KeyboardState } from "./resource/keyboard.js";
import { GameEngine } from "./gameEngine.js"

import { EVENT_HEADER, EVENT_PAYLOAD } from "./engine/eventConstants.js";
import CONSTANTS from './engine/constants.json' with { type: "json" };
import { ENGINE_FLAGS, ENGINE_RENDERERS } from "./engine/engine.js";

import ASSETS from '../data/assets.json' with { type: "json" };

export class DemoEngine extends GameEngine{
	async #fetchData(){
		let request = await fetch("/asset/all");
		let text = await request.text();
		if(!request.ok){
			let parsed = JSON.parse(text);
			throw new Error(`\n${parsed.timestamp}\n${parsed.path}\n${parsed.message}`);
		}
		return text;
	}
	
	async setup(){
		this.canvas.swapBuffer();
		this.loadAssetsFromJson(ASSETS);
		//this.loadAssetsFromJson(JSON.parse(await this.#fetchData()));

		this.texture_c.loadEnvironment("Biome.Desert");
		this.world_c.putChunk(1, 0, this.asset_c.data.get("chunks").get("Xiphos-Graveyard"));
		this.world_c.putChunk(0, 0, this.asset_c.data.get("chunks").get("Xiphos-House"));

		this.world_c.seeRays();
		this.events.postBuild(EVENT_HEADER.ENGINE_USER_ARROW, 1);
	}
	
	update(currentTime){
		if(KeyboardState.keys[32 /*Javascript ' '*/] > 0){ this.events.post(EVENT_HEADER.ENGINE_USER_CLUTCH); }

	    let arrows = 0;
	    if(KeyboardState.keys[65 /*Javascript 'a'*/] > 0){ arrows |= EVENT_PAYLOAD.ENGINE_USER_LEFT; }
	    if(KeyboardState.keys[68 /*Javascript 'd'*/] > 0){ arrows |= EVENT_PAYLOAD.ENGINE_USER_RIGHT; }
	    if(KeyboardState.keys[87 /*Javascript 'w'*/] > 0){ arrows |= EVENT_PAYLOAD.ENGINE_USER_TOP; }
	    if(KeyboardState.keys[83 /*Javascript 's'*/] > 0){ arrows |= EVENT_PAYLOAD.ENGINE_USER_BOTTOM; }
	    if(arrows){
			this.events.postBuild(EVENT_HEADER.ENGINE_USER_ARROW, arrows);
		}

	    if(KeyboardState.updatePressed(73 /*Javascript 'i'*/) == 1){ this.events.post(EVENT_HEADER.ENGINE_USER_ESCAPE); }
	    if(KeyboardState.updatePressed(75 /*Javascript 'k'*/) == 1){ this.events.post(EVENT_HEADER.ENGINE_USER_OK); }
	    if(KeyboardState.updatePressed(76 /*Javascript 'l'*/) == 1){ this.events.post(EVENT_HEADER.ENGINE_USER_RETURN); }

	    super.update(currentTime);
	}
	
	render(currentTime){
		super.render(currentTime);
		this.farview_render();
		this.canvas.swapBuffer();
	}

	//Farview

    farview_requested;
    farview_running;
    farview_screen;

    farview_render(){ if(!this.farview_requested){ this.farview_screen = null; return; } if(this.farview_running){ return; }
        const bounds = 256 * 32;
        if(this.farview_requested == 1){
            let oldscreen = this.screen_c;
            let oldsight = this.world_c.sight;
            let oldflags = this.flags;

            if(!this.farview_screen){ this.farview_screen = new ScreenContext(); this.farview_screen.create(bounds, bounds); }
            this.screen_c = this.farview_screen;
            this.world_c.loadSight(256);
            this.flags = ENGINE_FLAGS.RAYCASTER_ALL | ENGINE_FLAGS.RAYCASTER_ALWAYS;
            
            this.farview_running = true;
            this.update();
            this.render();
            this.farview_running = false;

            this.screen_c = oldscreen;
            this.world_c.loadSight(oldsight);
            this.flags = oldflags;

            this.farview_requested = 2;
        }

        const width = this.screen_c.SCREEN_WIDTH;
        const height = this.screen_c.SCREEN_HEIGHT;
        const pixels = this.screen_c.pixels;
        const image = this.farview_screen.pixels;
        const xmul = bounds / width;
        const ymul = bounds / height;
        for(let y = 0, ptr = 0; y < height; y++){
            for(let x = 0; x < width; x++, ptr++){
                pixels[ptr] = image[Math.floor((xmul * x)) + (Math.floor((ymul * y)) * bounds)];
            }
        }
    }
}

const canvas = new CanvasManager("canvas"); canvas.resize(640, 480);//Cellphone(352, 640)
window.engine = new DemoEngine(canvas);
engine.run();

window.constants = CONSTANTS;

//HTML manipulation

function new_btn(name, func){
	let element = document.createElement("button");
	element.innerText = name;
	element.onclick = func;
	return element;
}

const flags_div = document.getElementById("flags");
for(let i = 0, entries = Object.entries(ENGINE_FLAGS); i < entries.length; i++){
	flags_div.appendChild(new_btn(
		entries[i][0].toLowerCase(),
		function (){ engine.toggleFlag(entries[i][1]); }
	));
}

const renderers_div = document.getElementById("renderers");
const renderers_miniv_div = document.getElementById("renderers_miniv");
for(let i = 0, entries = Object.entries(ENGINE_RENDERERS); i < entries.length; i++){
	renderers_div.appendChild(new_btn(
		entries[i][0].toLowerCase(),
		function (){ engine.setRenderer(entries[i][1]); }
	));
	renderers_miniv_div.appendChild(new_btn(
		entries[i][0].toLowerCase(),
		function (){
			engine.swap_mini_view_config();
			engine.setRenderer(entries[i][1]);
			engine.swap_mini_view_config();
			engine.setFlag(ENGINE_FLAGS.MINI_VIEW, true);
		}
	));
}

const tools_div = document.getElementById("tools");
tools_div.appendChild(new_btn("Swap mini-view", function(){engine.swap_mini_view_config()}));