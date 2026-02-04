const sine = [
		0,/*[0]*/
		0.01745240643728351,/*[1]*/
		0.03489949670250097,/*[2]*/
		0.05233595624294383,/*[3]*/
		0.0697564737441253,/*[4]*/
		0.08715574274765817,/*[5]*/
		0.10452846326765346,/*[6]*/
		0.12186934340514748,/*[7]*/
		0.13917310096006544,/*[8]*/
		0.15643446504023087,/*[9]*/
		0.17364817766693033,/*[10]*/
		0.1908089953765448,/*[11]*/
		0.20791169081775931,/*[12]*/
		0.224951054343865,/*[13]*/
		0.24192189559966773,/*[14]*/
		0.25881904510252074,/*[15]*/
		0.27563735581699916,/*[16]*/
		0.29237170472273677,/*[17]*/
		0.3090169943749474,/*[18]*/
		0.32556815445715664,/*[19]*/
		0.3420201433256687,/*[20]*/
		0.35836794954530027,/*[21]*/
		0.374606593415912,/*[22]*/
		0.3907311284892737,/*[23]*/
		0.40673664307580015,/*[24]*/
		0.42261826174069944,/*[25]*/
		0.4383711467890774,/*[26]*/
		0.45399049973954675,/*[27]*/
		0.4694715627858908,/*[28]*/
		0.48480962024633706,/*[29]*/
		0.5,/*[30]*/
		0.5150380749100542,/*[31]*/
		0.5299192642332049,/*[32]*/
		0.5446390350150271,/*[33]*/
		0.5591929034707469,/*[34]*/
		0.573576436351046,/*[35]*/
		0.5877852522924731,/*[36]*/
		0.6018150231520483,/*[37]*/
		0.6156614753256582,/*[38]*/
		0.6293203910498374,/*[39]*/
		0.6427876096865393,/*[40]*/
		0.6560590289905072,/*[41]*/
		0.6691306063588582,/*[42]*/
		0.6819983600624985,/*[43]*/
		0.6946583704589973,/*[44]*/
		0.7071067811865475,/*[45]*/
		0.7193398003386511,/*[46]*/
		0.7313537016191705,/*[47]*/
		0.7431448254773942,/*[48]*/
		0.754709580222772,/*[49]*/
		0.766044443118978,/*[50]*/
		0.7771459614569708,/*[51]*/
		0.788010753606722,/*[52]*/
		0.7986355100472928,/*[53]*/
		0.8090169943749475,/*[54]*/
		0.8191520442889918,/*[55]*/
		0.8290375725550417,/*[56]*/
		0.8386705679454239,/*[57]*/
		0.848048096156426,/*[58]*/
		0.8571673007021122,/*[59]*/
		0.8660254037844386,/*[60]*/
		0.8746197071393957,/*[61]*/
		0.8829475928589269,/*[62]*/
		0.8910065241883678,/*[63]*/
		0.898794046299167,/*[64]*/
		0.9063077870366499,/*[65]*/
		0.9135454576426009,/*[66]*/
		0.9205048534524403,/*[67]*/
		0.9271838545667874,/*[68]*/
		0.9335804264972017,/*[69]*/
		0.9396926207859083,/*[70]*/
		0.9455185755993167,/*[71]*/
		0.9510565162951535,/*[72]*/
		0.9563047559630354,/*[73]*/
		0.9612616959383189,/*[74]*/
		0.9659258262890683,/*[75]*/
		0.9702957262759965,/*[76]*/
		0.9743700647852352,/*[77]*/
		0.9781476007338056,/*[78]*/
		0.981627183447664,/*[79]*/
		0.984807753012208,/*[80]*/
		0.9876883405951378,/*[81]*/
		0.9902680687415703,/*[82]*/
		0.992546151641322,/*[83]*/
		0.9945218953682733,/*[84]*/
		0.9961946980917455,/*[85]*/
		0.9975640502598242,/*[86]*/
		0.9986295347545738,/*[87]*/
		0.9993908270190958,/*[88]*/
		0.9998476951563913,/*[89]*/
		1/*[90]*/
];

