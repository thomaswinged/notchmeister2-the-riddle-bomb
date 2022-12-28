var game = {
	Init: function(layer) {	
		this.reset_request_node = layer.FindNode("#reset_requested");
		if (!this.reset_request_node)
			Log("ERROR[bottom.js/game.Init]: #reset_requested node not found!");
	},

	ResetRequested: function() {
		return this.reset_request_node.GetEnvelopeValue('Value') == 1 ? true : false;
	}
};


var puzzle_state = {
	Init: function(layer) {
		this.output = layer.FindNode("#bottom_output_state");
		if (!this.output)
			Log("ERROR[bottom.js/puzzle_state.Init]: #bottom_output_state node could not be found");

		this.Reset();
	},
	
	Reset: function() {
		this.Set(0);
	},

	Set: function(value) {
		this.output.SetEnvelopeValue('Value', value);
	}
}


var lid = {
	Init: function(layer) {
		this.buttom_doors_open = layer.FindNode("#buttom_doors_open");
		if (!this.buttom_doors_open)
			Log("ERROR[bottom.js/lid.Init]: #buttom_doors_open node could not be found");

		this.Reset();
	},

	Set: function(value) {
		this.buttom_doors_open.SetEnvelopeValue('Value', value);
	},

	Reset: function() {
		this.Set(0);
	},

	Open: function() {
		this.Set(1);
	}
}


var buttons = {
	blocked: false,

	Init: function(layer) {
		this.inner_button_hotzone = layer.FindNode("#bottom_button_inner_hotzone");
		if (!this.inner_button_hotzone)
			Log("ERROR[bottom.js/buttons.Init]: #bottom_button_inner_hotzone node could not be found");

		this.inner_button_animation = layer.FindNode("#bottom_button_inner_animation");
		if (!this.inner_button_animation)
			Log("ERROR[bottom.js/buttons.Init]: #bottom_button_inner_animation node could not be found");

		this.fingerprint_hotzone = layer.FindNode("#bottom_fingerprint_hotzone");
		if (!this.fingerprint_hotzone)
			Log("ERROR[bottom.js/buttons.Init]: #bottom_fingerprint_hotzone node could not be found");

		this.fingerpring_enabled = layer.FindNode("#bottom_fingerprint_enabled");
		if (!this.fingerpring_enabled)
			Log("ERROR[bottom.js/buttons.Init]: #bottom_fingerprint_enabled node could not be found");

		this.Reset();
	},

	Reset: function() {
		this.inner_button_animation.SetEnvelopeValue("Value", 0);
		this.blocked = false;
	},

	IsFingerprintEnabled: function() {
		return this.fingerpring_enabled.GetEnvelopeValue('Value') == 1 ? true : false;
	},

	IsFingerprintHit: function() {
		if (!this.IsFingerprintEnabled() || this.blocked) return false;

		return this.fingerprint_hotzone.GetEnvelopeValue("Current Hit Zone") == 1 ? true : false;
	},

	IsInnerButtonHit: function() {
		if (this.blocked) return false;

		return this.inner_button_hotzone.GetEnvelopeValue("Current Hit Zone") == 1 ? true : false;
	},

	PressInnerButton: function() {
		this.inner_button_animation.SetEnvelopeValue("Value", 1);
	},

	BlockInput: function() {
		this.blocked = true;
	}
}


// Mouse
var mouse = {
	Init: function(layer) {
		this.cursor = layer.FindNode("#cursor");
		if (!this.cursor)
			Log("ERROR[bottom.js/mouse.Init]: #cursor node could not be found");

		this.clicked_node = layer.FindNode("#mouse_clicked");
		if (!this.clicked_node)
			Log("ERROR[bottom.js/mouse.Init]: #mouse_clicked node could not be found");

		this.pressed_node = layer.FindNode("#mouse_pressed");
		if (!this.pressed_node)
			Log("ERROR[bottom.js/mouse.Init]: #mouse_clicked node could not be found");
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

	lid.Init(layer);
	buttons.Init(layer);
}


// --- Main update function
function Update(){
	InteractionStep();
	UpdateStep();
}


function InteractionStep() {
	if (mouse.IsClicked()) {
		if (buttons.IsFingerprintHit()) {
			lid.Open();
		} else if (buttons.IsInnerButtonHit()) {
			buttons.PressInnerButton();
			puzzle_state.Set(1);
			buttons.BlockInput();
		}
	}
}


function UpdateStep() {
	if (game.ResetRequested()) { // Reset script if reset is requested in end game
		puzzle_state.Reset();

		buttons.Reset();
	}
}