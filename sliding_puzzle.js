// Movement directions
const DIRECTION = {
	UP: 1,
	RIGHT: 2,
	DOWN: 3,
	LEFT: 4
}


const COLOR = {
	BLACK: [0, 0, 0],
	RED: [1, 0, 0],
	GREEN: [0, 1, 0],
	BLUE: [0, 0, 1],
	YELLOW: [1, 1, 0],
	CYAN: [0, 1, 1],
	MAGENTA: [1, 0, 1],
	MAROON: [0.5, 0, 0],
	BROWN: [0.45, 0.10, 0.10],
	PURPLE: [0.5, 0, 0.5],
	GREY: [0.5, 0.5, 0.5],

	AreEqual: function(color1, color2) {
		for (var i = 0; i < 3; i++) {
			if (color1[i] != color2[i])
				return false;
		}

		return true;
	}
};


var game = {
	Init: function(layer) {
		this.reset_request_node = layer.FindNode("#reset_requested");
		if (!this.reset_request_node)
			Log("ERROR[sliding_puzzle.js/game.Init]: #reset_requested node not found!");
	},

	ResetRequested: function() {
		return this.reset_request_node.GetEnvelopeValue('Value') == 1 ? true : false;
	}
}


var puzzle_state = {
	Init: function(layer) {
		this.output_state = layer.FindNode("#sliding_puzzle_solved");
		if (!this.output_state)
			Log("ERROR[sliding_puzzle.js/puzzle_state.Init]: #sliding_puzzle_solved node not found!")

		this.Reset();
	},

	Get: function() {
		return this.output_state.GetEnvelopeValue("Value");
	},

	Set: function(value) {
		this.output_state.SetEnvelopeValue("Value", value);
	},

	Reset: function() {
		this.output_state.SetEnvelopeValue('Value', 0);
	}
}


