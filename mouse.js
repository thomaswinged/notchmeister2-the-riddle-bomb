// Node JS input
var _response_delay_frames, // Sending click too fast can be buggy, delay it
    _minimum_delay_ms, // Milliseconds between clicks
    _clicked; // Feedback from Mouse Picker

// Mouse
var mouse = {
	last_click: 0,
	response_frames_delay: 0,

	Init: function() {
		this.cursor = layer.FindNode("#cursor");

		if (!this.cursor)
			Log("ERROR[mouse.js/mouse.Init]: #cursor node could not be found");

        this.pressed_node = layer.FindNode("#mouse_pressed");

        if (!this.pressed_node)
            Log("ERROR[mouse.js/mouse.Init]: #mouse_pressed node could not be found");

        this.clicked_node = layer.FindNode("#mouse_clicked");

        if (!this.clicked_node)
            Log("ERROR[mouse.js/mouse.Init]: #mouse_clicked node could not be found");
	},

	IsClicked: function() {
		if (this.IsPressed()) {
			if ((this.last_click + _minimum_delay_ms) < Date.now()) {
				this.last_click = Date.now();
				
				// Let Notch wait 20 frames before sending the click, as too fast clicking is buggy
				this.response_frames_delay = _response_delay_frames;
			}
		} else if (this.response_frames_delay) {
			if (this.response_frames_delay > 1) {
				this.response_frames_delay = this.response_frames_delay - 1;
			} else {
				// X frames passed, send click
				this.response_frames_delay = 0;
				return true
			}
		}

		return false;
	},

	IsPressed: function() {
		return _clicked == 1 ? true : false;
	},

    Update: function() {
        this.clicked_node.SetEnvelopeValue('Value', this.IsClicked() == true ? 1 : 0);
        this.pressed_node.SetEnvelopeValue('Value', this.IsPressed() == true ? 1 : 0);
    }
};

///////////////////////////////////////////////////////////////////////////////
// --- MAIN BODY --------------------------------------------------------------
/**/

// --- Main update function
function Update(){
	InitStep();
	UpdateStep();
}

// Init nodes
var initialized = false;
function InitStep() {
	if (!initialized) {
		initialized = true;

		// Get current layer
		layer = UpdateContext.Layer

		mouse.Init();
	}
}

function UpdateStep() {
	mouse.Update();
}