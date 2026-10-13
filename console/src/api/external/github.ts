const GITHUB_API = "https://api.github.com"

export async function fetchRepoStars(repo: string): Promise<number> {
    const res = await fetch(`${GITHUB_API}/repos/${repo}`, {
        headers: { Accept: "application/vnd.github+json" },
    })
    if (!res.ok) {
        throw new Error(`GitHub API responded with ${res.status}`)
    }
    const data = (await res.json()) as { stargazers_count: number }
    return data.stargazers_count
}