export function static_sine(angle_degree){
	if(angle_degree < 0){ return static_sine(angle_degree + 360); }

	if(angle_degree > 180){
		if(angle_degree > 270){
			if(angle_degree > 360) return static_sine(angle_degree % 360);
			return -sine[360 - angle_degree];
		}
		return -sine[angle_degree - 180];
	} else{ 
		if(angle_degree < 90) return sine[angle_degree];
		return sine[180 - angle_degree];
	}

	if(angle_degree > 90){ if(angle_degree > 180){
		return -sine[angle_degree - 180];}
		return sine[180 - angle_degree];}
	else if(angle_degree > 270){ if(angle_degree > 360){
		return static_sine(angle_degree % 360); }
		return -sine[360 - angle_degree];}
	
	return sine[angle_degree];

	if(angle_degree > 90){ if(angle_degree > 180){ if(angle_degree > 270){ if(angle_degree > 360){
		return static_sine(angle_degree % 360);}
		return -sine[360 - angle_degree];}//return -static_sine(360 - angle_degree);}
		return -sine[angle_degree - 180];}//return -static_sine(angle_degree - 180);}
		return sine[180 - angle_degree];}//return static_sine(180 - angle_degree);}
	return sine[angle_degree];
}

const SQUARE_ROOT_PRECISION = 25;

export class Vector{
    x; y;

    constructor(x, y){ this.set(x, y); }
    set(x, y){ this.x = x; this.y = y; }
    copy(vector){ this.x = vector.x; this.y = vector.y; }
}

export function absolute(value){ return value < 0 ? -value : value; }

/**
 * Calculates the square root of a number, on a very specific precision level.
 * @param {Number} value 
 * @param {Number} precision 
 * @returns 
 */
export function squareroot(value, precision){
    let refiner = value / 2;
	let accumulator = 0;
	for(let i = 0; i<precision && refiner != 0; i++){
		let result = refiner + accumulator;
		if(value >= (result * result)){
			accumulator += refiner;
		}
		refiner /= 2;
	}
	return accumulator;
}

/**
 * Makes a value round (no decimal).
 * @param {Number} value 
 * @returns {Number} round value
 */
export function round(value){
	let floor = value - (value % 1);
	if(value < 0){
		return (floor - value >= 0.5) ? floor - 1 : floor;
	}
	return (value - floor >= 0.5) ? floor + 1 : floor;
}

/**
 * Calculates the length of a vector.
 * @param {Number} x horizontal axis
 * @param {Number} y vertical axis
 * @returns length of the vector
 */
export function length(x, y){ return squareroot(x * x + y * y, SQUARE_ROOT_PRECISION); }

/**
 * Normalizes a vector (makes values between 0 and 1)
 * @param {Vector} vector 
 */
export function normalize(vector){
	let len = length(vector.x, vector.y);
	vector.x /= len;
	vector.y /= len;
}

/**
 * Creates a circle with squares for sides.
 * @param {Number} length Radius of the circle
 * @returns {Array} normalized vectors of the squares circle
 */
export function square_circle(length){
    //Grabs all 360 points, scaled and rounded up (Already a valid square circle)
	let buffer = new Array(360);//Array of vectors
    for(let i = 0; i < 360; i++){ buffer[i] = new Vector(0, 0); }//Initialization
	for(let i = 0; i<90; i++){
		let x = round(length * sine[90-i]);
		let y = round(length * sine[i]);
        buffer[i].set(x, y);
		buffer[i].x = x; buffer[i].y = y;
		buffer[179 - i].x = -x; buffer[179 - i].y = y;
		buffer[180 + i].x = -x; buffer[180 + i].y = -y;
		buffer[359 - i].x = x; buffer[359 - i].y = -y;
	}

	//Removes duplicate points
	let stacktop = 0;
	let curvec = new Vector(0, 0), prevec = new Vector(0, 0);
	for(let i = 0; i<360; i++){
		curvec = buffer[i];
		if(curvec.x != prevec.x || curvec.y != prevec.y){
			prevec = curvec;
            buffer[stacktop++].copy(curvec);
		}
	}
	prevec = buffer[0];
	if(curvec.x == prevec.x && curvec.y == prevec.y){
		stacktop--;
	}

    let result = new Array(stacktop);//returns new array, due to being potentially smaller than buffer
    for(let i = 0; i < stacktop; i++){ result[i] = new Vector(0, 0); }

    //Normalizes each vector
	for(let i = 0; i<stacktop; i++){
		curvec = buffer[i];
		normalize(curvec);
		result[i].copy(curvec);
	}

	return result;
}