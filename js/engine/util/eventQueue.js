const max_size = 64;
const size_mask = max_size - 1;

export const EVENT_HEADER_MASK = 0xffff;

export function build_event(template, payload){ return template | (payload << 16); }

export class EventQueue{
    stack;
    head;
    tail;

    stream_size;
    stream_mask;
    data_stream;
    data_stream_head;
    
    handlers;
    eaters;//Event eaters

    constructor(...handlers){
        this.handlers = handlers;
        this.stack = new Uint32Array(max_size);
        this.head = 0;
        this.tail = 0;

        this.stream_size = 4;//16 bytes
        this.stream_mask = (1 << this.stream_mask) - 1;
        this.data_stream = new Uint8Array(1 << (this.stream_size + 8));
        this.data_stream_head = 0;

        this.eaters = new Array();
    }

    addEater(eater){ this.eaters.push(eater); }

    /**
     * Posts a new event to the queue
     * @param {Number} event structured event
     */
    post(event){
        this.stack[this.head] = event;
        this.head = (this.head + 1) & size_mask;
    }

    /**
     * Posts a new event to the queue, with a specific structure
     * @param {Number} template owner and message 
     * @param {Number} payload 2 bytes sized message
     */
    postBuild(template, payload){
        this.post(template | (payload << 16));
    }

    /**
     * Posts a new event to the queue, with a stream of data referenced
     * @param {Number} template 
     * @param {Uint8Array} data 
     */
    postStream(template, data){
        let payload = this.data_stream_head;
        let size = (data.length >> this.stream_size) + (data.length & this.stream_mask ? 1 : 0);

        for(let i = 0, ptr = this.data_stream_head; i < data.length; i++, ptr++){
            this.data_stream[ptr] = data[i];
        }

        payload |= size << 8;
        this.data_stream_head = (this.data_stream_head + size);
        this.post(template, payload);
    }

    static build(owner, type, payload){
        return owner | (type << 8) | (payload << 16);
    }

    static buildPayload(template, payload){
        return template | (payload << 16);
    }

    #feedEvent(event, header, payload){
        for(let i = 0; i < this.eaters.length; i++){
            if(this.eaters[i].handleEvent(event, header, payload, this)){ return true; }
        }
        return false;
    }

    /**
     * Processes the current event in queue.
     * @returns false if there is no more events to deal with
     */
    process(){
        if(this.tail == this.head){ return false; }

        let event = this.stack[this.tail];
        this.tail = (this.tail + 1) & size_mask;

        let owner = event & 0xff;
        let header = event & EVENT_HEADER_MASK;
        let payload = event >> 16;

        if(this.#feedEvent(event, header, payload)){ return true; }
        this.handlers[owner].handleEvent(event, header, payload, this);//event handlers may post new events at will
        return true;
    }
}