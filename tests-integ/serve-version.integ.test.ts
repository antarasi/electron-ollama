import { app } from "../examples/mock/electron"
import { ElectronOllama } from "../src"
import { ElectronOllamaServer } from "../src/server"

describe('Serve specific version', () => {
  it('should serve the v0.11.0 version', async () => {
    const consoleSpy = jest.spyOn(console, 'log')

    const eo = new ElectronOllama({
      basePath: app.getPath('userData'), // share examples userData folder
    })
    let server: ElectronOllamaServer | null = null

    try {
      if (!(await eo.isRunning())) {
        server = await eo.serve('v0.11.0', { log: (message) => console.log(message) }) // Welcome OpenAI's gpt-oss models

        const liveVersionText = await fetch('http://localhost:11434/api/version').then(res => res.text())
        expect(liveVersionText).toStrictEqual('{"version":"0.11.0"}')
      } else {
        throw new Error('Ollama server is already running')
      }
    } finally {
      await server?.stop()
    }

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Listening on 127.0.0.1:11434'))

    consoleSpy.mockRestore();
  })
})
