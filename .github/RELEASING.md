# npm releases

Run the **Publish npm release** workflow manually from the default branch after
updating `package.json` and `package-lock.json` to the same stable version.
Prerelease versions are intentionally rejected; this workflow publishes to npm's
`latest` tag.

Configure npm trusted publishing for this repository with workflow filename
`publish.yaml` and environment `npm-release`. Configure required reviewers on
GitHub's `npm-release` environment if approval is required: an environment name
alone does not create an approval gate.

Validation checks registry availability, existing Git tags, unit/e2e tests,
typechecking, compilation, and a publish dry run. The publish job repeats the
version checks after approval, publishes via OIDC, then creates `v<version>`
and its GitHub Release at the workflow commit.

npm publication and GitHub Release creation are separate operations. If npm
publication succeeds but GitHub Release creation fails, recover by creating the
release for that same commit; rerunning publication will intentionally reject
an already published version.