var board = {
	blocked: false,
	// Starting placement of tiles
	placement:  [
		'_', 3, 1,
		4, 7, 2,
		0, 6, 5
	],
	correct_order: [0, 1, 2, 3, 4, 5, 6, 7, '_'],
	move_envelopes: [],
	hot_zones: [],

	Init: function(layer) {
		// Get null nodes and their move envelopes
		for (i = 0; i < 8; i++) {
			var found_envelope_X = layer.FindNode(''.concat('m', i, "_x"))
			var found_envelope_Y = layer.FindNode(''.concat('m', i, "_y"))

			if (found_envelope_X && found_envelope_Y) {
				// Node found, push it to global array
				this.move_envelopes.push([found_envelope_X, found_envelope_Y]);
			} else {
				// Node not found, log it
				Log("ERROR[sliding_puzzle.js/board.Init]: Tile m" + i + " moving envelopes has not been found!")
			}
		}

		// Get Hot Zones
		for (i = 0; i < 9; i++) {
			var found_node = layer.FindNode(''.concat('h', i))

			if (found_node) {
				// Node found, push it to global array
				this.hot_zones.push(found_node);
			} else {
				// Node not found, log it
				Log("ERROR[sliding_puzzle.js/board.Init]: Hot Zone h" +  i + " has not been found!");
			}
		}

		this.Reset();
	},

	Reset: function() {
		for (i = 0; i < 8; i++) {
			this.move_envelopes[i][0].SetEnvelopeValue('Value', 0);
			this.move_envelopes[i][1].SetEnvelopeValue('Value', 0);
		}
	},

	Get: function(zone_id) {
		return this.placement[zone_id];
	},

	Move: function(zone_id) {
		tile_id = this.Get(zone_id)
		direction = this.GetValidDirection(zone_id)
		var step_scale = 0.666;

		if (!direction)
			// No direction to go, dont do anything
			return

		if (direction == DIRECTION.UP) {
			current_y = this.move_envelopes[tile_id][1].GetEnvelopeValue('Value');
			new_y = current_y + step_scale;
			this.move_envelopes[tile_id][1].SetEnvelopeValue('Value', new_y);
		} else if (direction == DIRECTION.RIGHT) {
			current_x = this.move_envelopes[tile_id][0].GetEnvelopeValue('Value');
			new_x = current_x - step_scale;
			this.move_envelopes[tile_id][0].SetEnvelopeValue('Value', new_x);
		} else if (direction == DIRECTION.DOWN) {
			current_y = this.move_envelopes[tile_id][1].GetEnvelopeValue('Value');
			new_y = current_y - step_scale;
			this.move_envelopes[tile_id][1].SetEnvelopeValue('Value', new_y);
		} else if (direction == DIRECTION.LEFT) {
			current_x = this.move_envelopes[tile_id][0].GetEnvelopeValue('Value');
			new_x = current_x + step_scale;
			this.move_envelopes[tile_id][0].SetEnvelopeValue('Value', new_x);
		}
	},

	GetValidDirection: function(zone_id) {
		if ((zone_id - 3) > -1) { // Check up direction
			if (this.placement[zone_id - 3] == '_') {
				// Switch places of elements
				this.placement[zone_id - 3] = this.placement[zone_id];
				this.placement[zone_id] = '_';

				// Return direction to perform animation
				return DIRECTION.UP;
			}
		}

		if (((zone_id % 3) + 1) < 3) { // Check right
			if (this.placement[zone_id + 1] == '_') {
				// Switch places of elements
				this.placement[zone_id + 1] = this.placement[zone_id];
				this.placement[zone_id] = '_';

				return DIRECTION.RIGHT;
			}
		}

		if ((zone_id + 3) < 9) { // Check down
			if (this.placement[zone_id + 3] == '_') {
				// Switch places of elements
				this.placement[zone_id + 3] = this.placement[zone_id];
				this.placement[zone_id] = '_';

				return DIRECTION.DOWN;
			}
		}

		if (((zone_id % 3) - 1) > -1) { // Check left
			if (this.placement[zone_id - 1] == '_') {
				// Switch places of elements
				this.placement[zone_id - 1] = this.placement[zone_id];
				this.placement[zone_id] = '_';

				return DIRECTION.LEFT;
			}
		}

		return 0
	},

	IsSolved: function() {
		for (i = 0; i < 9; i++) {
			if (this.placement[i] != this.correct_order[i]) {
				return false
			}
		}

		return true;
	},

	BlockInput: function() {
		this.blocked = true;
	},

	UnblockInput: function() {
		this.blocked = false;
	},

	GetHit: function() {
		if (this.blocked) return -1;

		for (i = 0; i < this.hot_zones.length; i++) {
			is_hit = this.hot_zones[i].GetEnvelopeValue("Current Hit Zone") == 1 ? true : false

			if (is_hit) {
				return i
			}
		}

		return -1;
	}
}


