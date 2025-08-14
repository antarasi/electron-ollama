import { app } from "../examples/mock/electron"
import { ElectronOllama } from "../src"

describe('Check metadata', () => {
  it('should check current platform config', async () => {
    const eo = new ElectronOllama({
      basePath: app.getPath('userData'), // share examples userData folder
    })

    const currentPlatformConfig = eo.currentPlatformConfig()
    console.log(currentPlatformConfig)

    expect(currentPlatformConfig).toBeDefined()
    expect(currentPlatformConfig.os).toBeDefined()
    expect(currentPlatformConfig.arch).toBeDefined()
  })

  it('should check metadata', async () => {
    const eo = new ElectronOllama({
      basePath: app.getPath('userData'), // share examples userData folder
    })

    const metadata = await eo.getMetadata()
    console.log(metadata)

    expect(metadata).toBeDefined()
    expect(metadata.version).toBeDefined()
  })
})
