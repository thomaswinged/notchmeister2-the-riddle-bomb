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
	GREY: [0.5, 0.5, 0.5]
};


var game = {
	Init: function(layer) {
		this.reset_request_node = layer.FindNode("#reset_requested");
		if (!this.reset_request_node)
			Log("ERROR[keypad.js/game.Init]: #reset_requested node not found!");
	},

	ResetRequested: function() {
		return this.reset_request_node.GetEnvelopeValue('Value') == 1 ? true : false;
	}
}


var puzzle_state = {
	Init: function(layer) {
		this.output = layer.FindNode("#keypad_output_state");
		if (!this.output)
			Log("ERROR[keypad.js/puzzle_state.Init]: #keypad_output_state node could not be found!");

		this.Reset();
	},

	Reset: function() {
		this.Set(-1);
	},

	Set: function(value) {
		this.output.SetEnvelopeValue("Value", value);
	}
}


var screen = {
	Init: function(layer) {
		this.code_text = layer.FindNode("#keypad_code_text");
		if (!this.code_text)
			Log("ERROR[keypad.js/screen.Init]: Screen code text node could not be found!");

		this.code_digits_count = layer.FindNode("#keypad_code_digits_count");
		if (!this.code_digits_count)
			Log("ERROR[keypad.js/screen.Init]: Screen code digits count node could not be found!");

		this.Reset();
	},

	Reset: function() {
		this.SetText("");
	},

	SetText: function(string) {
		this.code_text.SetString("Attributes.Text String", string);
		this.code_digits_count.SetEnvelopeValue("Value", string.length);
	}
}


var led = {
	default_color: COLOR.BLUE,
	color: COLOR.BLUE,
	is_on: true,

	Init: function(layer) {
		this.color_r = layer.FindNode("#keypad_led_r");
		this.color_g = layer.FindNode("#keypad_led_g");
		this.color_b = layer.FindNode("#keypad_led_b");

		if (!this.color_r || !this.color_g || !this.color_b)
			Log("ERROR[keypad.js/led.Init]: LED color nodes could not be found!");

		this.Reset();
	},

	Reset: function() {
		this.SetColor(this.default_color);
		this.Toggle(1);
	},

	SetColor: function(color) {
		this.color = color;
	},

	Blink: function(duration_seconds) {
		if (!this.IsOn()) {
			this.Toggle(1);

			Timer(duration_seconds, function() { led.Toggle(0) }, name="", false);
		} else {
			this.Toggle(0);

			Timer(duration_seconds, function() { led.Toggle(1) }, name="", false);
		}
	},

	IsOn: function() {
		return this.is_on;
	},

	Toggle: function(on) {
		this.is_on = on;

		this.color_r.SetEnvelopeValue('Value', this.color[0] * (on == true ? 1 : 0));
		this.color_g.SetEnvelopeValue('Value', this.color[1] * (on == true ? 1 : 0));
		this.color_b.SetEnvelopeValue('Value', this.color[2] * (on == true ? 1 : 0));
	},

	Inform: function(correct) {
		this.SetColor(correct == true ? COLOR.GREEN : COLOR.RED);

		this.Blink(0.3); // Blink once now
		Timer(0.7, function() { led.Blink(0.3) }, name="", false); // Blink once again after 0.4 second
		if (!correct) {
			Timer(1.4, function() { led.Blink(0.3) }, name="", false); // Blink once again after 0.4 second
			Timer(2.1, function() { led.Reset() }, name="", false); // Reset color after 0.4 second
		}
	}
}


