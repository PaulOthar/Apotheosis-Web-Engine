/**
 * Renders a single 'letter' to the screen, based on a 64b bitmap.
 * @param {Uint32Array} frameBuffer frame pixels to be written to.
 * @param {Number} SCREEN_WIDTH width of the screen.
 * @param {Uint8Array} font 64b bitmap.
 * @param {Number} offset to the font symbol.
 * @param {Number} color color of the image do be drawn.
 * @param {Number} screenCoords placement coordinates.
 */
export function render_font(frameBuffer, SCREEN_WIDTH, font, offset, color, screenCoords){
    let row = 0;
    for(let i = 0; i < 8; i++, screenCoords += SCREEN_WIDTH){
        row = font[i + offset];
        if(!row) { continue; }
		if(row & 0x01){ frameBuffer[0 + screenCoords] = color; }
		if(row & 0x02){ frameBuffer[1 + screenCoords] = color; }
		if(row & 0x04){ frameBuffer[2 + screenCoords] = color; }
		if(row & 0x08){ frameBuffer[3 + screenCoords] = color; }
		if(row & 0x10){ frameBuffer[4 + screenCoords] = color; }
		if(row & 0x20){ frameBuffer[5 + screenCoords] = color; }
		if(row & 0x40){ frameBuffer[6 + screenCoords] = color; }
		if(row & 0x80){ frameBuffer[7 + screenCoords] = color; }
    }
}

/**
 * Renders a string with the specified font.
 * @param {Uint32Array} frameBuffer frame pixels to be written to.
 * @param {Number} SCREEN_WIDTH width of the screen.
 * @param {Array} font array with multiple uint8[8] letters.
 * @param {Number} color color of the text.
 * @param {String} string text to be rendered.
 * @param {Number} screenCoords placement coordinates.
 * @returns {Number} last character coordinates
 */
export function render_string(frameBuffer, SCREEN_WIDTH, font, color, string, screenCoords){
	let line_start = screenCoords;
	let typed = 0;
	let value = 0;
    let carriage = 0;
	for(let current = string[carriage++]; current; current = string[carriage++]){
		value = current.charCodeAt(0);

		if(value > 31){
			render_font(frameBuffer, SCREEN_WIDTH, font, value << 3, color, screenCoords);
			screenCoords += 8;
			continue;
		}

		switch(current){
		case '\0':
			return screenCoords;
		case '\b':
			screenCoords -= 8;
			break;
		case '\n':
            line_start += (SCREEN_WIDTH << 3);//increments to the next line, on the start of the feed.
            screenCoords = line_start;
			break;
		case '\v':
			screenCoords += (SCREEN_WIDTH << 3);//increments to the next line, in the same position.
			break;
		case '\t':
			typed = (screenCoords - line_start) >> 3;//gets the number of typed letters between the two pointers.
			typed += 4;//increments the number of typed letters by 4.
			typed &= 0xfffffffc;//ignore the last 2 bits.
			screenCoords = line_start + (typed << 3);//jump to the new position, from the start of the line.
			break;
		}
	}
}

//-----------------------------------------------------------------------------------------------

//Panel

/**
 * Renders a straight and solid line to the screen.
 * @param {Uint32Array} frameBuffer frame to be written to.
 * @param {Number} length length of the line
 * @param {Number} color color to be applied.
 * @param {Number} screenCoords placement coordinates.
 */
function render_solid_line(frameBuffer, length, color, screenCoords){
    for(let i = 0; i < length; i++){ frameBuffer[screenCoords++] = color; }
}

/**
 * Renders a 16 pixels texture line, stretched in the middle.
 * @param {Uint32Array} frameBuffer frame to be written to.
 * @param {Uint32Array} texture texture to be used (16x16).
 * @param {Number} length length of the line (+16)
 * @param {Number} screenCoords placement coordinates.
 * @param {Number} textureCoords where this function will start to read.
 */
