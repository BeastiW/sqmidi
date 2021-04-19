const midi = require('midi');

const config  =  require('../config/faders.json');

config.forEach(oFader => {
  oFader.msb  =  parseInt(oFader.msb,16);
  oFader.lsb  =  parseInt(oFader.lsb,16);
})

// Set up a new input.
const input = new midi.Input();
const inputSQ5 = new midi.Input();

// Set up a new output.
const output = new midi.Output();
const outputSQ5 = new midi.Output();
// const outputSQ5out = new midi.Output();


let foundMixerIndexInput = -1;
let foundSQ5IndexInput = -1;
let foundMixerIndexOutput = -1;
let foundSQ5IndexOutput = -1;
// let foundSQ5outIndexOutput = -1;

// Count the available input ports.
for (let ii = 0; ii < input.getPortCount(); ii ++) {
  if (input.getPortName(ii).includes("X-TOUCH")) {
    foundMixerIndexInput = ii;
  }
  if (input.getPortName(ii).includes("MIDI Thru")) {
    foundSQ5IndexInput = ii;
  }
}
// Count the available input ports.
for (let ii = 0; ii < output.getPortCount(); ii ++) {
  if (output.getPortName(ii).includes("X-TOUCH")) {
    foundMixerIndexOutput = ii;
  }
  // if (output.getPortName(ii).includes("CC Translator Inputs")) {
  if (output.getPortName(ii).includes("MIDI Thru")) {
    foundSQ5IndexOutput = ii;
  }
  // if (input.getPortName(ii).includes("CC Translator Outputs")) {
  //   foundSQ5outIndexOutput = ii;
  // }
}


// Configure a callback.
input.on('message', (deltaTime, message) => {
  // The message is an array of numbers corresponding to the MIDI bytes:
  //   [status, data1, data2]
  // https://www.cs.cf.ac.uk/Dave/Multimedia/node158.html has some helpful
  // information interpreting the messages.
  console.log(`XTouch message: ${message} d: ${deltaTime}`);

  // simulate change of Xtouch compact
  if (message[0] === 176) {
    const oFaderConf = config.find(oEntry => oEntry.xtouch_fader ===  message[1]);
    if (!oFaderConf) {
      return;
    }
    const iValue =  (Math.log2( message[2] + 1 ) / 7) * 127;
    console.log(`Sending value ${iValue} to channel ${message[1]}`);

    if (!oFaderConf.output) {
      outputSQ5.sendMessage([0xB0,0x63,oFaderConf.msb]);
      outputSQ5.sendMessage([0xB0,0x62,oFaderConf.lsb]);
      outputSQ5.sendMessage([0xB0,0x06,iValue]);
      outputSQ5.sendMessage([0xB0,38,0]);
    }
    else {
      outputSQ5.sendMessage([0xB0,0x63,oFaderConf.msb]);
      outputSQ5.sendMessage([0xB0,0x62,oFaderConf.lsb]);
      outputSQ5.sendMessage([0xB0,0x06,iValue]);
      outputSQ5.sendMessage([0xB0,38,0]);
    }
  }

});

// Configure a callback.
let currentMSB = -1;
let currentLSB = -1;
let currentValue = 0;
inputSQ5.on('message', (deltaTime, message) => {
  // The message is an array of numbers corresponding to the MIDI bytes:
  //   [status, data1, data2]
  // https://www.cs.cf.ac.uk/Dave/Multimedia/node158.html has some helpful
  // information interpreting the messages.
  // console.log(`SQ5 m: ${message} d: ${deltaTime}`);

  if  (message[1] === 99) {
    currentMSB  = message[2];
  }
  if  (message[1] === 98) {
    currentLSB  = message[2];
  }
  if  (message[1] === 6) {
    currentValue  = message[2]; //  value always  comes  after MSB and LSB

    if (currentMSB !== -1 && currentLSB  !== -1) {
      const oFaderConf = config.find(oEntry => oEntry.msb === currentMSB && oEntry.lsb === currentLSB);
      if (!oFaderConf) {
        currentMSB = -1; currentLSB =  -1;
        return;
      }

      currentValue = message[2] * 2 / 16129;
      const msgOut =  [0xB0, oFaderConf.xtouch_fader, currentValue ];
      console.log(`sending fader ${oFaderConf.xtouch_fader} values ${msgOut}`);
      output.sendMessage(msgOut);
      currentMSB = -1; currentLSB =  -1;
    }

  }
});

// Open the input port on Behringer Xtouch Compact.
input.openPort(foundMixerIndexInput);
inputSQ5.openPort(foundSQ5IndexInput);

output.openPort(foundMixerIndexOutput);
outputSQ5.openPort(foundSQ5IndexOutput);
// outputSQ5out.openPort(foundSQ5outIndexOutput);

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
if (process.platform === "win32") {
  var rl = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.on("SIGINT", function () {
    process.emit("SIGINT");
  });
}

process.on("SIGINT", function () {
  
  input.closePort();
  inputSQ5.closePort();
  output.closePort();
  outputSQ5.closePort();
  // outputSQ5out.closePort();
  //graceful shutdown
  process.exit();
});