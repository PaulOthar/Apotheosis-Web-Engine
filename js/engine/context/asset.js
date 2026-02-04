const typeSymbol = "___type";
const typeSymbolString = "str";
const typeSymbolBase64 = "b64";
const structureSymbol = "___structure";
const structureMap = "map";
const structureTree = "tree";

function parseBase64(encoded){
	let string = atob(encoded);
	let result = new Uint8Array(string.length);
	for(let i = 0; i < result.length; i++){ result[i] = string.charCodeAt(i); }
	return result;
}

function parseBinaryMap(dataMap){
	let keys = dataMap.keys().toArray();
	for(let i = 0; i < keys.length; i++){
		dataMap.set(keys[i], parseBase64(dataMap.get(keys[i])));
	}
	return dataMap;
}

function parseDataMapFromJson(json){
    let map = new Map(Object.entries(json));//High level map
    let keys = map.keys().toArray();
    for(let i = 0; i < keys.length; i++){
        map.set(keys[i], new Map(Object.entries(map.get(keys[i]))));//Nested Map or Single String
    }
    return map;
}

export class AssetContext{
    data;

    static buildFromJson(json){
        let map = parseDataMapFromJson(json);
        return new AssetContext(map);
    }

    /**
     * 
     * @param {String} key 
     * @param {Map} dataMap 
     */
    absorbAssetMap(key, dataMap){
        let current = this.data.get(key);
        if(!current){ current = new Map(); this.data.set(key, current); }
        let map = dataMap.get(key);

        let type = map.get(typeSymbol); map.delete(typeSymbol);
        let structure = map.get(structureSymbol); map.delete(structureSymbol);

        switch(type){
            case typeSymbolString: break;
            case typeSymbolBase64: parseBinaryMap(map); break;
        }

        switch(structure){
            case structureMap:{
                let keys = map.keys().toArray();
                for(let i = 0 ; i < keys.length; i++){ current.set(keys[i], map.get(keys[i])); }
            }
            break;
            case structureTree:{
                let keys = map.keys().toArray();
                for(let i = 0; i < keys.length; i++){
                    let splitted = keys[i].split(".");//splits the name into several layers
                    let branch = current; let l = 0;
                    //for each layer, we will attempt to get (create if doesnt exist)
                    for(; l < splitted.length - 1; l++){//(splitted.length - 1), -1 because the last item is the asset, not a map
                        let found = branch.get(splitted[l]);
                        if(!found){//This layer doesnt exist, so we create it
                            found = new Map();
                            branch.set(splitted[l], found);
                        }
                        branch = found;//Steps down to the recently aquired (created) layer
                    }
                    branch.set(splitted[l], map.get(keys[i]));//Put the asset in the last layer
                }
            }
            break;
        }
    }

    increment(dataMap){
        let keys = dataMap.keys().toArray();
        for(let i = 0; i < keys.length; i++){
            let key = keys[i];
            this.absorbAssetMap(key, dataMap);
        }

        return this;
    }

    incrementFromJson(json){ return this.increment(parseDataMapFromJson(json)); }

    constructor(dataMap){
        this.data = new Map();
        if(!dataMap){ return; }
        let keys = dataMap.keys().toArray();
        for(let i = 0; i < keys.length; i++){
            let key = keys[i];
            this.absorbAssetMap(key, dataMap);
        }
    }
}