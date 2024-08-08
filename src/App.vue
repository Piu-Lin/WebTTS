<script setup>
import Connectpxy from "./components/connectpxy.vue"
import {ref,reactive} from "vue"
import sendAssignMessage from "/src/tools/sendAssignMessage.js"
const transcript = ref(''); // 转换后的文字
let recognition;
const isRecognizing = ref(false);
let uemeg = reactive({})
const startRecognition = () => {
  console.log("开始录音")
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    console.error('当前浏览器不支持Web Speech API');
    return;
  }
  recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = 'zh-CN';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    isRecognizing.value = true;
    transcript.value = '';
  };

  recognition.onresult = (event) => {
    console.log("正确结束")
    transcript.value = event.results[0][0].transcript;
    let assignBe='{"eventname":"Voice_Result","text":"'
    sendAssignMessage(assignBe+transcript.value+'"}')
  };

  recognition.onerror = (event) => {
    console.error('语音识别错误:', event.error);
    if (event.error === 'no-speech') {
      transcript.value = '没有检测到语音，请重试。';
    }
    isRecognizing.value = false;
  };

  recognition.onend = () => {
    isRecognizing.value = false;
  };

  recognition.start();
};
const stopRecognition = () => {
  console.log("结束录音")
  if (recognition && isRecognizing.value) {
    recognition.stop();
    isRecognizing.value = false;
  }
};
const trigger = (meg) => {
  try{uemeg = JSON.parse(meg)} catch(e) {console.log("json格式出错")}
  console.log(uemeg.event_name)
  if (uemeg.event_name == "Begin_Voice") {
    startRecognition();
  } else if (uemeg.event_name == "End_Voice"){
    stopRecognition()
  }
}
</script>

<template>
  <div id="container"></div>
  <Connectpxy @trigger="trigger"/>
    <div>转换后的文字为 {{transcript}}</div>
</template>

<style scoped>
</style>
