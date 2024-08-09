<script setup>
import Connectpxy from './components/connectpxy.vue'
import { ref, reactive } from 'vue'
import sendAssignMessage from '/src/tools/sendAssignMessage.js'

const isRecognizing = ref(false)
let uemeg = reactive({})

let iatWS
const recorder = new RecorderManager('/recordManager')
let resultText = ref('')
let resultTextTemp = ref('')
let status = ref('UNDEFINED')

/**
 * 获取websocket url
 * 该接口需要后端提供，这里为了方便前端处理
 */
function getWebSocketUrl() {
  // 请求地址根据语种不同变化
  var url = 'wss://iat-api.xfyun.cn/v2/iat'
  var host = 'iat-api.xfyun.cn'
  var apiKey = 'a317a56a30f5ecc2743afd47338a62da'
  var apiSecret = 'Y2ZlYjgyODZjMzY4YzcyNmE1NmViM2Jk'
  var date = new Date().toGMTString()
  var algorithm = 'hmac-sha256'
  var headers = 'host date request-line'
  var signatureOrigin = `host: ${host}\ndate: ${date}\nGET /v2/iat HTTP/1.1`
  var signatureSha = CryptoJS.HmacSHA256(signatureOrigin, apiSecret)
  var signature = CryptoJS.enc.Base64.stringify(signatureSha)
  var authorizationOrigin = `api_key="${apiKey}", algorithm="${algorithm}", headers="${headers}", signature="${signature}"`
  var authorization = btoa(authorizationOrigin)
  url = `${url}?authorization=${authorization}&date=${date}&host=${host}`
  return url
}

function toBase64(buffer) {
  var binary = ''
  var bytes = new Uint8Array(buffer)
  var len = bytes.byteLength
  for (var i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return window.btoa(binary)
}

function renderResult(resultData) {
  // 识别结束
  let jsonData = JSON.parse(resultData)
  if (jsonData.data && jsonData.data.result) {
    let data = jsonData.data.result
    let str = ''
    let ws = data.ws
    for (let i = 0; i < ws.length; i++) {
      str = str + ws[i].cw[0].w
    }
    // 开启wpgs会有此字段(前提：在控制台开通动态修正功能)
    // 取值为 "apd"时表示该片结果是追加到前面的最终结果；取值为"rpl" 时表示替换前面的部分结果，替换范围为rg字段
    if (data.pgs) {
      if (data.pgs === 'apd') {
        // 将resultTextTemp同步给resultText
        resultText.value = resultTextTemp.value
      }
      // 将结果存储在resultTextTemp中
      resultTextTemp.value = resultText.value + str
    } else {
      resultText.value = resultText.value + str
    }
  }
  if (jsonData.code === 0 && jsonData.data.status === 2) {
    iatWS.close()
    let assignBe='{"eventname":"Voice_Result","text":"'
    sendAssignMessage(assignBe+resultText.value+'"}')
  }
  if (jsonData.code !== 0) {
    iatWS.close()
    console.error(jsonData)
  }
}

function connectWebSocket() {
  const websocketUrl = getWebSocketUrl()
  if ('WebSocket' in window) {
    iatWS = new WebSocket(websocketUrl)
  } else if ('MozWebSocket' in window) {
    iatWS = new MozWebSocket(websocketUrl)
  } else {
    alert('浏览器不支持WebSocket')
    return
  }
  iatWS.onopen = (e) => {
    // 开始录音
    console.log('调用开始函数')
    recorder.start({
      sampleRate: 16000,
      frameSize: 1280,
    })
    var params = {
      common: {
        app_id: '20f04f5b',
      },
      business: {
        language: 'zh_cn',
        domain: 'iat',
        accent: 'mandarin',
        vad_eos: 5000,
        dwa: 'wpgs',
      },
      data: {
        status: 0,
        format: 'audio/L16;rate=16000',
        encoding: 'raw',
      },
    }
    iatWS.send(JSON.stringify(params))
  }
  iatWS.onmessage = (e) => {
    renderResult(e.data)
  }
  iatWS.onerror = (e) => {
    console.error(e)
    recorder.stop()
    status.value = 'CLOSED'
  }
  iatWS.onclose = (e) => {
    recorder.stop()
    status.value = 'CLOSED'
  }
}

recorder.onFrameRecorded = ({ isLastFrame, frameBuffer }) => {
  if (iatWS.readyState === iatWS.OPEN) {
    iatWS.send(
      JSON.stringify({
        data: {
          status: isLastFrame ? 2 : 1,
          format: 'audio/L16;rate=16000',
          encoding: 'raw',
          audio: toBase64(frameBuffer),
        },
      }),
    )
    if (isLastFrame) {
      status.value = 'CLOSING'
    }
  }
}

const startRecognition = () => {
  console.log('开始录音')

  isRecognizing.value = true
  resultText.value = ''
  connectWebSocket()
}

const stopRecognition = () => {
  recorder.stop()
}

const trigger = (meg) => {
  try {
    uemeg = JSON.parse(meg)
  } catch (e) {
    console.log('json格式出错')
  }
  console.log(uemeg.event_name)
  if (uemeg.event_name == 'Begin_Voice') {
    startRecognition()
  } else if (uemeg.event_name == 'End_Voice') {
    stopRecognition()
  }
}
</script>

<template>
  <div id="container"></div>
  <Connectpxy @trigger="trigger" />
  <div>转换后的文字为 {{ transcript }}</div>
</template>

<style scoped></style>
