// 在 typescript 中使用 nodejs 原生的套件時，需要裝 @types/node 才不會噴錯
import { readFile } from 'node:fs/promises'
import { createApp, createRouter, defineEventHandler, toNodeListener, defineWebSocketHandler } from 'h3'
import { listen } from 'listhen'
import { defineHooks } from 'crossws'
import type { Hooks, Peer, WSRequest } from 'crossws'


// Create an app instance
export const app = createApp({ debug: true })

// Create a new router and register it in app
const router = createRouter()
app.use(router)

// common route
router.get(
  '/',
  defineEventHandler((event) => {
    return { message: '⚡️ Tadaa!' }
  })
)

// websocket
// 在這個範例中建立了兩個不一樣的path去分別處理兩個聊天室

// sample chat page route
router.get(
  '/chat',
  defineEventHandler(async () => {
    try {
      return await readFile('./src/chat.html', { encoding: 'utf8' })
    } catch {
      return
    }
  })
)

router.get(
  '/chat2',
  defineEventHandler(async () => {
    try {
      return await readFile('./src/chat2.html', { encoding: 'utf8' })
    } catch {
      return
    }
  })
)

// websocket hooks
// 兩個 peers 陣列裡面都是 Peer 類別
const peers: Array<Peer> = []
const peers2: Array<Peer> = []

enum WsPaths {
  WS = '/_ws',
  WS2 = '/_ws2'
}

// 這邊無法用 interface 只能用 type
// interface HooksGroup {
type HooksGroup = {
  // Hooks中的各個function我有可能只用到其中幾個，所以加了Partial<>
  // [key: string]: Partial<Hooks>;
  // key 必須是 WsPaths 其中一個
  [key in WsPaths]: Partial<Hooks>;
}

const hooks: HooksGroup = {
  [WsPaths.WS]: defineHooks({
    open(peer) {
      console.log('[ws] open', peer)
      peers.push(peer)
    },

    // upgrade (req) {
    //   console.log('[ws] upgrade', req)
    // },

    message(peer, message) {
      console.log('[ws] message', peer, message)
      if (message.text().includes('ping')) {
        peer.send('pong')
      } else {
        peers.forEach(p => {
          p.send(message.text())
        })
      }
    },

    close(peer, event) {
      console.log('[ws] close', peer, event)
      const idx = peers.findIndex(p => p === peer)
      peers.splice(idx, 1)
    },

    error(peer, error) {
      console.log('[ws] error', peer, error)
    }
  }),

  [WsPaths.WS2]: defineHooks({
    open(peer) {
      console.log('[ws2] open', peer)
      peers2.push(peer)
    },

    // upgrade (req) {
    //   console.log('[ws] upgrade', req)
    // },

    message(peer, message) {
      console.log('[ws2] message', peer, message)
      if (message.text().includes('ping')) {
        peer.send('pong')
      } else {
        peers2.forEach(p => {
          p.send(message.text())
        })
      }
    },

    close(peer, event) {
      console.log('[ws2] close', peer, event)
      const idx = peers2.findIndex(p => p === peer)
      peers2.splice(idx, 1)
    },

    error(peer, error) {
      console.log('[ws2] error', peer, error)
    }
  })
}

// websocket routers
router.get(
  WsPaths.WS,
  defineWebSocketHandler(hooks[WsPaths.WS])
)

router.get(
  WsPaths.WS2,
  defineWebSocketHandler(hooks[WsPaths.WS2])
)

// listen to http
const listener = await listen(toNodeListener(app), {
  port: 2345,
  // ws settings 必需要是一個 async function resolve
  // 當每次有新peer連接時會呼叫
  ws: {
    async resolve(info) {
      // info.url 必須是 WsPaths 其中一個值！
      return hooks[info.url as WsPaths]
    }
  }
})
