// Movement directions
const DIR = {
	INVALID: 0,
	UP: 1,
	RIGHT: 2,
	DOWN: 3,
	LEFT: 4,

	Invert: function(direction) {
		if (direction == this.UP) {
			return this.DOWN;
		} else if (direction == this.DOWN) {
			return this.UP;
		} else if (direction == this.LEFT) {
			return this.RIGHT;
		} else if (direction == this.RIGHT) {
			return this.LEFT;
		}
	}
};


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
			Log("ERROR[pipes_game.js/game.Init]: #reset_requested node not found!");
	},

	ResetRequested: function() {
		return this.reset_request_node.GetEnvelopeValue('Value') == 1 ? true : false;
	}
}


var puzzle_state = {
	Init: function(layer) {
		this.output_state = layer.FindNode("#pipes_game_output_state");
		if (!this.output_state)
			Log("ERROR[pipes_game.js/puzzle_state.Init]: Board output state node not found!")

		this.Reset();
	},

	Set: function(value) {
		this.output_state.SetEnvelopeValue("Value", value);
	},

	Reset: function() {
		this.output_state.SetEnvelopeValue('Value', -1);
	}
}


var board = {
	width: 7,
	height: 7,
	content: [
		'_', 'a', 'b', '_', 'i', '_', '_',
		'_',  1,   0,   1 ,  0,  '_', '_',
		'h',  0,   0,   0 ,  1,   1,  '_',
		'g',  1,   0,   1 ,  1,   0,  '_',
		'f',  1,   1,   0 ,  0,   0,  '_',
		'_',  1,   0,   1 ,  1,   1,  'c',
		'_', 'e', '_', '_', 'd', '_', '_'
	],
	input_symbol: 'i',
	output_symbols: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
	output_colors: [
		COLOR.RED, // a
		COLOR.YELLOW, // b
		COLOR.CYAN, // c
		COLOR.MAGENTA, // d
		COLOR.GREY, // e
		COLOR.BROWN, // f
		COLOR.GREEN, // g
		COLOR.GREY // h
	],

	GetOutputColor: function(output_name) {
		var output_index = this.output_symbols.indexOf(output_name);

		return this.output_colors[output_index];
	},

	IsPipe: function(which_index) {
		element = this.Get(which_index);
		return (element == 0) || (element == 1);
	},

	Get: function(index) {
		return this.content[index];
	}, 

	GetNeighbourIndex: function(origin, direction) {
		if (direction == DIR.UP) { // Return element above
			if (origin < this.width)
				return -1;
			else
				return origin - this.width;
		} else if (direction == DIR.DOWN) { // Return element the below
			if (origin + this.width > this.content.length)
				return -1;
			else {
				return origin + this.width;
			}
		} else if (direction == DIR.LEFT) { // Return element on the left
			if ((origin % this.width) == 0)
				return -1;
			else
				return origin - 1;
		} else if (direction == DIR.RIGHT) { // Return element on the right
			if ((origin % this.width) == 6)
				return -1;
			else
				return origin + 1;
		}
	},

	GetPipeIndex: function(index_on_board) {
		var result = -1;

		if (!this.IsPipe(index_on_board)) {
			Log("ERROR[pipes_game.js/board.GetPipeIndex]: Element on index " + which_pipe + " is not pipe!");
			return result;
		}

		for (var i = 0; i <= index_on_board; i++) {
			if ((this.content[i] == 0) || (this.content[i] == 1)) {
				// Found pipe
				result++;
			}
		}

		return result;
	},

	// Search the board for input symbol
	GetStartingPointIndex: function() {
		for (var i = 0; i <= this.content.length; i++) {
			if (this.content[i] == this.input_symbol) {
				return i;
			}
		}

		return -1;
	},

	// Water should flow inside the board
	GetStartingDirection: function(valve_index) {
		if (valve_index < this.width)
			return DIR.DOWN;
		else if (valve_index + 7 > this.content.length)
			return DIR.UP;
		else if ((valve_index % this.width) == 0)
			return DIR.RIGHT;
		else if ((valve_index % this.width) == 6)
			return DIR.LEFT;

		Log("ERROR[pipes_game.js/board.GetStartingDirection]: Valve is not placed on board borders!")
		return 0;
	},

	GetWaterPath: function() {
		var water_path = {
				indices: [],
				directions: [] // Important for setting proper mapping on the pipe
			},
			current_element_index = this.GetStartingPointIndex(),
			water_direction = this.GetStartingDirection(current_element_index),
			next_element_index = -1;

		// Add starting index to list
		water_path.indices.push(current_element_index);
		water_path.directions.push(water_direction);

		while (true) {
			// Track the flow of the water
			next_element_index = this.GetNeighbourIndex(current_element_index, water_direction);

			if (this.IsPipe(next_element_index)) {
				// Next element is pipe, continue water flow
				water_direction = pipes.GetFlowNextDirection(
					this.GetPipeIndex(next_element_index),
					this.Get(next_element_index),
					DIR.Invert(water_direction)
				);

				if (water_direction != DIR.INVALID) {
					// Pipe is correctly rotated
					current_element_index = next_element_index;
					// Append current water path step index
					water_path.indices.push(current_element_index);
					water_path.directions.push(water_direction);
				} else {
					break
				}
			} else {
				break
			}
		}

		// Add the very last index to list
		water_path.indices.push(next_element_index);

		return water_path;
	},

	IsFlowValid: function(water_path) {
		var last_index = water_path[water_path.length - 1],
			last_element = this.Get(last_index);
		
		return typeof(last_element) == 'string' & last_element != '_'; // Does the flow end on the wall
	},

	IsSolved: function(water_path) {
		var last_index = water_path.indices[water_path.indices.length - 1],
			last_element = this.Get(last_index);

		if (last_element == this.winning_end)
			return true;

		return false;
	},

	ElementIndicesToPipeIndices: function(board_indices) {
		var pipes_indices = [];

		for (var i = 1; i < board_indices.length - 1; i++) {
			pipes_indices.push(this.GetPipeIndex(board_indices[i]))
		}

		return pipes_indices;
	}
};


