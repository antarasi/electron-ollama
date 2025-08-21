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
          downloadLog: (percent, message) => console.log(`${percent}%: ${message}`)
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
    expect(consoleSpy).toHaveBeenCalledWith('0%: Creating directory')
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('7%: Downloading'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('10%: Downloading'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('50%: Downloading'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('76%: Downloading'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('90%: Downloading'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('100%: Extracting'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('100%: Extracted'));

    consoleSpy.mockRestore();
  })
})