var button = {
	impulse_duration: 0,
	default_color: COLOR.BLUE,
	state: -1,
	max_states: 8,
	state_colors: [
		COLOR.RED,
		COLOR.YELLOW,
		COLOR.CYAN,
		COLOR.MAGENTA,
		COLOR.GREY,
		COLOR.BROWN,
		COLOR.GREEN,
		COLOR.PURPLE
	],

	Init: function(layer) {
		this.hotzone = layer.FindNode("#sliding_puzzle_button_hotzone");
		if (!this.hotzone)
			Log("ERROR[sliding_puzzle.js/button.Init]: #sliding_puzzle_button_hotzone could not be found!");

		this.animation_response = layer.FindNode("#sliding_puzzle_button_animation");
		if (!this.animation_response)
			Log("ERROR[sliding_puzzle.js/button.Init]: #sliding_puzzle_button_animation output state node not found!")

		this.color_r = layer.FindNode("#sliding_puzzle_button_r");
		this.color_g = layer.FindNode("#sliding_puzzle_button_g");
		this.color_b = layer.FindNode("#sliding_puzzle_button_b");

		if (!this.color_r || !this.color_g || !this.color_b)
			Log("ERROR[sliding_puzzle.js/button.Init]: Color nodes not found!")

		this.button_state_node = layer.FindNode("#sliding_puzzle_output_state");

		if (!this.button_state_node)
			Log("ERROR[sliding_puzzle.js/board.Init]: Board output state node not found!")

		this.Reset();
	},

	Reset: function() {
		this.SetColor(this.default_color);
	},

	IsHit: function() {
		return this.hotzone.GetEnvelopeValue("Current Hit Zone") == 1 ? true : false;
	},

	Push: function() {
		if (this.animation_response) {
			current_value = this.animation_response.GetEnvelopeValue('Value');
			this.animation_response.SetEnvelopeValue('Value', (current_value + 1) % 2);
		}

		return this.NextState();
	},

	NextState: function() {
		this.state = (this.state + 1) % this.max_states;
		this.button_state_node.SetEnvelopeValue('Value', this.state);
		this.SetColor(this.state_colors[this.state])

		return this.state;
	},

	SetColor: function(color) {
		this.color = color;

		if (this.color_r && this.color_g && this.color_b) {
			this.color_r.SetEnvelopeValue('Value', color[0]);
			this.color_g.SetEnvelopeValue('Value', color[1]);
			this.color_b.SetEnvelopeValue('Value', color[2]);
		}
	}
};


// Mouse
var mouse = {
	Init: function(layer) {
		this.cursor = layer.FindNode("#cursor");
		if (!this.cursor)
			Log("ERROR[sliding_puzzle.js/mouse.Init]: Cursor node could not be found");

		this.clicked_node = layer.FindNode("#mouse_clicked");
		if (!this.clicked_node)
			Log("ERROR[sliding_puzzle.js/mouse.Init]: #mouse_clicked node could not be found");

		this.pressed_node = layer.FindNode("#mouse_pressed");
		if (!this.pressed_node)
			Log("ERROR[sliding_puzzle.js/mouse.Init]: #mouse_clicked node could not be found");
	},

	BlockInput: function(unlock_after) {
		this.blocked = true;
	},

	prev_frame_clicked: false, // Depending on a framerate, sometimes the click is captured twice
	IsClicked: function() {
		if (this.blocked) return false;

		clicked = this.clicked_node.GetEnvelopeValue("Value") == 1 ? true : false;

		if (clicked) {
			return !this.prev_frame_clicked;
		} else if (this.prev_frame_clicked) {
			this.prev_frame_clicked = false;
		}

		return false;
	},

	IsPressed: function() {
		if (this.blocked) return false;
		
		return this.pressed_node.GetEnvelopeValue("Value") == 1 ? true : false;
	},

	GetPosition: function() {
		var x = this.cursor.GetEnvelopeValue("Position X"),
			y = this.cursor.GetEnvelopeValue("Position Y"),
			z = this.cursor.GetEnvelopeValue("Position Z");

		return [x, y, z];
	}
};


///////////////////////////////////////////////////////////////////////////////
// --- MAIN BODY --------------------------------------------------------------
/**/

function Init() {
	// Get current layer
	var layer = UpdateContext.Layer

	mouse.Init(layer);
	game.Init(layer);
	puzzle_state.Init(layer);

	board.Init(layer);
	button.Init(layer);
}


// --- Main update function
function Update(){
	InteractionStep();
	UpdateStep();
}


function InteractionStep() {
	if (mouse.IsClicked()) {
		hit_zone = board.GetHit()
		if (hit_zone != -1) {
			board.Move(hit_zone)

			if (board.IsSolved()) {
				puzzle_state.Set(1);
				// Block touching tiles when riddle is solved
				board.BlockInput();
			}
		}

		// If user clicked button
		if (button.IsHit()) {
			button.Push()
		}
	}
}


function UpdateStep() {
	if (game.ResetRequested()) { // Reset script if reset is requested in end game
		puzzle_state.Reset();

		board.Reset();
		button.Reset();
	}
}