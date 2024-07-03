// 在 typescript 中使用 nodejs 原生的套件時，需要裝 @types/node 才不會噴錯
import { readFile } from 'node:fs/promises'
import { createApp, createRouter, defineEventHandler, toNodeListener, defineWebSocketHandler } from 'h3'
import { listen } from 'listhen'

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
const peers: Array<any> = []
const peers2: Array<any> = []
// websocket hooks
const hooks: any = {
  '/_ws': {
    open(peer: any) {
      console.log('[ws] open', peer)
      peers.push(peer)
    },

    message(peer: any, message: any) {
      console.log('[ws] message', peer, message)
      if (message.text().includes('ping')) {
        peer.send('pong')
      } else {
        peers.forEach(p => {
          p.send(message.text())
        })
      }
    },

    close(peer: any, event: any) {
      console.log('[ws] close', peer, event)
    },

    error(peer: any, error: any) {
      console.log('[ws] error', peer, error)
    }
  },

  '/_ws2': {
    open(peer: any) {
      console.log('[ws2] open', peer)
      peers2.push(peer)
    },

    message(peer: any, message: any) {
      console.log('[ws2] message', peer, message)
      if (message.text().includes('ping')) {
        peer.send('pong')
      } else {
        peers2.forEach(p => {
          p.send(message.text())
        })
      }
    },

    close(peer: any, event: any) {
      console.log('[ws2] close', peer, event)
    },

    error(peer: any, error: any) {
      console.log('[ws2] error', peer, error)
    }
  }
}

// websocket routers
router.get(
  '/_ws',
  defineWebSocketHandler(hooks['/_ws'])
)

router.get(
  '/_ws2',
  defineWebSocketHandler(hooks['/_ws'])
)

// listen to http
const listener = await listen(toNodeListener(app), {
  port: 2345,
  // ws settings 必需要是一個 async function resolve
  // 當每次有新peer連接時會呼叫
  ws: {
    async resolve(info) {
      return hooks[info.url]
    }
  }
})
