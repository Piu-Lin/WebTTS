/** 
 * @param assignMessage 指定的json字符串
 * @description 发送消息至3dcat
 * */
export default function snedAssignMessage(assignMessage) {
    console.log("开始传输\n"+assignMessage)
    try {
        // launch.getConnection().emitUIInteraction(assignMessage).then(result=>console.log(result))
        window.larksr.sendTextToDataChannel(assignMessage)
    } catch (e) {
        console.log(e)
    }
}