var pipes = {
	// Keep rotations of every pipe in one place
	// if pipe is straight type (0) then rotation means:
	//		0: -
	//		1: |
	//		2: -
	//		3: |
	// if pipe is curved type (1) then rotation means:
	//		0: ┌
	//		1: └
	//		2: ┘
	//		3: ┐
	blocked: false,
	are_empty: true,
	current_output: null,
	filling_duration: 5, // seconds
	emptying_duration: 1, // seconds
	default_color: COLOR.BLUE,

	Init: function(layer) {
		this.hotzone = [];
		this.rotation = [];
		this.mapping_position = [];
		this.mapping_direction = [];
		this.mapping_scale;

		for (i = 0; i < 24; i++) {
			var hotzone = layer.FindNode(''.concat('pipe_hz_', i))
			var rotation = layer.FindNode(''.concat('pipe_rot_', i))
			var mapping_position = layer.FindNode(''.concat('pipe_map_pos_', i))
			var mapping_direction = layer.FindNode(''.concat('pipe_map_dir_', i))

			if (hotzone && rotation && mapping_position && mapping_direction) {
				// Node found, push it to global array
				this.hotzone.push(hotzone);
				this.rotation.push(rotation);
				this.mapping_position.push(mapping_position);
				this.mapping_direction.push(mapping_direction);
			} else {
				// Node not found, log it
				Log("ERROR[pipes_game.js/pipes.Init]: Pipe controllers for pipe " + i + " has not been found!");
			}
		}

		this.mapping_scale = layer.FindNode("pipes_map_scale");

		if (!this.mapping_scale) {
			// Node not found, log it
			Log("ERROR[pipes_game.js/pipes.Init]: Pipes mapping scale not found!");
		}

		this.color_r = layer.FindNode('#pipes_game_water_r');
		this.color_g = layer.FindNode('#pipes_game_water_g');
		this.color_b = layer.FindNode('#pipes_game_water_b');
		if (!this.color_r || !this.color_g || !this.color_b) {
			// Node not found, log it
			Log("ERROR[pipes_game.js/pipes.Init]: Water color nodes cannot be found!")
		}

		this.fill_progress = layer.FindNode('#pipes_game_fill_progress');
		if (!this.fill_progress)
			Log("ERROR[pipes_game.js/pipes.Init]: Water filling progress node could not be found!");

		this.Reset();
		this.SetColor(COLOR.BLUE);
	},

	Reset: function() {
		for (i = 0; i < this.rotation.length; i++) {
			this.rotation[i].SetEnvelopeValue('Value', 0);
			this.mapping_position[i].SetEnvelopeValue('Value', 0);
			this.mapping_direction[i].SetEnvelopeValue('Value', 0);
			this.mapping_scale.SetEnvelopeValue('Value', 0);
			this.fill_progress.SetEnvelopeValue('Value', 0);
		}
	},

	Rotate: function(which_pipe) {
		var current_rotation = this.rotation[which_pipe].GetEnvelopeValue("Value");
		var new_rotation = (current_rotation + 1) % 4;

		this.rotation[which_pipe].SetEnvelopeValue("Value", new_rotation);
	},

	GetRotation: function(which_pipe) {
		return this.rotation[which_pipe].GetEnvelopeValue('Value');
	},

	GetFillingDuration: function() {
		return this.filling_duration;
	},

	GetHit: function() {
		if (this.blocked) return -1;

		for (i = 0; i < this.hotzone.length; i++) {
			is_hit = this.hotzone[i].GetEnvelopeValue("Current Hit Zone") == 1 ? true : false;

			if (is_hit) return i;
		}

		return -1;
	},

	BlockInput: function(unlock_after) {
		this.blocked = true;

		if (unlock_after > 0) {
			Timer(unlock_after, function() { pipes.UnblockInput(); }, name="", false);
		}
	},

	UnblockInput: function(delay) {
		if (delay > 0) {
			Timer(delay, function() { pipes.blocked = false; }, name="", false);
		} else {
			this.blocked = false;
		}
	},

	GetFlowNextDirection: function(next_pipe_index, next_pipe_type, direction_from) {
		var rotation = this.GetRotation(next_pipe_index);

		if (next_pipe_type == 0) { // Straight pipe
			if ((direction_from == DIR.UP) || (direction_from == DIR.DOWN)) {
				if ((rotation == 0) || (rotation == 2)) // Flow not possible
					return DIR.INVALID;
				else
					return DIR.Invert(direction_from);
			} else if ((direction_from == DIR.LEFT) || (direction_from == DIR.RIGHT)) {
				if ((rotation == 1) || (rotation == 3)) // Flow not possible
					return DIR.INVALID;
				else
					return DIR.Invert(direction_from);
			}
		} else if (next_pipe_type == 1) { // Curved pipe
			if ((direction_from == DIR.UP)) {
				if ((rotation == 0) || (rotation == 3)) 
					return DIR.INVALID;
				else if (rotation == 1)
					return DIR.RIGHT;
				else if (rotation == 2)
					return DIR.LEFT;
			} else if ((direction_from == DIR.DOWN)) {
				if ((rotation == 1) || (rotation == 2))
					return DIR.INVALID;
				else if (rotation == 0)
					return DIR.RIGHT;
				else if (rotation == 3)
					return DIR.LEFT;
			} else if ((direction_from == DIR.LEFT)) {
				if ((rotation == 0) || (rotation == 1))
					return DIR.INVALID;
				else if (rotation == 2)
					return DIR.UP;
				else if (rotation == 3)
					return DIR.DOWN;
			} else if ((direction_from == DIR.RIGHT)) {
				if ((rotation == 2) || (rotation == 3)) 
					return DIR.INVALID;
				else if (rotation == 0)
					return DIR.DOWN;
				else if (rotation == 1)
					return DIR.UP;
			}
		}

		return 0;
	},

	SetMapping: function(water_path) {
		var pipes_indices = board.ElementIndicesToPipeIndices(water_path.indices),
			pipes_count = pipes_indices.length;

		this.filling_duration = pipes_count/4;
		this.emptying_duration = pipes_count/8;

		this.ResetMapping();

		this.mapping_scale.SetEnvelopeValue('Value', pipes_count)


		for (var i = 0; i < pipes_indices.length; i++) {
			var pipe_index = pipes_indices[i],
				flow_direction = water_path.directions[i],
				new_mapping_position = 1 - pipes_count + (i * 2),
				new_mapping_direction = this.GetMappingDirection(pipe_index, flow_direction);

			this.mapping_position[pipe_index].SetEnvelopeValue('Value', new_mapping_position);
			this.mapping_direction[pipe_index].SetEnvelopeValue('Value', new_mapping_direction);
		}
	},

	ResetMapping: function() {
		for (var i = 0; i < this.mapping_position.length; i++) {
			this.mapping_position[i].SetEnvelopeValue('Value', 999)
		}
	},

	GetMappingDirection: function(pipe_index, input_flow) {
		var rotation = pipes.GetRotation(pipe_index);

		if (rotation == 0 && input_flow == DIR.LEFT)
			return 1;
		else if (rotation == 1 && input_flow == DIR.DOWN)
			return 1;
		else if (rotation == 2 && input_flow == DIR.RIGHT)
			return 1;
		else if (rotation == 3 && input_flow == DIR.UP)
			return 1;
		else return -1;
	},

	FillWithWater: function(water_path) {
		this.are_empty = false;

		// Set correct mapping for pipes materials
		pipes.SetMapping(water_path);
		// Animate filling pipes
		Timer(0.01, function() {
			var current_progress = pipes.GetFillProgress();

			if (current_progress >= 1)
				CancelTimer('FillPipesTimer')

			pipes.SetFillProgress(current_progress + 0.01 / pipes.GetFillingDuration());
		}, name='FillPipesTimer', true);

		this.current_output = board.Get(water_path.indices[water_path.indices.length - 1]);

		Timer(pipes.GetFillingDuration() * 2.5, function() { pipes.AdjustWaterColorToOutput(); }, name='', false);
		Timer(pipes.GetFillingDuration() * 2.5, function() { button.AdjustColorToOutput(); }, name='', false);
		Timer(pipes.GetFillingDuration() * 2.5, function() { puzzle_state.Set(pipes.GetFlowOutputIndex()); }, name='', false);
	},

	GetFlowOutputIndex: function() {
		return board.output_symbols.indexOf(this.GetFlowOutput());
	},

	GetFlowOutput: function() {
		return this.current_output;
	},

	EmptyWater: function(water_path) {
		this.are_empty = true;

		// Animate emptying pipes
		Timer(0.01, function() {
			var current_progress = pipes.GetFillProgress();

			if (current_progress <= 0)
				CancelTimer('EmptyPipesTimer')

			pipes.SetFillProgress(current_progress - 0.01 / pipes.emptying_duration);
		}, name='EmptyPipesTimer', true);

		Timer(pipes.emptying_duration * 2.5, function() { pipes.ApplyDefaultColor(); }, name='', false);
		Timer(pipes.emptying_duration * 2.5, function() { button.ApplyDefaultColor(); }, name='', false);
		Timer(pipes.emptying_duration * 2.5, function() { board.Reset(); }, name='', false);
	},

	AreEmpty: function() {
		return this.are_empty;
	},

	GetFillProgress: function() {
		return this.fill_progress.GetEnvelopeValue('Value');
	},

	SetFillProgress: function(value) {
		return this.fill_progress.SetEnvelopeValue('Value', value);
	},

	SetColor: function(color) {
		if (this.color_r && this.color_g && this.color_b) {
			this.color_r.SetEnvelopeValue('Value', color[0]);
			this.color_g.SetEnvelopeValue('Value', color[1]);
			this.color_b.SetEnvelopeValue('Value', color[2]);
		}
	},

	AdjustWaterColorToOutput: function() {
		this.SetColor(board.GetOutputColor(this.GetFlowOutput()));
	},

	GetColor: function() {
		var result = [];

		if (this.color_r && this.color_g && this.color_b) {
			result.push(this.color_r.GetEnvelopeValue('Value'));
			result.push(this.color_g.GetEnvelopeValue('Value'));
			result.push(this.color_b.GetEnvelopeValue('Value'));
		}

		return result;
	},

	ApplyDefaultColor: function() {
		this.SetColor(this.default_color)
	}
};

