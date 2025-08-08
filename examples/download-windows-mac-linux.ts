import { ElectronOllama } from '../dist' // replace with: import { ElectronOllama } from 'electron-ollama'
import { app } from './mock/electron' // on electron app replace with: import { app } from 'electron'

async function main() {
  const eo = new ElectronOllama({
    basePath: app.getPath('userData'),
  })

  const metadata = await eo.getMetadata('latest')

  await eo.download(metadata.version, { os: 'windows', arch: 'arm64' })
  await eo.download(metadata.version, { os: 'darwin', arch: 'arm64' })
  await eo.download(metadata.version, { os: 'linux', arch: 'arm64' })

  console.log('Downloaded', metadata.version, 'for windows, mac and linux')
}

main()
