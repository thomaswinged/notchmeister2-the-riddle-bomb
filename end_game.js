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
		this.bomb_state_node = layer.FindNode("#bomb_output_state");
		if (!this.bomb_state_node)
			Log("ERROR[end_game.js/game.Link]: #bomb_output_state node not found!");

		this.reset_node = layer.FindNode("#end_game_reset");
		if (!this.reset_node)
			Log("ERROR[end_game.js/game.Link]: #end_game_reset node not found!");

		this.reset_request_node = layer.FindNode("#reset_requested");
		if (!this.reset_request_node)
			Log("ERROR[end_game.js/game.Link]: #reset_requested node not found!");
	},

	ResetRequested: function() {
		return this.reset_request_node.GetEnvelopeValue('Value') == 1 ? true : false;
	},

	RequestReset: function() {
		// Send one second of reset signal
		this.reset_node.SetEnvelopeValue('Value', 1);
		Timer(1, function() { game.reset_node.SetEnvelopeValue('Value', 0) }, name="", false);
	},

	HasBombExploded: function() {
		return this.bomb_state_node.GetEnvelopeValue('Value') == 0;
	},

	IsCableCut: function() {
		return this.bomb_state_node.GetEnvelopeValue('Value') > -1;
	}
};


var camera = {
	Init: function(layer) {
		this.position = layer.FindNode("#nav_selected");
		if (!this.position)
			Log("ERROR[end_game.js/camera.Link]: #nav_selected node not found!");
	},

	MoveTo: function(nav) {
		this.position.SetEnvelopeValue("Value", nav);
	}
}


var menu = {
	is_shown: false,

	Init: function(layer) {
		this.hide_box_node = layer.FindNode("#end_game_hide_box");
		if (!this.hide_box_node)
			Log("ERROR[end_game.js/menu.Link]: #end_game_hide_box node not found!");

		this.success_node = layer.FindNode("#end_game_success");
		if (!this.success_node)
			Log("ERROR[end_game.js/menu.Link]: #end_game_success node not found!");

		this.failure_node = layer.FindNode("#end_game_failure");
		if (!this.failure_node)
			Log("ERROR[end_game.js/menu.Link]: #end_game_failure node not found!");

		this.Reset();
	},

	Reset: function() {
		this.success_node.SetEnvelopeValue('Value', 0);
		this.failure_node.SetEnvelopeValue('Value', 0);
		this.hide_box_node.SetEnvelopeValue('Value', 0);
		this.is_shown = false;
	},

	ShowSucces: function() {
		this.success_node.SetEnvelopeValue('Value', 1);
		this.hide_box_node.SetEnvelopeValue('Value', 1);
		this.is_shown = true;
	},

	ShowFailure: function() {
		this.failure_node.SetEnvelopeValue('Value', 1);
		this.hide_box_node.SetEnvelopeValue('Value', 1);
		this.is_shown = true;
	},

	IsShown: function() {
		return this.is_shown;
	}
}


var button = {
	default_color: COLOR.BLUE,

	Init: function(layer) {
		this.hotzone = layer.FindNode("#end_game_reset_button_hotzone");
		if (!this.hotzone)
			Log("ERROR[end_game.js/button.Link]: #end_game_reset_button_hotzone node could not be found!");

		this.animation_response = layer.FindNode("#end_game_reset_button_animation");
		if (!this.animation_response)
			Log("ERROR[end_game.js/button.Link]: #end_game_reset_button_animation node could not be found!");

		this.color_r = layer.FindNode("#end_game_reset_button_r");
		this.color_g = layer.FindNode("#end_game_reset_button_g");
		this.color_b = layer.FindNode("#end_game_reset_button_b");
		if (!this.color_r || !this.color_g || !this.color_b)
			Log("ERROR[end_game.js/button.Link]: Reset button color nodes could not be found!");

		this.Reset();
	},

	Reset: function() {
		this.SetDefaultColor();
	},

	IsHit: function() {
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
			Log("ERROR[end_game.js/mouse.Init]: Cursor node could not be found");

		this.clicked_node = layer.FindNode("#mouse_clicked");
		if (!this.clicked_node)
			Log("ERROR[end_game.js/mouse.Init]: #mouse_clicked node could not be found");

		this.pressed_node = layer.FindNode("#mouse_pressed");
		if (!this.pressed_node)
			Log("ERROR[end_game.js/mouse.Init]: #mouse_clicked node could not be found");
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

	menu.Init(layer);
	camera.Init(layer);
	button.Init(layer);
}


// --- Main update function
function Update(){
	InteractionStep();
	UpdateStep();
};


function InteractionStep() {
	if (mouse.IsClicked()) {
		if (button.IsHit()) {
			button.Push();
			button.SetColor(COLOR.GREEN);

			game.RequestReset();
		}
	}
};


function UpdateStep() {
	if (game.ResetRequested()) { // Reset script if reset is requested in end game
		button.Reset();
		menu.Reset();
	}

	if (game.IsCableCut() & !menu.IsShown()) {
		Timer(2, function() { camera.MoveTo(12); }, name="", false);

		if (game.HasBombExploded()) {
			// Fail
			menu.ShowFailure();
		} else {
			// Success
			menu.ShowSucces();
		}
	}
}