function render_stretched_line(frameBuffer, texture, length, screenCoords, textureCoords){
    let screenCoords2 = screenCoords + length + 8;
    let textureCoords2 = textureCoords + 8;
    for(let i = 0; i < 8; i++){
		frameBuffer[i + screenCoords] = texture[i + textureCoords];
		frameBuffer[i + screenCoords2] = texture[i + textureCoords2];
	}

    render_solid_line(frameBuffer, length, texture[textureCoords + 7], screenCoords + 8);
}

/**
 * Renders a panel to the screen, based on the specified texture.
 * @param {Uint32Array} frameBuffer frame to be written to.
 * @param {Uint32Array} texture texture to be used (16x16).
 * @param {Number} SCREEN_WIDTH width of the screen.
 * @param {Number} width width of the inner panel (+16 with the outer panel)
 * @param {Number} height height of the inner panel (+16 with the outer panel)
 * @param {Number} screenCoords placement coordinates.
 */
export function render_panel(frameBuffer, texture, SCREEN_WIDTH, width, height, screenCoords){
    let screenCoords2 = ((8 + height) * SCREEN_WIDTH) + screenCoords;
    let textureCoords = 0, textureCoords2 = 128;
	for(let i = 0; i < 8; i++){
        render_stretched_line(frameBuffer, texture, width, screenCoords + (i * SCREEN_WIDTH), textureCoords + (i * 16));
        render_stretched_line(frameBuffer, texture, width, screenCoords2 + (i * SCREEN_WIDTH), textureCoords2 + (i * 16));
	}

	screenCoords += SCREEN_WIDTH * 8;
	textureCoords += 128;
	for(let i = 0; i < height; i++){
		render_stretched_line(frameBuffer, texture, width, screenCoords, textureCoords);
		screenCoords += SCREEN_WIDTH;
	}
}

//Bar

function render_stretched_frame(frameBuffer, texture, length, screenCoords, textureCoords){
	let screenCoords2 = screenCoords + length + 4;
    let textureCoords2 = textureCoords + 12;
    for(let i = 0; i < 4; i++){
		frameBuffer[i + screenCoords] = texture[i + textureCoords];
		frameBuffer[i + screenCoords2] = texture[i + textureCoords2];
	}

    render_solid_line(frameBuffer, length, texture[textureCoords + 7], screenCoords + 4);
}

function render_frame(frameBuffer, texture, SCREEN_WIDTH, width, height, screenCoords){
	let screenCoords2 = ((4 + height) * SCREEN_WIDTH) + screenCoords;
    let textureCoords = 0, textureCoords2 = 192;
	for(let i = 0; i < 4; i++){
        render_stretched_frame(frameBuffer, texture, width, screenCoords + (i * SCREEN_WIDTH), textureCoords + (i * 16));
        render_stretched_frame(frameBuffer, texture, width, screenCoords2 + (i * SCREEN_WIDTH), textureCoords2 + (i * 16));
	}

	screenCoords += (4 * SCREEN_WIDTH); screenCoords2 = screenCoords + width + 4;
	textureCoords += 128; textureCoords2 = textureCoords + 12;
	for(let i = 0; i < height; i++){
		for(let l = 0; l < 4; l++){
			frameBuffer[l + screenCoords] = texture[l + textureCoords];
			frameBuffer[l + screenCoords2] = texture[l + textureCoords2];
		}
		screenCoords += SCREEN_WIDTH; screenCoords2 += SCREEN_WIDTH;
	}
}

export function render_bar(frameBuffer, texture, SCREEN_WIDTH, width, height, color, fill, screenCoords){
	render_frame(frameBuffer, texture, SCREEN_WIDTH, width, height, screenCoords);
	screenCoords += (SCREEN_WIDTH * 4) + 4;
	if(fill > width){ fill = width; }
	let unfilled = width - fill;
	

	if(height < 2){
		render_solid_line(frameBuffer, fill, color, screenCoords);
		render_solid_line(frameBuffer, unfilled, empty, screenCoords + fill);
		return;
	}

	let dark = ((color >> 1) & 0x7f7f7f) | 0xff000000;
	let empty = texture[136];
	let empty_dark = 
		(
			((empty >> 1) & 0x7f7f7f) + 
			((empty >> 2) & 0x3f3f3f)
		) | 0xff000000;

	let height_half = height / 2;
	for(let i = 0; i < height_half; i++){
		render_solid_line(frameBuffer, fill, color, screenCoords);
		render_solid_line(frameBuffer, unfilled, empty_dark, screenCoords + fill);
		screenCoords += SCREEN_WIDTH;
	}
	for(let i = 0; i < height_half; i++){
		render_solid_line(frameBuffer, fill, dark, screenCoords);
		render_solid_line(frameBuffer, unfilled, empty, screenCoords + fill);
		screenCoords += SCREEN_WIDTH;
	}
}

