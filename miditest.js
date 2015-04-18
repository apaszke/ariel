var colors = require('colors');
var sampleMidi = require('./MidiSampler');
var fs = require('fs');
var Midi = require('jsmidgen');
var dnn = require('dnn');

var NOTE_OFFSET = 45;

var files = [];
for(var i = 40; i <= 59; i++) {
  files.push('../chupacabra/samples/0'+i+'.mid');
}

files = ["Prelude17.mid"]

var data = [];
for(var i = 0; i < files.length; i++) {
  if(!fs.existsSync(files[i]))
    continue;
  var samples = sampleMidi(files[i], NOTE_OFFSET);
  for(var j = 0; (j + 1) * 16 < samples.length; j++) {
    var submatrix = extractColumns(samples, j * 16, 16);
    data.push(unfold(submatrix));
  }
  console.log("Parsed " + i + "th file");
}
console.log(data.length);



function extractColumns(arr, start, length) {
  var res = [];
  for(var i = start; i < start + length; i++) {
    res.push(arr[i]);
  }
  return res;
}

function unfold(m) {
  var res = [];
  for(var i = 0; i < m.length; i++) {
    res = res.concat(m[i]);
  }
  return res;
}

function reshape(v) {
  var res = [];
  for(var i = 0; i < v.length / 40; i++) {
    res.push(extractColumns(v, i * 40, 40));
  }
  return res;
}

function compare(m1, m2) {
  for(var i = 0; i < m1.length; i++) {
    for(var ii = 0; ii < m1[0].length; ii++) {
      if (m1[i][ii] != m2[i][ii])
        return false;
    }
  }
  return true;
}

function printMatrix(m) {
  var rows = m[0].length;
  var columns = m.length;
  console.log("rows: " + rows + ", columns: " + columns + ", elements: " + (rows * columns));

  for(var i = rows - 1; i >= 0; i--) {
    for(var ii = 0; ii < columns; ii++) {
      if(m[ii][i] === 1)
        process.stdout.write((m[ii][i]+"").red)
      else
      process.stdout.write(m[ii][i]+"")
    }
    process.stdout.write('\n');
  }
}



rbm1 = createRBN(640, 400, data);
data2 = rbm1.sampleHgivenV(data)[1];
rbm2 = createRBN(400, 200, data2);
data3 = rbm2.sampleHgivenV(data2)[1];
rbm3 = createRBN(200, 70, data3);
data4 = rbm3.sampleHgivenV(data3)[1];
rbm4 = createRBN(70, 10, data4);

console.log(rbm4.sampleHgivenV([data4[0]])[1]);


function getRandomActivation(n) {
  var rand = [];
  for(var i = 0; i < n; i++) {
    rand.push(Math.random());
  }
  return rand;
}

function createRBN(input, output, data) {
  var rbm1 = new dnn.RBM({
      input : data,
      n_visible : input,
      n_hidden : output
  });

  rbm1.set('log level', 2);

  var trainingEpochs = 100;

  rbm1.train({
      lr : 0.6,
      k : 8, // CD-k.
      epochs : trainingEpochs
  });

  return rbm1;
}

// printMatrix(reshape(rbm1.sampleVgivenH([[1,0]])[1][0]));
// printMatrix(reshape(rbm1.sampleVgivenH([[0,1]])[1][0]));


var generated = [];

for(var i = 0; i < 12; i++) {
  var hiddenTmp = rbm4.sampleVgivenH([getRandomActivation(10)])[1][0];
  hiddenTmp = rbm3.sampleVgivenH([hiddenTmp])[1][0];
  hiddenTmp = rbm2.sampleVgivenH([hiddenTmp])[1][0];
  var tmp = reshape(rbm1.sampleVgivenH([hiddenTmp])[1][0]);
  for(var j = 0; j < tmp.length; j++) {
    generated.push(tmp[j]);
  }
}

printMatrix(generated);

var events = generated;



var file = new Midi.File();
var track = new Midi.Track();
var offset = 0;
var offsetStep = 32;
var VELOCITY = 100;
file.addTrack(track);

var currentlyPlaying = {};
for (var col = 0; col < events.length - 1; col++){
  for(var i = 0; i < 40; i++) {
    if(events[col][i] === 1 && !currentlyPlaying[i]) {
      currentlyPlaying[i] = true;
      track.addNoteOn(0, i+NOTE_OFFSET, offset, VELOCITY);
      offset = 0;
    }
  }
  var firstOff = true;
  for(var i = 0; i < 40; i++) {
    if(events[col][i] === 0 && currentlyPlaying[i]) {
      currentlyPlaying[i] = false;
      track.addNoteOff(0, i+NOTE_OFFSET, firstOff ? offsetStep : 0, VELOCITY);
      firstOff = false;
    }
  }
  if (firstOff)
    offset += offsetStep;
}
var fistOff = true;
for(var i = 0; i < 40; i++) {
  if(events[events.length - 1][i] === 0 && currentlyPlaying[i]) {
    currentlyPlaying[i] = false;
    track.addNoteOff(0, i+NOTE_OFFSET, firstOff ? offsetStep : 0, VELOCITY);
    firstOff = false;
  }
}

fs.writeFileSync('test.mid', file.toBytes(), 'binary');

// var samples = sampleMidi('test.mid', NOTE_OFFSET);
// console.log(samples);
// printMatrix(samples);
