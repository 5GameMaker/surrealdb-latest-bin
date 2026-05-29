import { config as ghconfig, releaseExists, releaseCreate, releaseAssetDelete, releaseAssetUpload } from "./ghapi.js";

let token = process.env["GITHUB_TOKEN"];
if (token == null) {
    console.warn("Token is not defined!");
    console.warn("Doing a dry run!");
}

ghconfig.token = token;
if (process.env["GITHUB_API_URL"] != null)
    ghconfig.root = process.env["GITHUB_API_URL"];

async function fetchRetry(num, ...args) {
    let error = "num < 1";
    for (let i = 0; i < num; i++) {
        try {
            return await fetch(...args);
        } catch (err) {
            error = err;
        }
    }
    throw error;
}

/**
 * @param {string} version                SurrealDB version
 * @param {"linux"|"darwin"|"windows"} os Operating system name
 * @param {"arm64"|"x86_64"} arch         Architecture name
 * @returns {Promise<string>}
 */
function surrealdbFilename(version, os, arch) {
    const ext = os == "windows" ? "exe" : "tgz";
    return `surrealdb.${os}-${arch}.${ext}`;
}

/**
 * @param {string} version                SurrealDB version
 * @param {"linux"|"darwin"|"windows"} os Operating system name
 * @param {"arm64"|"x86_64"} arch         Architecture name
 * @returns {Promise<{ stream: ReadableStream, length: string|null }>}
 */
async function surrealdbDownload(version, os, arch) {
    const filename = surrealdbFilename(version, os, arch);
    const file = await fetchRetry(5, `https://download.surrealdb.com/${version}/${filename}`);
    if (!file.ok) throw Error(`Could not fetch https://download.surrealdb.com/${version}/${filename}`);
    return { stream: file.body.getReader(), length: file.headers.get("Content-Length") };
}

/**
 * @param {string} prefix      
 * @param {string} versionfile 
 * @param {boolean} prerelease 
 * @param {boolean} alwaysnew  Always refresh the version, even if upload already exists.
 */
async function createRelease(prefix, versionfile, prerelease, alwaysnew) {
    const version = await fetchRetry(5, `https://download.surrealdb.com/${versionfile}`).then(x => x.text()).then(x => x.trim());
    console.log(`[${prefix}] Fetched version: ${version}`);

    if (token == null) {
        console.log(`[${prefix}] GITHUB_TOKEN is not defined, skipping upload...`);
        return;
    }

    const tag = `${prefix}-${version}`;

    const existingRelease = await releaseExists(tag);
    if (existingRelease != null && !alwaysnew) {
        console.log(`[${prefix}] Release already exists, skipping`);
        return;
    }

    let release = existingRelease;
    if (release == null) release = await releaseCreate(tag, prerelease);

    const promises = [];
    let os, arch;
    for ([os, arch] of [
        ["linux", "x86_64"],
        ["linux", "arm64"],
        ["darwin", "x86_64"],
        ["darwin", "arm64"],
        ["windows", "arm64"],
    ]) promises.push(async() => {
        const { stream, length } = await surrealdbDownload(version, os, arch);
        const filename = surrealdbDownload(version, os, arch);

        const asset = release.assets.find(x => x.name == filename);
        if (asset != null) {
            console.log(`[${prefix}] Deleting existing asset`);
            await releaseAssetDelete(asset.id);
        }

        console.log(`[${prefix}] Uploading new asset`);
        await releaseAssetUpload(stream, tag, length, release.uploadUrl);
    });
    await Promise.all(promises);
    console.log(`[${prefix}] Upload complete.`);
}

await Promise.all([
    createRelease("release", "latest.txt", false, false),
    createRelease("beta", "beta.txt", true, false),
    createRelease("alpha", "alpha.txt", true, false),
    createRelease("nightly", "nightly.txt", true, true),
]);