export function render_multibar(frameBuffer, texture, SCREEN_WIDTH, width, height, color_fill, screenCoords){
	render_frame(frameBuffer, texture, SCREEN_WIDTH, width, height, screenCoords);
	screenCoords += (SCREEN_WIDTH * 4) + 4;

	let unfilled = width;
	for(let i = 0; i < color_fill.length; i += 2){
		if(color_fill[i] == 0){ break; }
		unfilled -= color_fill[i + 1];
	}
	
	let steppedCoords = screenCoords;
	let fill = 0;
	let color = 0;
	if(height < 2){
		for(let i = 0; i < color_fill.length; i += 2){ fill = color_fill[i + 1]; color = color_fill[i];
			render_solid_line(frameBuffer, fill, color, steppedCoords);
			steppedCoords += fill;
		}
		render_solid_line(frameBuffer, unfilled, empty, steppedCoords);
		return;
	}

	let empty = texture[136];//136 = (x, y) > (8, 8)
	let empty_dark = 
		(
			((empty >> 1) & 0x7f7f7f) + 
			((empty >> 2) & 0x3f3f3f)
		) | 0xff000000;

	let height_half = height / 2;
	for(let i = 0; i < height_half; i++){
		steppedCoords = screenCoords;
		for(let i = 0; i < color_fill.length; i += 2){ fill = color_fill[i + 1]; color = color_fill[i];
			render_solid_line(frameBuffer, fill, color, steppedCoords);
			steppedCoords += fill;
		}
		render_solid_line(frameBuffer, unfilled, empty_dark, steppedCoords);
		screenCoords += SCREEN_WIDTH;
	}

	//darkening the colors
	for(let i = 0; i < color_fill.length; i += 2){
		color_fill[i] = ((color_fill[i] >> 1) & 0x7f7f7f) | 0xff000000;
	}

	for(let i = 0; i < height_half; i++){
		steppedCoords = screenCoords;
		for(let i = 0; i < color_fill.length; i += 2){ fill = color_fill[i + 1]; color = color_fill[i];
			render_solid_line(frameBuffer, fill, color, steppedCoords);
			steppedCoords += fill;
		}
		render_solid_line(frameBuffer, unfilled, empty, steppedCoords);
		screenCoords += SCREEN_WIDTH;
	}
}

//Complex interfaces

export function render_selection(frameBuffer, texture, font, SCREEN_WIDTH, word_width, word_height, item_color, selected_color, selected_index, items, branch_name, screenCoords){
	render_panel(frameBuffer, texture, SCREEN_WIDTH, word_width * 8, 8, screenCoords);
	render_string(frameBuffer, SCREEN_WIDTH, font, selected_color, branch_name, screenCoords + (SCREEN_WIDTH * 8) + 8);
	screenCoords += (SCREEN_WIDTH * 24);
	
	render_panel(frameBuffer, texture, SCREEN_WIDTH, word_width * 8, word_height * 8, screenCoords);
	screenCoords += (SCREEN_WIDTH * 8) + 8;

	let text = new String();
	for(let i = 0; i < word_height; i++){
		if(i > 0){ text += "\n"; }
		if(i == selected_index){ continue; }
		text += items[i];
	}
	render_string(frameBuffer, SCREEN_WIDTH, font, item_color, text, screenCoords);
	screenCoords += ((SCREEN_WIDTH * 8) * selected_index) - 4;
	render_string(frameBuffer, SCREEN_WIDTH, font, selected_color, items[selected_index], screenCoords);
}