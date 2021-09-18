var model;

class SortedNGrams {
  constructor(unigrams, count) {
    this.unigrams = unigrams;
    this.unigramList = Array.from(Object.values(unigrams));
    this.count = count;
  }
}

SortedNGrams.prototype.addBigram = function(bigram) {
  this.unigrams[bigram.tokens[0]].addBigram(bigram);
}

class Unigram {
  constructor(token, bigrams, count) {
    this.token = token;
    this.bigrams = bigrams;
    this.count = count;
    this.bigramCount = 0;
  }
}

Unigram.prototype.addBigram = function(bigram) {
  this.bigramCount += bigram.count;
  this.bigrams.push(bigram);
};  

class Bigram {
  constructor(tokens, count) {
    this.tokens = tokens;
    this.count = count;
  }
}

function parseUnigrams(rawText) {
  var lines = rawText.split("\n");
  var unigrams = {};
  var total = parseInt(lines[0]);
  for(var i = 1; i < lines.length; i++) {
    if(lines[i].trim() != '') {
      var tokens = lines[i].split(" ");
      unigrams[tokens[0]] = new Unigram(tokens[0], [], parseInt(tokens[1]));
    }
  }
  return new SortedNGrams(unigrams, total);
}

function parseBigrams(grams, rawText) {
  var lines = rawText.split("\n");
  for(var i = 1; i < lines.length; i++) {
    if(lines[i].trim() != '') {
      var tokens = lines[i].split(" ");
      grams.addBigram(new Bigram([tokens[0], tokens[1]], parseInt(tokens[2])));
    }
  }
}

function loadNGrams() {
  var sortLocations = {"bi_covers.txt": 2,  "bi_originals.txt": 3,  "uni_covers.txt": 0,  "uni_originals.txt": 1};
  var files = document.getElementById("fileGetter").files;
  if(files.length == 4) {
    var reader = new FileReader();
    grams = {};
    var sortedFiles = [null, null, null, null];
    for(var i = 0; i < files.length; i++) {
      sortedFiles[sortLocations[files[i].name]] = files[i];
    }
    var idx = 0;
    reader.onload = function(e) {
      if(idx < 2) {
        grams[sortedFiles[idx].name.includes("covers") ? "covers" : "originals"] = parseUnigrams(e.target.result);
      } else {
        if(sortedFiles[idx].name.includes("covers")) {
          parseBigrams(grams["covers"], e.target.result);
        } else {
          parseBigrams(grams["originals"], e.target.result);
        }
        if(idx >= sortedFiles.length - 1)
          return;
      }
      reader.readAsText(sortedFiles[++idx]);
    }
    reader.readAsText(sortedFiles[idx]);
    console.log(grams);
    return grams;
  } else {
    alert("Please select the 4 ngram files");
    return null;
  }
}

function ModelV1(nGrams) {
  this.nGrams = nGrams;
}

ModelV1.prototype.generate = function(numLines, wackiness, coverWeight, nonsense) {
  var currentToken = "^";
  var n = 0;
  var song = [];
  while(n < numLines) {
    var nonsenseFlag = Math.random() < nonsense;
    if(nonsenseFlag) {
      var nGrams = Math.random() < coverWeight ? this.nGrams.covers: this.nGrams.originals;
      if(Math.random() >= wackiness) {
        var idx = Math.random() * nGrams.count;
        var sum = 0;
        for(var i = 0; i < nGrams.unigramList.length; i++) {
          sum += nGrams.unigramList[i].count;
          if(sum >= idx) {
            currentToken = nGrams.unigramList[i].token;
            break;
          }
        }
      } else {
        var minCount = nGrams.count + 1;
        for(var i = 0; i < 3; i++) {
          var unigram = nGrams.unigramList[Math.trunc(Math.random() * nGrams.unigramList.length)];;
          if(unigram.count < minCount) {
            minCount = unigram.count;
            currentToken = unigram.token;
          }
        }
      }
      if(currentToken == '^' || currentToken == '$' && (song.length == 0 || song[song.length - 1] == '<br/>')) {
        currentToken = '^';
        nonsenseFlag = false;
      }
    } 
    if(!nonsenseFlag) {
      var oldToken = currentToken;
      if(Math.random() < coverWeight) {
        currentToken = this.nextToken(this.nGrams.covers, currentToken, wackiness);
        if(currentToken == null)
          currentToken = this.nextToken(this.nGrams.originals, oldToken, wackiness);
      } else {
        currentToken = this.nextToken(this.nGrams.originals, currentToken, wackiness);
        if(currentToken == null)
          currentToken = this.nextToken(this.nGrams.covers, oldToken, wackiness);
      }
    }
    if(currentToken == "$") {
        song.push("<br/>");
        currentToken = "^";
        n++;
      } else {
        song.push(currentToken);
      }
  }
  return song.join(" ");
};

ModelV1.prototype.nextToken = function(nGrams, token, wackiness) {
  var unigram = nGrams.unigrams[token];
  if(unigram == undefined)
    return null;
  if(Math.random() >= wackiness) {
    var idx = Math.random() * unigram.bigramCount;
    var sum = 0;
    for(var i = 0; i < unigram.bigrams.length; i++) {
      sum += unigram.bigrams[i].count;
      if(sum >= idx) {
        return unigram.bigrams[i].tokens[1];
      }
    }
    return null;
  } else {
    var wackyPick = '';
    var minCount = unigram.bigramCount + 1;
    for(var i = 0; i < 3; i++) {
      var bigram = this.randomBigram(unigram);
      if(bigram.count < minCount) {
        minCount = bigram.count;
        wackyPick = bigram.tokens[1];
      }
    }
    return wackyPick;
  }
};

ModelV1.prototype.randomBigram = function(unigram) {
  return unigram.bigrams[Math.trunc(Math.random() * unigram.bigrams.length)];
};

function trainModel() {
  model = new ModelV1(loadNGrams());
  document.getElementById("controls").style.display = 'block';
}

function generateSong() {
  var numLines = document.getElementById('numLines').value;
  if(isNaN(numLines) || numLines < 1)
    numLines = 1
  var wackiness = document.getElementById('wackiness').value / 100;
  var coverWeight = document.getElementById('coverWeight').value / 100;
  var nonsense = document.getElementById('nonsense').value / 100;
  document.getElementById('song').innerHTML = model.generate(numLines, wackiness, coverWeight, nonsense);
}

function linkSlider(range, text) {
  range.addEventListener('input', function (e) {
    text.value = e.target.value;
  });
  text.addEventListener('input', function (e) {
    e.target.value = Math.min(100, Math.max(0, e.target.value));
    range.value = e.target.value
  });
}

function linkSliders() {
  linkSlider(document.getElementById("wackiness"), document.getElementById("wackText"));
  linkSlider(document.getElementById("coverWeight"), document.getElementById("coverText"));
  linkSlider(document.getElementById("nonsense"), document.getElementById("nonsenseText"));
}
