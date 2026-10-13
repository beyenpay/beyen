import { useQuery } from "@tanstack/react-query"

import { fetchRepoStars } from "@/api/external/github"

const HOUR = 60 * 60 * 1000

export function useRepoStars(repo: string) {
    return useQuery({
        queryKey: ["external", "github", "stars", repo],
        queryFn: () => fetchRepoStars(repo),
        staleTime: HOUR,
        gcTime: 24 * HOUR,
        retry: false,
        meta: { silent: true },
    })
}