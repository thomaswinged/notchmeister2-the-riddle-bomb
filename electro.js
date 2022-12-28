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
			Log("ERROR[electro.js/game.Init]: #reset_requested node not found!");
	},

	ResetRequested: function() {
		return this.reset_request_node.GetEnvelopeValue('Value') == 1 ? true : false;
	}
}


var puzzle_state = {
	Init: function(layer) {
		this.output_state = layer.FindNode("#electro_output_state");
		if (!this.output_state)
			Log("ERROR[electro.js/puzzle_state.Init]: Output state node could not be found!");

		this.Reset();
	},

	Set: function(value) {
		this.output_state.SetEnvelopeValue('Value', value);
	},

	Reset: function() {
		this.Set(0);
	}
}


var board = {
	state: -1, // -1 = idle, 0 = transport, 1 = harder, 2 = finish

	Init: function(layer) {
		this.light = layer.FindNode("#light_brightness");
		if (!this.light)
			Log("ERROR[electro.js/board.Init]: Light brightness node could not be found!");

		this.line_color_r = layer.FindNode("#electro_line_r");
		this.line_color_g = layer.FindNode("#electro_line_g");
		this.line_color_b = layer.FindNode("#electro_line_b");
		if (!this.line_color_r || !this.line_color_g || !this.line_color_b)
			Log("ERROR[electro.js/board.Init]: Line board color nodes could not be found!");

		this.line_blink = layer.FindNode("#electro_line_blink");
		if (!this.line_blink)
			Log("ERROR[electro.js/board.Init]: Line blink modifier node could not be found!");

		this.floor_brightness = layer.FindNode("#electro_floor_brightness");
		if (!this.floor_brightness)
			Log("ERROR[electro.js/board.Init]: Floor brightness modifier node could not be found!");

		this.led_brightness = layer.FindNode("#electro_led_brightness");
		if (!this.led_brightness)
			Log("ERROR[electro.js/board.Init]: LED brightness node could not be found!");

		this.Reset();
	},

	Reset: function() {
		this.state = -1;
		this.SetSceneLightBrightness(1);
		this.SetLEDBrightness(0);
		this.SetLineColor(COLOR.BLACK);
		this.SetLineBlink(0);
		this.SetFloorBrightness(1);
	},

	SetSceneLightBrightness: function(value) {
		this.light.SetEnvelopeValue('Value', value);
	},

	SetLEDBrightness: function(value) {
		this.led_brightness.SetEnvelopeValue('Value', value);
	},

	SetLineColor: function(color) {
		this.line_color_r.SetEnvelopeValue('Value', color[0]);
		this.line_color_g.SetEnvelopeValue('Value', color[1]);
		this.line_color_b.SetEnvelopeValue('Value', color[2]);
	},

	SetLineBlink: function(value) {
		this.line_blink.SetEnvelopeValue('Value', value);
	},

	SetFloorBrightness: function(value) {
		this.floor_brightness.SetEnvelopeValue('Value', value);
	},

	IsDefaultState: function() {
		if (this.state == -1)
			return true;

		return false;
	},

	SetTransportState: function() {
		this.state = 0;
		this.SetLineColor(COLOR.RED);
		this.SetLineBlink(1);
		this.SetSceneLightBrightness(0);
		this.SetFloorBrightness(1);
	},

	SetHarderState: function() {
		this.state = 1;
		this.SetLineBlink(0);
		this.SetFloorBrightness(0);
		this.SetLineColor(COLOR.BLACK);
	},

	SetFinishedState: function() {
		this.state = 2;
		this.SetLineBlink(0);
		this.SetFloorBrightness(1);
		this.SetLEDBrightness(1);
		this.SetLineColor(COLOR.GREEN);
		this.SetSceneLightBrightness(1);
	},

	IsSolved: function() {
		return this.state == 2 ? true : false;
	}
}

