import { ApotheosisEngine } from "./engine/engine.js";
import { CanvasManager } from "./resource/screen.js";

export class GameEngine extends ApotheosisEngine{
	canvas;
	
	#frameTarget;
	#lastTime;
	#elapsedTime;
	#renderCount
	
	gameTime;
	
	/**
	 * Loads up the game engine
	 * @param {CanvasManager} canvas 
	 */
    constructor(canvas){
        super();
        this.events.addEater(this);
		
		this.loop = this.#loop.bind(this);
		this.#lastTime = 0;
		
		this.canvas = canvas;
		this.loadScreenReferences(
			canvas.frameBuffer,
			canvas.depthBuffer,
			canvas.width,
			canvas.height
		);

		//Math.ceil(Math.sqrt(Math.pow(canvas.width / 2, 2) + Math.pow(canvas.height / 2, 2)) / 32);

		let w = canvas.width / 2; w *= w;
		let h = canvas.height / 2; h *= h;
		let range = Math.sqrt(w + h) / 32;//sqrt(w²+h²) / 32
		this.world_c.loadSight(Math.ceil(range) + 1);
		
		this.#frameTarget = 1000 / 63;
		this.#elapsedTime = 0;
    }
	
	#loop(currentTime){
		let deltaTime = (currentTime - this.#lastTime);
		if(deltaTime > this.#frameTarget){
	        this.update(deltaTime);
	        this.render(deltaTime);
	        this.#lastTime = currentTime;
	        this.#renderCount++;
	    }
		
		this.gameTime += deltaTime / 1000;
		this.#elapsedTime += deltaTime;
		
		if(this.#elapsedTime >= 1000){
			this.#elapsedTime = 0;
			this.#renderCount = 0;
		}
		
		window.requestAnimationFrame(this.loop);
	}
	
	async setup(){}
	
	/**
	 * @param {Function} setupFunction 
	 */
	async run(){
		await this.setup();
		this.#loop(0);
	}

    handleEvent(event, header, payload, eventQueue){
        return super.handleEvent(event, header, payload, eventQueue);
    }

	___render(encoded){ super.___render(encoded); this.canvas.swapBuffer(); }
}