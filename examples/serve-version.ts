import { ElectronOllama } from '../dist' // replace with: import { ElectronOllama } from 'electron-ollama'
import { app } from './mock/electron' // on electron app replace with: import { app } from 'electron'

async function main() {
  const eo = new ElectronOllama({
    basePath: app.getPath('userData'),
  })

  if (!(await eo.isRunning())) {
    await eo.serve('v0.11.0', { log: (message) => console.log('[Ollama]', message) }) // Welcome OpenAI's gpt-oss models

    const liveVersion = await fetch('http://localhost:11434/api/version').then(res => res.json())
    console.log('Currently running Ollama', liveVersion)

    await eo.getServer()?.stop() // gracefully stop the server with 5s timeout
  } else {
    console.log('Ollama server is already running')
  }
}

main()
