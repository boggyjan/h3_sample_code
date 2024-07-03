# 主要是在研究 Nitro 底層有什麼

## Nitro 主要由下列三個最重要的東西組成：
- [listhen] Elegant HTTP Listener
  https://github.com/unjs/listhen
  負責聽 http 類似 server.listen() 的概念，主要設計是以 cli 執行（也可以 import 在程式碼中使用，如範例就是這樣做）
  可以監聽檔案變動（cli帶入-w）達到變動時不需重啟的功能
  主要的 code 請見 cli.mjs & index.mjs

- [crossws] runtime agnostic WebSockets
  https://crossws.unjs.io
  負責 WebSocket 的 peer 與 msg 處理

- [h3] The Web Framework for Modern JavaScript Era
  https://h3.unjs.io/
  類似 Express 的功能，處理 router 的部分
