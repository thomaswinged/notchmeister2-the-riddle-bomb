// JS node input variables:
var _time;


const COLOR = {
	BLACK: [0, 0, 0],
	RED: [1, 0, 0],
	GREEN: [0, 1, 0],
	BLUE: [0, 0, 1],
	YELLOW: [1, 1, 0],
	CYAN: [0, 1, 1],
	MAGENTA: [1, 0, 1],
	MAROON: [0.5, 0, 0],
	BROWN: [0.65, 0.16, 0.16],
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
			Log("ERROR[bomb.js/game.Init]: #start_game node could not be found!");

		this.reset_request_node = layer.FindNode("#reset_requested");
		if (!this.reset_request_node)
			Log("ERROR[bomb.js/game.Init]: #reset_requested node not found!");
	},

	ResetRequested: function() {
		return this.reset_request_node.GetEnvelopeValue('Value') == 1 ? true : false;
	},

	HasStarted: function() {
		return this.start_game.GetEnvelopeValue('Value') == 1 ? true : false;
	}
}


var puzzle_state = {
	Init: function(layer) {
		this.output = layer.FindNode("#bomb_output_state");
		if (!this.output)
			Log("ERROR[bomb.js/puzzle_state.Init]: #bomb_output_state node could not be found!");

		this.output_outer = layer.FindNode("#bomb_output_state_outer");
		if (!this.output_outer)
			Log("ERROR[bomb.js/puzzle_state.Init]: #bomb_output_state_outer node could not be found!");

		this.Reset();
	},
	
	Reset: function() {
		this.Set(-1);
	},

	Set: function(value) {
		this.output.SetEnvelopeValue("Value", value);
		this.output_outer.SetEnvelopeValue("Value", value);
	}
}


var cables = {
	correct_cable: 2,
	cut_cable: -1,
	cable: [],
	hotzone: [],

	Init: function(layer) {
		for (var i = 0; i < 3; i++) {
			cable_node = layer.FindNode("#bomb_cable_cut_" + i)
			if (!cable_node) {
				Log("ERROR[bomb.js/cables.Init]: #bomb_cable_cut_" +  i + " has not been found!");
				break;
			}

			this.cable.push(cable_node);

			hotzone_node = layer.FindNode("#bomb_cable_hotzone_" + i);
			if (!hotzone_node) {
				Log("ERROR[bomb.js/cables.Init]: #bomb_cable_hotzone_" +  i + " has not been found!");
				break;
			}
			
			this.hotzone.push(hotzone_node);
		}

		this.Reset();
	},

	Reset: function() {
		for (var i = 0; i < this.cable.length; i++) {
			this.cable[i].SetEnvelopeValue('Value', 0);
		}
		this.cut_cable = -1;
	},

	IsCorrect: function() {
		return this.cut_cable == this.correct_cable;
	},

	Cut: function(which_cable) {
		this.cable[which_cable].SetEnvelopeValue('Value', 1);
		this.cut_cable = which_cable;
	},

	IsCut: function() {
		return this.cut_cable >= 0;
	},

	GetHit: function() {
		for (var i = 0; i < this.hotzone.length; i++) {
			var is_hit = this.hotzone[i].GetEnvelopeValue("Current Hit Zone") == 1 ? true : false;

			if (is_hit) return i;
		}

		return -1;
	}
}


var time = {
	start_time: Date.now(),
	current_time: 0,
	time_to_diffuse: 999, // Seconds

	Init: function(layer) {
		this.seconds_left = layer.FindNode("#bomb_seconds_left");
		if (!this.seconds_left)
			Log("ERROR[bomb.js/time.Init]: #bomb_seconds_left node could not be found!");

		this.time_to_diffuse = parseInt(_time);
		this.Reset();
	},

	Reset: function() {
		this.start_time = Date.now();
		this.current_time = 0;
		this.time_to_diffuse = parseInt(_time);
	},

	Update: function() {
		if (this.GetLeft() > 0) {
			this.Set((Date.now() - this.start_time) / 1000);
		}
	},

	Set: function(seconds) {
		this.current_time = seconds;
		this.seconds_left.SetEnvelopeValue("Value", this.GetLeft());
	},

	GetLeft: function() {
		return this.time_to_diffuse - this.current_time;
	},

	ForceEnd: function() {
		this.current_time = 0;
		this.seconds_left.SetEnvelopeValue("Value", 0);
	}
}


