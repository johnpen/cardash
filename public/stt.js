async function main() {
  const myvad = await vad.MicVAD.new({
    onSpeechEnd: (audio) => {
      // do something with `audio` (Float32Array of audio samples at sample rate 16000)...
      runOnnxExample(audio)
    },
    onnxWASMBasePath:
      "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/",
    baseAssetPath:
      "https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.29/dist/",
  })
  myvad.start()
}
//main()
//kModel = "whisper_cpu_int8_0_model.onnx";

var recognizing = false;
var ignore_onend;
var final_transcript = '';

var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition;
var SpeechRecognitionEvent =  SpeechRecognitionEvent || webkitSpeechRecognitionEvent;




  var recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.lang = "en-GB";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = function() {
    recognizing = true;
  };

  recognition.onerror = function(event) {
    if (event.error == 'no-speech') {

      console.log('info_no_speech');
      ignore_onend = true;
    }
    if (event.error == 'audio-capture') {

      
      console.log('info_no_microphone');
      ignore_onend = true;
    }
    if (event.error == 'not-allowed') {
      console.log('info denied')
      ignore_onend = true;
    }
  };

  recognition.onend = function() {
    recognition.stop();
    return;
    recognizing = false;
    if (ignore_onend) {
      return;
    }

    if (!final_transcript) {
      console.log('info_start');
      return;
    }
    if (window.getSelection) {
      window.getSelection().removeAllRanges();
      var range = document.createRange();
      range.selectNode(document.getElementById('txtMsg'));
      window.getSelection().addRange(range);
    }

  };

  

  recognition.onresult = function(event) {
    console.log('result of recognition')
    var interim_transcript = '';
    final_transcript = '';
    if (typeof(event.results) == 'undefined') {
      recognition.onend = null;
      recognition.stop();

      return;
    }
    document.getElementById('txtMsg').value = ''
    for (var i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        final_transcript += event.results[i][0].transcript;
      } else {
        interim_transcript += event.results[i][0].transcript;
      }
    }
    final_transcript = capitalize(final_transcript);
    document.getElementById('txtMsg').focus();
    document.getElementById('txtMsg').value = final_transcript;
    document.getElementById('txtMsg').dispatchEvent(new KeyboardEvent('keydown', {'key': ' '}));
    document.getElementById('txtMsg').focus();
    document.getElementById('sendBut').disabled = false;



  };


var two_line = /\n\n/g;
var one_line = /\n/g;
function linebreak(s) {
  return s.replace(two_line, '<p></p>').replace(one_line, '<br>');
}

var first_char = /\S/;
function capitalize(s) {
  return s.replace(first_char, function(m) { return m.toUpperCase(); });
}

function stop(){
      console.log('stop voice recognition')
      document.getElementById('lisenBut').classList.remove('warp')
    recognizing = false;
    recognition.stop();
}

function start(){

  if(!recognizing){

  console.log('start voice recognition')
  document.getElementById('txtMsg').value = '';
  document.getElementById('lisenBut').classList.add('warp')
  recognizing = true;
  recognition.start();
  }
  else{
    console.log('stop voice recognition')
      document.getElementById('lisenBut').classList.remove('warp')
    recognizing = false;
    recognition.stop();
    
  }
}