var button = {
	blocked: false,
	impulse_duration: 0,
	default_color: COLOR.BLUE,
	blinking: false,
	last_blink: 0,

	Init: function(layer) {
		this.hotzone = layer.FindNode("#pipes_game_button_hotzone");
		if (!this.hotzone)
			Log("ERROR[pipes_game.js/button.Init]: #pipes_game_button_hotzone could not be found!");

		this.animation_response = layer.FindNode("#pipes_game_button_animation");
		if (!this.animation_response)
			Log("ERROR[pipes_game.js/button.Link]: #pipes_game_button_animation node could not be found");

		this.color_r = layer.FindNode("#pipes_game_button_r");
		if (!this.color_r)
			Log("ERROR[pipes_game.js/button.Link]: #pipes_game_button_r node could not be found");
		this.color_g = layer.FindNode("#pipes_game_button_g");
		if (!this.color_g)
			Log("ERROR[pipes_game.js/button.Link]: #pipes_game_button_g node could not be found");
		this.color_b = layer.FindNode("#pipes_game_button_b");
		if (!this.color_b)
			Log("ERROR[pipes_game.js/button.Link]: #pipes_game_button_b node could not be found");

		this.Reset();
	},

	Reset: function() {
		this.ApplyDefaultColor();
	},

	BlockInput: function(unlock_after) {
		this.blocked = true;

		if (unlock_after > 0) {
			Timer(unlock_after, function() { button.UnblockInput(); }, name="", false);
		}
	},

	UnblockInput: function() {
		this.blocked = false;
	},

	IsHit: function() {
		if (this.blocked) return false;
		
		return this.hotzone.GetEnvelopeValue("Current Hit Zone") == 1 ? true : false;
	},

	Push: function() {
		if (this.animation_response) {
			current_value = this.animation_response.GetEnvelopeValue('Value');
			this.animation_response.SetEnvelopeValue('Value', (current_value + 1) % 2);
		}
	},

	SetColor: function(color) {
		this.color = color;

		if (this.color_r && this.color_g && this.color_b) {
			this.color_r.SetEnvelopeValue('Value', color[0]);
			this.color_g.SetEnvelopeValue('Value', color[1]);
			this.color_b.SetEnvelopeValue('Value', color[2]);
		}
	},

	ApplyDefaultColor: function() {
		this.SetColor(this.default_color);
	},

	AdjustColorToOutput: function() {
		this.SetColor(board.GetOutputColor(pipes.GetFlowOutput()));
	},

	ToggleLight: function(toggle) {
		mult = (toggle == true ? 1 : 0);
		if (this.color_r && this.color_g && this.color_b) {
			this.color_r.SetEnvelopeValue('Value', this.color[0] * mult);
			this.color_g.SetEnvelopeValue('Value', this.color[1] * mult);
			this.color_b.SetEnvelopeValue('Value', this.color[2] * mult);
		}
	},

	GetColor: function() {
		var result = [];

		if (this.color_r && this.color_g && this.color_b) {
			result.push(this.color_r.GetEnvelopeValue('Value'));
			result.push(this.color_g.GetEnvelopeValue('Value'));
			result.push(this.color_b.GetEnvelopeValue('Value'));
		}

		return result;
	},

	StartBlinking: function(stop_after) {
		this.blinking = true;

		if (stop_after > 0) {
			Timer(stop_after, function() { button.StopBlinking(); }, name="", false);
		}
	},

	StopBlinking: function() {
		this.blinking = false;
		// Go back to original color
		this.SetColor(this.color);
	},

	Update: function() {
		if (this.blinking) {
			var blink_speed = 250; // Milliseconds between clicks

			if ((this.last_blink + blink_speed) < Date.now()) {
				this.last_blink = Date.now();

				if (COLOR.AreEqual(this.GetColor(), COLOR.BLACK)) {
					this.ToggleLight(true);
				}
				else {
					this.ToggleLight(false);
				}
			}
		}
	}
};


