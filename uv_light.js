var game = {
	Init: function(layer) {
		this.reset_request_node = layer.FindNode("#reset_requested");
		if (!this.reset_request_node)
			Log("ERROR[uv_light.js/board.Init]: #reset_requested node not found!");
	},

	ResetRequested: function() {
		return this.reset_request_node.GetEnvelopeValue('Value') == 1 ? true : false;
	}
}


// Board management
var light = {
	listeners: [],
	is_on: false,

	Init: function(layer) {
		var i = 0;
		while (true) {
			listener_node = layer.FindNode("#uv_mode_listener_" + i);

			if (!listener_node) {
				Log("INFO[uv_light.js/light.Init]: UV mode listeners found: " + (i - 1))
				break
			}

			this.listeners.push(listener_node)

			i++;
		}

		this.Reset();
	},

	Reset: function() {
		this.Set(false);
 	},

	Set: function(toggled) {
		this.is_on = toggled;
		this.Broadcast(toggled == true ? 1 : 0)
	},

	Broadcast: function(toggled) {
		for (var i = 0; i < this.listeners.length; i++) {
			this.listeners[i].SetEnvelopeValue('Value', toggled);
		}
	},

	Toggle: function() {
		if (!prop.IsTaken()) return;

		if (!this.is_on) {
			this.Set(true);
		} else {
			this.Set(false);
		}
	}
}


// UV handlight prop
var prop = {
	taken: false,

	Init: function(layer) {
		this.take_node = layer.FindNode("#uv_prop_taken")
		if (!this.take_node)
			Log("ERROR[uv_light.js/prop.Init]: #uv_prop_taken node cannot be found!");

		this.hotzone = layer.FindNode("#uv_prop_hotzone")
		if (!this.hotzone)
			Log("ERROR[uv_light.js/prop.Init]: #uv_prop_hotzone node cannot be found!");

		this.Reset();
	},

	Reset: function() {
		this.taken = false;
		this.take_node.SetEnvelopeValue('Value', 0);
	},

	IsHit: function() {
		var is_hit = this.hotzone.GetEnvelopeValue("Current Hit Zone") == 1 ? true : false;

		if (is_hit)
			return true;

		return false;
	},

	Take: function(which_button) {
		this.taken = true;
		this.take_node.SetEnvelopeValue('Value', 1);
	},

	IsTaken: function() {
		return this.taken;
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
	
	light.Init(layer);
	prop.Init(layer);
}


// --- Main update function
function Update(){
	InteractionStep();
	UpdateStep();
}


function InteractionStep() {
	if (mouse.IsClicked()) {
		if (prop.IsHit()) {
			prop.Take();
		}
	}
}


function UpdateStep() {
	if (game.ResetRequested()) { // Reset script if reset is requested in end game
		light.Reset();
		prop.Reset();
	}
}


function OnKeyPress(key)
{
	if (key == 'U' || key == 'u') {
		light.Toggle()
	}
}