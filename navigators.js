var game = {
	Init: function(layer) {
		this.reset_request_node = layer.FindNode("#reset_requested");
		if (!this.reset_request_node)
			Log("ERROR[navigators.js/game.Init]: #reset_requested node not found!");
	},

	ResetRequested: function() {
		return this.reset_request_node.GetEnvelopeValue('Value') == 1 ? true : false;
	}
};


var navigators = {
	hotzone: [],
	starting_nav: 5,
	current: 4,
	previous: 0,

	Init: function(layer) {
		var hotzone_node;

		var i = 0;
		while (true) {
			hotzone_node = layer.FindNode("#nav_hz_" + i);

			if (!hotzone_node) {
				Log("INFO[navigators.js/navigators.Init]: Navigators found: " + (i - 1))
				break
			}

			this.hotzone.push(hotzone_node)
			i++;
		}

		this.selected_node = layer.FindNode("#nav_selected");
		if (!this.selected_node)
				Log("ERROR[navigators.js/navigators.Init]: Cannot find selected navigator node!" )

		this.Reset();
	},

	Reset: function() {
		this.selected_node.SetEnvelopeValue('Value', this.starting_nav);
		this.current = 4;
		this.previous = 0;
	},

	Set: function(which_nav) {
		if (which_nav == this.current) {
			// Clicked the same navigator twice, go back
			this.current = this.previous;
			this.previous = which_nav;
		} else {
			this.previous = this.current;
			this.current = which_nav;
		}

		this.selected_node.SetEnvelopeValue('Value', this.current);
	},

	GetHit: function() {
		for (i = 0; i < this.hotzone.length; i++) {
			var is_hit = this.hotzone[i].GetEnvelopeValue("Current Hit Zone") == 1 ? true : false;

			if (is_hit) {
				return i;
			}
		}

		return -1;
	}
}


// Mouse
var mouse = {
	Init: function(layer) {
		this.cursor = layer.FindNode("#cursor");
		if (!this.cursor)
			Log("ERROR[navigators.js/mouse.Init]: Cursor node could not be found");

		this.clicked_node = layer.FindNode("#mouse_clicked");
		if (!this.clicked_node)
			Log("ERROR[navigators.js/mouse.Init]: #mouse_clicked node could not be found");

		this.pressed_node = layer.FindNode("#mouse_pressed");
		if (!this.pressed_node)
			Log("ERROR[navigators.js/mouse.Init]: #mouse_clicked node could not be found");
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
	navigators.Init(layer);
}


// --- Main update function
function Update(){
	InteractionStep();
	UpdateStep();
}


function InteractionStep() {
	if (mouse.IsClicked()) {
		hit = navigators.GetHit();
		if (hit != -1) {
			navigators.Set(hit);
		}
	}
}


function UpdateStep() {
	if (game.ResetRequested()) { // Reset script if reset is requested in end game
		navigators.Reset();
	}
}