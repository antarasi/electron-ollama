import { ElectronOllama, ElectronOllamaServer } from '../dist' // replace with: import { ElectronOllama } from 'electron-ollama'
import { app } from './mock/electron' // on electron app replace with: import { app } from 'electron'

async function main() {
  const eo = new ElectronOllama({
    basePath: app.getPath('userData'),
    serveLog: (message) => console.log('Ollama: ', message),
  })
  let server: ElectronOllamaServer | null = null

  if (!(await eo.isRunning())) {
    server = await eo.serve('v0.11.0') // Welcome OpenAI's gpt-oss models

    await new Promise(resolve => setTimeout(resolve, 2000)) // wait for server to start

    const liveVersion = await fetch('http://localhost:11434/api/version').then(res => res.json())

    console.log('Currently running Ollama', liveVersion)

    server.stop()
  } else {
    console.log('Ollama server is already running')
  }
}

main()