var hotzones = {
	Init: function(layer) {
		this.bounding_box = layer.FindNode("#electro_bounding_box_hotzone");
		if (!this.bounding_box)
			Log("ERROR[electro.js/hotzones.Init]: Main bouding box hotzone node could not be found!");

		this.start = layer.FindNode("#electro_start_hotzone");
		if (!this.start)
			Log("ERROR[electro.js/hotzones.Init]: Starting hotzone node could not be found!");

		this.end = layer.FindNode("#electro_end_hotzone");
		if (!this.end)
			Log("ERROR[electro.js/hotzones.Init]: Ending hotzone node could not be found!");

		this.harder = layer.FindNode("#electro_harder_hotzone");
		if (!this.harder)
			Log("ERROR[electro.js/hotzones.Init]: Hotzone making riddle harder could not be found!");
	},

	IsStartingZoneHit: function() {
		return this.start.GetEnvelopeValue("Current Hit Zone") == 1 ? true : false;
	},

	IsEndingZoneHit: function() {
		return this.end.GetEnvelopeValue("Current Hit Zone") == 1 ? true : false;
	},

	IsHarderZoneHit: function() {
		return this.harder.GetEnvelopeValue("Current Hit Zone") == 1 ? true : false;
	},

	IsMainZoneHit: function() {
		return this.bounding_box.GetEnvelopeValue("Current Hit Zone") == 1 ? true : false;
	}
}

var energy = {
	during_transport: false,
	starting_position: [0.388405, -0.231463, 0.819714],

	Init: function(layer) {
		this.visibility = layer.FindNode("#electo_charge_visibility")
		if (!this.visibility)
			Log("ERROR[electro.js/energy.Init]: Energy visibility hotzone node could not be found!");

		this.position = layer.FindNode("#electro_energy_position")
		if (!this.position)
			Log("ERROR[electro.js/energy.Init]: Energy position null node could not be found!");

		this.Reset();
	},

	Reset: function() {
		this.during_transport = false;
		this.SetVisibility(0);
		this.SetStartingPosition();
	},

	SetVisibility: function(value) {
		this.visibility.SetEnvelopeValue("Value", value);
	},

	SetPosition: function(position) {
		this.position.SetEnvelopeValue("Position X", position[0]);
		this.position.SetEnvelopeValue("Position Y", position[1]);
		this.position.SetEnvelopeValue("Position Z", position[2]);
	},

	SetStartingPosition: function() {
		this.SetPosition(this.starting_position)
	},

	IsVisible: function() {
		return this.visibility.GetEnvelopeValue("Value") == 1 ? true : false;
	},

	IsDuringTransport: function() {
		return this.during_transport;
	},

	BeginTransport: function() {
		this.during_transport = true;
		this.SetVisibility(1);
	},

	Update: function() {
		if (this.during_transport) {
			this.SetPosition(mouse.GetPosition())
		}
	}
}

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
	// Get current layer
	var layer = UpdateContext.Layer

	mouse.Init(layer);
	game.Init(layer);
	puzzle_state.Init(layer);

	board.Init(layer);
	energy.Init(layer);
	hotzones.Init(layer);
}

// --- Main update function
function Update(){
	InteractionStep();
	UpdateStep();
}

function InteractionStep() {
	if (mouse.IsPressed()) {
		if (energy.IsDuringTransport()) {
			// User is transporting energy
			if (!hotzones.IsMainZoneHit()) {
				// Energy got out of board hotzone, hide energy and reset position
				energy.Reset();
				// Restore starting board state
				board.Reset();
			}

			if (hotzones.IsHarderZoneHit()) {
				board.SetHarderState();
			} else {
				board.SetTransportState();
			}

			if (hotzones.IsEndingZoneHit()) {
				// User transported energy, make some cool effect
				energy.Reset();
				// Turn on light, turn on LED, change colors
				board.SetFinishedState();
				// Block mouse input, nothing will happen anymore here
				mouse.BlockInput();
			}
		} else if (hotzones.IsStartingZoneHit()) {
			// User hit starting zone - show energy
			energy.BeginTransport();
			// Turn off light
			board.SetTransportState();
		}
	} else {
		if (!board.IsSolved()) {
			if (energy.IsVisible()) {
				// User unclicked mouse, hide energy and reset position
				energy.Reset();
			}

			if (!board.IsDefaultState()) {
				// Restore starting board state
				board.Reset();
			}
		}
		else {
			puzzle_state.Set(1);
		}
	} 
}

function UpdateStep() {
	if (game.ResetRequested()) { // Reset script if reset is requested in end game
		puzzle_state.Reset();

		board.Reset();
		energy.Reset();
	}

	energy.Update();
}