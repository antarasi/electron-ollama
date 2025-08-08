import { ElectronOllama, ElectronOllamaServer } from '../dist' // replace with: import { ElectronOllama, ElectronOllamaServer } from 'electron-ollama'
import { app } from './mock/electron' // on electron app replace with: import { app } from 'electron'

async function main() {
  const eo = new ElectronOllama({
    basePath: app.getPath('userData'),
    serveLog: (message) => console.log('Ollama: ', message),
  })
  let server: ElectronOllamaServer | null = null

  if (!(await eo.isRunning())) {
    const metadata = await eo.getMetadata('latest')
    server = await eo.serve(metadata.version)
  } else {
    console.log('Ollama server is already running')
  }
}

main()
