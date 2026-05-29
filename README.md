# Latest SurrealDB binaries

Since SurrealDB isn't publishing their binaries on Github, I will!

This repo has an action running every day to check for updates. If an update is found, it'll download all the binaries and
publish them in [releases section](https://github.com/5GameMaker/surrealdb-latest-bin/releases).

- Releases will be published as just regular releases with `release-*` tag.
- Betas will be published as pre-releases with a `beta-*` tag.
- Alphas will be published as pre-releases with a `alpha-*` tag.
- Nightly will be published as pre-releases with a `nightly-*` tag. Importantly, the file will be replaced daily up until
  the version name is changed in `nightly.txt`.

Everything here is public information sourced from <https://install.surrealdb.com/>.

## Usage notes

For Windows, SurrealDB simply publishes a binary.

For other OSs the published *archive* contains exactly one file named `surreal`. Use
`curl -L <URL> | tar -xzO surreal > surreal && chmod +x surreal` to properly download them.

This may be changed in the future, but that's what it is right now.

## Use of AI in this repo

I don't care enough not to, explained entirely by the image below:

![Thank you, GitHub](https://raw.githubusercontent.com/5GameMaker/surrealdb-latest-bin/refs/heads/master/thank-you-github.png)

Specifically, the [workflow file itself](https://github.com/5GameMaker/surrealdb-latest-bin/tree/master/.github/workflows/refresh.yml).
