const midi = require('midi');

// Set up a new input.
const input = new midi.Input();
const inputSQ5 = new midi.Input();

// Set up a new output.
const output = new midi.Output();
const outputSQ5 = new midi.Output();


let foundMixerIndexInput = -1;
let foundSQ5IndexInput = -1;
let foundMixerIndexOutput = -1;
let foundSQ5IndexOutput = -1;

// Count the available input ports.
for (let ii = 0; ii < input.getPortCount(); ii ++) {
  if (input.getPortName(ii) === "Mischpult") {
    foundMixerIndexInput = ii;
  }
  // if (input.getPortName(ii).includes("MIDI Control 1")) {
  if (input.getPortName(ii).includes("CC Translator Inputs")) {
    foundSQ5IndexInput = ii;
  }
}
// Count the available input ports.
for (let ii = 0; ii < output.getPortCount(); ii ++) {
  if (output.getPortName(ii) === "Mischpult") {
    foundMixerIndexOutput = ii;
  }
  // if (output.getPortName(ii).includes("MIDI Control 1")) {
  if (output.getPortName(ii).includes("MIDI Thru")) {
    foundSQ5IndexOutput = ii;
  }
}


// Configure a callback.
input.on('message', (deltaTime, message) => {
  // The message is an array of numbers corresponding to the MIDI bytes:
  //   [status, data1, data2]
  // https://www.cs.cf.ac.uk/Dave/Multimedia/node158.html has some helpful
  // information interpreting the messages.
  console.log(`XTouch message: ${message} d: ${deltaTime}`);

  // simulate change of Xtouch compact
  if (message[0] === 176 && message[1] === 1) {
    outputSQ5.sendMessage([0xB1,0x01,message[2]]);
    // outputSQ5.sendMessage([0xB1,0x63,0x40]);
    // outputSQ5.sendMessage([0xB0,0x62,0]);
    // outputSQ5.sendMessage([0xB0,0x06,message[2]]);
    // outputSQ5.sendMessage([176,38,0]);
  }

});

// Configure a callback.
inputSQ5.on('message', (deltaTime, message) => {
  // The message is an array of numbers corresponding to the MIDI bytes:
  //   [status, data1, data2]
  // https://www.cs.cf.ac.uk/Dave/Multimedia/node158.html has some helpful
  // information interpreting the messages.
  console.log(`SQ5 m: ${message} d: ${deltaTime}`);
});

// Open the input port on Behringer Xtouch Compact.
input.openPort(foundMixerIndexInput);
inputSQ5.openPort(foundSQ5IndexInput);

output.openPort(foundMixerIndexOutput);
outputSQ5.openPort(foundSQ5IndexOutput);

// Sysex, timing, and active sensing messages are ignored
// by default. To enable these message types, pass false for
// the appropriate type in the function below.
// Order: (Sysex, Timing, Active Sensing)
// For example if you want to receive only MIDI Clock beats
// you should use
// input.ignoreTypes(true, false, true)
// input.ignoreTypes(false, false, false);

// ... receive MIDI messages ...

// Close the port when done.
setTimeout(function() {
  input.closePort();
  inputSQ5.closePort();
  output.closePort();
  outputSQ5.closePort();

}, 100000);
