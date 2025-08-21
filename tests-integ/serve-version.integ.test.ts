import { app } from "../examples/mock/electron"
import { ElectronOllama } from "../src"

describe('Serve specific version', () => {
  it('should serve the v0.11.0 version', async () => {
    const consoleSpy = jest.spyOn(console, 'log')

    const eo = new ElectronOllama({
      basePath: app.getPath('userData'), // share examples userData folder
    })

    try {
      if (!(await eo.isRunning())) {
        // Welcome OpenAI's gpt-oss models
        await eo.serve('v0.11.0', {
          serverLog: (message) => console.log(message),
          downloadLog: (message) => console.log(message)
        })

        const liveVersionText = await fetch('http://localhost:11434/api/version').then(res => res.text())
        expect(liveVersionText).toStrictEqual('{"version":"0.11.0"}')
      } else {
        throw new Error('Ollama server is already running')
      }
    } finally {
      await eo.getServer()?.stop()
    }

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Listening on 127.0.0.1:11434'))
    expect(consoleSpy).toHaveBeenCalledWith('Creating directory')
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Downloading'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Extracted archive'));

    consoleSpy.mockRestore();
  })
})
