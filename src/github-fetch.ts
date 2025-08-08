export async function githubFetch(url: string): Promise<Response> {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`GitHub request failed: ${error}`)
    }

    return response
  }
