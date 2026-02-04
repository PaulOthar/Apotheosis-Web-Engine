export class CanvasManager{
    #canvas; #context;
    #mainImage; frameBuffer;
    width; height;
    depthBuffer;

    constructor(id){
        this.#canvas = document.getElementById(id);
        this.#updateReferences();
    }

    #updateReferences(){
        this.width = this.#canvas.width;
        this.height = this.#canvas.height;
        this.#context = this.#canvas.getContext("2d", { alpha: true });
        this.#mainImage = new ImageData(this.width, this.height);
        this.frameBuffer = new Uint32Array(this.#mainImage.data.buffer);
        this.depthBuffer = new Uint16Array(this.frameBuffer.length);
    }

    resize(width, height){
        this.#canvas.width = width;
        this.#canvas.height = height;
        this.#updateReferences();
    }

    clear(){
        for(let i = 0; i < this.frameBuffer.length; i++){
            this.frameBuffer[i] = 0xff7f7f7f;
            this.depthBuffer[i] = 0;
        }
    }

    swapBuffer(){ this.#context.putImageData(this.#mainImage, 0, 0); }

    swapDepth(){
        for(let i = 0; i < this.frameBuffer.length; i++){
            let depth = this.depthBuffer[i];
            if(depth == 0){ continue; }
            if(depth > 255){ depth = (depth << 8) | 0xff; }
            else{ depth = ((~depth) << 16) | 0xff; }
            this.frameBuffer[i] = depth | 0xff000000;
        }
        this.swapBuffer();
    }

    coords(x, y){ return x + (y * this.width); }

    getCanvas(){ return this.#canvas; }
}