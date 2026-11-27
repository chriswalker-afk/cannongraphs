// Stable, whitelisted reward identities. Saved achievements remain earned
// even if a curriculum revision retires the puzzle that awarded them.
export const achievementIds=["first-flight","cadet-wings","pilot-wings","ace-wings","perfect-pilot","perfect-ace","star-collector","first-gem","gem-collector","gem-explorer","treasure-map","relay-runner","world-explorer","ace-world","graphiverse-explorer"] as const;
export function validAchievementIds(value:unknown):string[]{
 const ids=new Set(Array.isArray(value)?value:[]);
 return achievementIds.filter(id=>ids.has(id));
}
