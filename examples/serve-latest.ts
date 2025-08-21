import { ElectronOllama } from '../dist' // replace with: import { ElectronOllama } from 'electron-ollama'
import { app } from './mock/electron' // on electron app replace with: import { app } from 'electron'

async function main() {
  const eo = new ElectronOllama({
    basePath: app.getPath('userData'),
  })

  if (!(await eo.isRunning())) {
    const metadata = await eo.getMetadata('latest')
    await eo.serve(metadata.version, {
      serverLog: (message) => console.log('[Ollama]', message),
      downloadLog: (percent, message) => console.log('[Ollama Download]', `${percent}%`, message)
    })
  } else {
    console.log('Ollama server is already running')
  }
}

main()