// Mouse
var mouse = {
	Init: function(layer) {
		this.cursor = layer.FindNode("#cursor");
		if (!this.cursor)
			Log("ERROR[pipes_game.js/mouse.Init]: Cursor node could not be found");

		this.clicked_node = layer.FindNode("#mouse_clicked");
		if (!this.clicked_node)
			Log("ERROR[pipes_game.js/mouse.Init]: #mouse_clicked node could not be found");

		this.pressed_node = layer.FindNode("#mouse_pressed");
		if (!this.pressed_node)
			Log("ERROR[pipes_game.js/mouse.Init]: #mouse_clicked node could not be found");
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
	var layer = UpdateContext.Layer // Get current layer

	mouse.Init(layer);
	game.Init(layer);
	puzzle_state.Init(layer);

	pipes.Init(layer);
	button.Init(layer);
}

// --- Main update function
function Update(){
	InteractionStep();
	UpdateStep();
};


// Define mechanics of user interaction
function InteractionStep() {
	if (mouse.IsClicked()) {
		Log('a')
		hit = pipes.GetHit()
		if (hit != -1) {
			// Clicked on pipe
			pipes.Rotate(hit);
		}

		if (button.IsHit()) {
			button.Push();

			if (pipes.AreEmpty()) {
				// Pipes are empty
				var water_path = board.GetWaterPath();

				if (board.IsFlowValid(water_path.indices)) {
					pipes.FillWithWater(water_path);
					// Blink button while water is filling pipes
					button.StartBlinking(pipes.GetFillingDuration() * 2.5);
					// Disable interaction while pipes are filled with water
					pipes.BlockInput();
				}
			} else {
				// Pipes are filled
				pipes.EmptyWater();
				// Blink button until there is no water in pipes
				button.StartBlinking(pipes.emptying_duration * 2.5);
				// Allow interaction as soon as pipes are empty
				pipes.UnblockInput(pipes.GetFillingDuration() * 2.5);
			}		

			// Block interaction until water is flowing
			button.BlockInput(pipes.GetFillingDuration() * 2.5);
		}
	}
};


function UpdateStep() {
	if (game.ResetRequested()) { // Reset script if reset is requested in end game
		puzzle_state.Reset();

		pipes.Reset();
		button.Reset();
	}

	button.Update()
}