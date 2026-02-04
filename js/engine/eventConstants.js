import { EventQueue } from "./util/eventQueue.js";

export function templt(owner, type){
    return EventQueue.build(owner, type, 0);
}

export const EVENT_OWNERS = {
    ENGINE:     0,
    SCREEN:     1,
    ASSETS:     2,
    TEXTURE:    3,
    WORLD:      4,
}

export const EVENT_HEADER = {
    ENGINE_USER_ARROW:  templt(EVENT_OWNERS.ENGINE, 1),//wasd
    ENGINE_USER_OK:     templt(EVENT_OWNERS.ENGINE, 2),//k
    ENGINE_USER_RETURN: templt(EVENT_OWNERS.ENGINE, 3),//l
    ENGINE_USER_ESCAPE: templt(EVENT_OWNERS.ENGINE, 4),//i
    ENGINE_USER_CLUTCH: templt(EVENT_OWNERS.ENGINE, 5),//[space]

    TEXTURE_LOAD_ENVIRONMENT: templt(EVENT_OWNERS.TEXTURE, 1),
    WORLD_UPDATE_CHUNK: templt(EVENT_OWNERS.WORLD, 1),
}

export const EVENT_PAYLOAD = {
    ENGINE_USER_LEFT:   0b0001,
    ENGINE_USER_RIGHT:  0b0010,
    ENGINE_USER_TOP:    0b0100,
    ENGINE_USER_BOTTOM: 0b1000,
}