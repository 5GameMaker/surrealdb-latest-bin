export const config = {
    token: "",
    root: "https://api.github.com/",
    owner: "5GameMaker",
    repo: "surrealdb-latest-bin",
};

function api(path) { return config.root.endsWith("/") ? `${config.root.slice(0, config.root.length - 1)}${path}` : `${config.root}${path}` }

/**
 * @returns {Promise<Release | null>}
 */
export async function releaseExists(name) {
    const output = await fetch(api(`/repos/${config.owner}/${config.repo}/releases/${name}`), {
        headers: {
            "Accept": "application/vnd.github+json",
            "Authorization": `Bearer ${config.token}`,
            "X-GitHub-Api-Version": "2026-03-10",
        },
    });
    if (!output.ok) return null;
    const text = await output.json();
    return { uploadUrl: text.upload_url, assets: text.assets.map(x => ({
        digest: x.digest,
        name: x.name,
        state: x.state,
        id: x.id,
    })) };
}

/**
 * @returns {Promise<Release>}
 */
export async function releaseCreate(name, prerelease) {
    const output = await fetch(api(`/repos/${config.owner}/${config.repo}/releases`), {
        method: "POST",
        headers: {
            "Accept": "application/vnd.github+json",
            "Authorization": `Bearer ${config.token}`,
            "X-GitHub-Api-Version": "2026-03-10",
        },
        body: JSON.stringify({
            tag_name: name,
            target_commitish: "master",
            name: name,
            description: "Automatically created release",
            prerelease,
        }),
    });
    if (!output.ok) throw Error(await output.text());
    const text = await output.json();
    return { uploadUrl: text.upload_url, assets: text.assets.map(x => ({
        digest: x.digest,
        name: x.name,
        state: x.state,
        id: x.id,
    })) };
}

export async function releaseAssetDelete(id) {
    const output = await fetch(api(`/repos/${config.owner}/${config.repo}/releases/assets/${id}`), {
        method: "DELETE",
        headers: {
            "Accept": "application/vnd.github+json",
            "Authorization": `Bearer ${config.token}`,
            "X-GitHub-Api-Version": "2026-03-10",
        },
    });
    if (!output.ok) throw Error(`Failed to delete asset ID ${id}: ${output.status}`);
}

export async function releaseAssetUpload(stream, name, contentLength, uploadUrl) {
    const headers = {
        "Accept": "application/vnd.github+json",
        "Authorization": `Bearer ${config.token}`,
        "X-GitHub-Api-Version": "2026-03-10",
        "Content-Type": "application/octet-stream",
    };
    if (contentLength) headers["Content-Length"] = contentLength;

    const i = uploadUrl.indexOf("{");
    uploadUrl = uploadUrl.slice(0, i);
    const url = new URL(uploadUrl.slice(0, i));
    url.searchParams.set("name", name);

    const output = await fetch(url.toString(), {
        method: "POST",
        headers,
        body: stream,
    });
    if (!output.ok) throw Error(`Failed to upload asset: ${output.status}`);
}
