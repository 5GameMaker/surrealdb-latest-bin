export interface Release {
    uploadUrl: string,
    assets: ReleaseAsset[],
}

export interface ReleaseAsset {
    digest: string,
    name: string,
    id: number,
    state: "uploaded"|"open",
}
