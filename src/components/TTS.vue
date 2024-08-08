<template>
    <div>
      <button @click="startRecognition" :disabled="isRecognizing">开始录音</button>
      <button @click="stopRecognition" :disabled="!isRecognizing">停止录音</button>
      <p v-if="transcript">转换后的文本: {{ transcript }}</p>
    </div> 
  </template>
  
  <script setup>
  import { ref } from 'vue';
  
  const isRecognizing = ref(false);
  const transcript = ref('');
  let recognition;
  
  const startRecognition = () => {
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
      transcript.value = event.results[0][0].transcript;
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
    if (recognition && isRecognizing.value) {
      recognition.stop();
      isRecognizing.value = false;
    }
  };
  </script>
  
  <style scoped>
  </style>
  