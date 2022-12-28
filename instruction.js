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
		this.start_game = layer.FindNode("#start_game");

		if (!this.start_game)
			Log("ERROR[instruction.js/game.Init]: #start_game node not found!")

		this.reset_request_node = layer.FindNode("#reset_requested");
		if (!this.reset_request_node)
			Log("ERROR[instruction.js/game.Init]: #reset_requested node not found!");

		this.Stop();
	},

	ResetRequested: function() {
		return this.reset_request_node.GetEnvelopeValue('Value') == 1 ? true : false;
	},

	Stop: function() {
		this.SetPlay(0);
	},

	Start: function() {
		this.SetPlay(1);
	},

	SetPlay: function(value) {
		this.start_game.SetEnvelopeValue('Value', value);
	}
};


var button = {
	default_color: COLOR.RED,

	Init: function(layer) {
		this.hotzone = layer.FindNode("#instruction_button_hotzone");
		if (!this.hotzone)
			Log("ERROR[instruction.js/button.Init]: #instruction_button_hotzone node could not be found!");

		this.animation_response = layer.FindNode("#instruction_button_animation");
		if (!this.animation_response)
			Log("ERROR[instruction.js/button.Init]: #instruction_button_animation node could not be found!");

		this.color_r = layer.FindNode("#instruction_button_r");
		this.color_g = layer.FindNode("#instruction_button_g");
		this.color_b = layer.FindNode("#instruction_button_b");
		if (!this.color_r || !this.color_g || !this.color_b)
			Log("ERROR[instruction.js/button.Init]: Button color nodes could not be found!");

		this.Reset();
	},

	Reset: function() {
		this.SetDefaultColor();
	},

	IsClicked: function() {
		return this.hotzone.GetEnvelopeValue("Current Hit Zone") == 1 ? true : false;
	},

	Push: function() {
		var current_value = this.animation_response.GetEnvelopeValue('Value');

		this.animation_response.SetEnvelopeValue('Value', (current_value + 1) % 2);
	},

	SetColor: function(color) {
		this.color = color;

		if (this.color_r && this.color_g && this.color_b) {
			this.color_r.SetEnvelopeValue('Value', color[0]);
			this.color_g.SetEnvelopeValue('Value', color[1]);
			this.color_b.SetEnvelopeValue('Value', color[2]);
		}
	},

	SetDefaultColor: function() {
		this.SetColor(this.default_color);
	}
};


var mouse = {
	Init: function(layer) {
		this.cursor = layer.FindNode("#cursor");
		if (!this.cursor)
			Log("ERROR[instructions.js/mouse.Init]: Cursor node could not be found");

		this.clicked_node = layer.FindNode("#mouse_clicked");
		if (!this.clicked_node)
			Log("ERROR[instructions.js/mouse.Init]: #mouse_clicked node could not be found");

		this.pressed_node = layer.FindNode("#mouse_pressed");
		if (!this.pressed_node)
			Log("ERROR[instructions.js/mouse.Init]: #mouse_clicked node could not be found");
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

	game.Init(layer);

	mouse.Init(layer);
	button.Init(layer);
}


// --- Main update function
function Update(){
	InteractionStep();
	UpdateStep();
};


function InteractionStep() {
	if (mouse.IsClicked()) {
		if (button.IsClicked()) {
			button.Push();
			button.SetColor(COLOR.GREEN);
			game.Start();
		}
	}
};


function UpdateStep() {
	if (game.ResetRequested()) { // Reset script if reset is requested in end game
		game.Stop();

		button.Reset();
	}
}