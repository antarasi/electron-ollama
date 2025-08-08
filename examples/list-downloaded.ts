import { ElectronOllama } from '../dist' // replace with: import { ElectronOllama } from 'electron-ollama'
import { app } from './mock/electron' // on electron app replace with: import { app } from 'electron'

async function main() {
  const eo = new ElectronOllama({
    basePath: app.getPath('userData'),
  })

  const currentVersion = await eo.downloadedVersions()
  console.log('current platform versions', currentVersion) // [ 'v0.11.0', 'v0.11.2', 'v0.11.4' ]
  const windowsVersions = await eo.downloadedVersions({ os: 'windows', arch: 'arm64' })
  console.log('windows versions', windowsVersions) // [ 'v0.11.4' ]
}

main()