var screen = {
	Init: function(layer) {
		this.text = layer.FindNode("#bomb_screen_text");

		if (!this.text)
			Log("ERROR[bomb.js/screen.Init]: #bomb_screen_text node could not be found!");

		this.text_outer = layer.FindNode("#bomb_screen_text_outer");

		if (!this.text_outer)
			Log("ERROR[bomb.js/screen.Init]: #bomb_screen_text_outer node could not be found!");

		this.Reset();
	},

	Reset: function() {
		this.SetText("--:--");
	},

	SetTime: function(seconds_left) {
		var time_left = Math.floor(seconds_left),
			minutes = Math.floor(time_left / 60),
			seconds = time_left % 60;

		minutes = PadNumber(minutes, 2);
		seconds = PadNumber(seconds, 2);

		this.SetText(minutes + ":" + seconds);
	},

	SetText: function(string) {
		this.text.SetString("Attributes.Text String", string);
		this.text_outer.SetString("Attributes.Text String", string);
	}
}


function PadNumber(number, digits) {
	return Array(Math.max(digits - String(number).length + 1, 0)).join(0) + number;
}


var led = {
	default_color: COLOR.RED,

	Init: function(layer) {
		this.color_r = layer.FindNode("#bomb_led_r");
		this.color_g = layer.FindNode("#bomb_led_g");
		this.color_b = layer.FindNode("#bomb_led_b");

		if (!this.color_r || !this.color_g || !this.color_b)
			Log("ERROR[bomb.js/led.Init]: Color nodes not be found!");

		this.color_outer_r = layer.FindNode("#bomb_led_outer_r");
		this.color_outer_g = layer.FindNode("#bomb_led_outer_g");
		this.color_outer_b = layer.FindNode("#bomb_led_outer_b");

		if (!this.color_outer_r || !this.color_outer_g || !this.color_outer_b)
			Log("ERROR[bomb.js/led.Init]: Outer color nodes not be found!");

		this.Reset();
	},

	Reset: function() {
		this.SetDefaultColor();
	},

	SetColor: function(color) {
		this.color = color;

		if (this.color_r && this.color_g && this.color_b) {
			this.color_r.SetEnvelopeValue('Value', color[0]);
			this.color_g.SetEnvelopeValue('Value', color[1]);
			this.color_b.SetEnvelopeValue('Value', color[2]);

			this.color_outer_r.SetEnvelopeValue('Value', color[0]);
			this.color_outer_g.SetEnvelopeValue('Value', color[1]);
			this.color_outer_b.SetEnvelopeValue('Value', color[2]);
		}
	},

	SetDefaultColor: function() {
		this.SetColor(this.default_color);
	}
}


// Mouse
var mouse = {
	Init: function(layer) {
		this.cursor = layer.FindNode("#cursor");
		if (!this.cursor)
			Log("ERROR[bomb.js/mouse.Init]: #cursor node could not be found");

		this.clicked_node = layer.FindNode("#mouse_clicked");
		if (!this.clicked_node)
			Log("ERROR[bomb.js/mouse.Init]: #mouse_clicked node could not be found");

		this.pressed_node = layer.FindNode("#mouse_pressed");
		if (!this.pressed_node)
			Log("ERROR[bomb.js/mouse.Init]: #mouse_clicked node could not be found");
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

	time.Init(layer);
	cables.Init(layer);
	led.Init(layer);
	screen.Init(layer);
}


// --- Main update function
function Update(){
	InteractionStep();
	UpdateStep();
}


function InteractionStep() {
	if (mouse.IsClicked()) {
		hit = cables.GetHit();
		if (hit != -1) {
			cables.Cut(hit);
		}
	}
}


var stop_updates = false;
var start_initialized = false;
function UpdateStep() {
	if (game.ResetRequested()) { // Reset script if reset is requested in end game
		puzzle_state.Reset();

		cables.Reset();
		led.Reset();
		screen.Reset();
		time.Reset();

		stop_updates = false;
		start_initialized = false;
	}

	if (!game.HasStarted() || stop_updates) return;

	if (game.HasStarted() & !start_initialized) {
		start_initialized = true;
		time.Reset();
	}

	if (cables.IsCut()) {
		stop_updates = true;
		time.ForceEnd();

		if (cables.IsCorrect()) {
			// Good ending
			led.SetColor(COLOR.GREEN);
			screen.SetText("(^ V ^)");
			puzzle_state.Set(1);
		} else {
			// Bad ending
			screen.SetText("(+_+)");
			puzzle_state.Set(0);
		}

		return;
	}

	time_left = time.GetLeft();
	if (time_left > 0) {
		// Keep counting
		time.Update();
		screen.SetTime(time_left);
	} else {
		// Bad ending
		screen.SetText("(+_+)");
		puzzle_state.Set(0);
	}
}