var buttons = {
	blocked: false,

	Init: function(layer) {
		this.animation = [];
		this.hotzone = [];
		var animation_node;
		var hotzone_node;

		for (var i = 0; i < 12; i++) {
			if (i < 10) {
				animation_node = layer.FindNode("#keypad_button_animation_" + i)
				if (!animation_node)
					Log("ERROR[keypad.js/buttons.Init]: Keyboard button " + i + " animation node could not be found!");
				else
					this.animation.push(animation_node);

				hotzone_node = layer.FindNode("#keypad_button_hotzone_" + i)
				if (!hotzone_node)
					Log("ERROR[keypad.js/buttons.Init]: Keyboard button " + i + " hotzone node could not be found!");
				else
					this.hotzone.push(hotzone_node);
			} else if (i == 10) {
				// CLEAR button
				animation_node = layer.FindNode("#keypad_button_animation_x")
				if (!animation_node)
					Log("ERROR[keypad.js/buttons.Init]: Keyboard CLEAR button animation node could not be found!");
				else
					this.animation.push(animation_node);

				hotzone_node = layer.FindNode("#keypad_button_hotzone_x")

				if (!hotzone_node)
					Log("ERROR[keypad.js/buttons.Init]: Keyboard CLEAR button hotzone node could not be found!");
				else
					this.hotzone.push(hotzone_node);
			} else if (i == 11) {
				// OK button
				animation_node = layer.FindNode("#keypad_button_animation_ok")

				if (!animation_node)
					Log("ERROR[keypad.js/buttons.Init]: Keyboard OK button animation node could not be found!");
				else
					this.animation.push(animation_node);

				hotzone_node = layer.FindNode("#keypad_button_hotzone_ok")

				if (!hotzone_node)
					Log("ERROR[keypad.js/buttons.Init]: Keyboard OK button hotzone node could not be found!");
				else
					this.hotzone.push(hotzone_node);
			}
		}
	},

	BlockInput: function() {
		this.blocked = true;
	},

	GetHit: function() {
		if (this.blocked) return -1;

		for (i = 0; i < this.hotzone.length; i++) {
			var is_hit = this.hotzone[i].GetEnvelopeValue("Current Hit Zone") == 1 ? true : false;

			if (is_hit) {
				return i;
			}
		}

		return -1;
	},

	Press: function(which_button) {
		current_value = this.animation[which_button].GetEnvelopeValue('Value');
		this.animation[which_button].SetEnvelopeValue('Value', (current_value + 1) % 2);
	},

	IsDigitHit: function(which_button) {
		return which_button < 10;
	},

	IsClearHit: function(which_button) {
		return which_button == 10;
	},

	IsConfirmHit: function(which_button) {
		return which_button == 11;
	},
}


var code = {
	entered: "",
	correct_code: "7365",

	Init: function(layer) {
		this.Reset();
	},

	Reset: function() {
		this.entered = "";
	},
	
	AddDigit: function(digit) {
		if (this.entered.length >= this.correct_code.length)
			return;

		this.entered += digit;
	},

	Get: function() {
		return this.entered;
	},

	IsCorrect: function() {
		return this.entered == this.correct_code;
	}
}


var mouse = {
	Init: function(layer) {
		this.cursor = layer.FindNode("#cursor");
		if (!this.cursor)
			Log("ERROR[keypad.js/mouse.Init]: Cursor node could not be found");

		this.clicked_node = layer.FindNode("#mouse_clicked");
		if (!this.clicked_node)
			Log("ERROR[keypad.js/mouse.Init]: #mouse_clicked node could not be found");

		this.pressed_node = layer.FindNode("#mouse_pressed");
		if (!this.pressed_node)
			Log("ERROR[keypad.js/mouse.Init]: #mouse_clicked node could not be found");
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

	code.Init(layer);
	screen.Init(layer);
	led.Init(layer);
	buttons.Init(layer);
}


// --- Main update function
function Update(){
	InteractionStep();
	UpdateStep();
}


function InteractionStep() {
	if (mouse.IsClicked()) {
		hit = buttons.GetHit();
		if (hit != -1) {
			buttons.Press(hit);

			if (buttons.IsDigitHit(hit)) {
				code.AddDigit(hit)
			} else if (buttons.IsClearHit(hit)) {
				code.Reset();
			} else if (buttons.IsConfirmHit(hit)) {
				if (code.IsCorrect()) {
					buttons.BlockInput();
					screen.SetText("---OK---");
					led.Inform(true);
					puzzle_state.Set(1);

					return
				} else {
					led.Inform(false);
					code.Reset();
				}
			}

			screen.SetText(code.Get());
		}
	}
}


function UpdateStep() {
	if (game.ResetRequested()) { // Reset script if reset is requested in end game
		puzzle_state.Reset();

		code.Reset();
		screen.Reset();
		led.Reset();
	}
}