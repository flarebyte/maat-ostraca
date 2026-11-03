package ghflarebyte

project: {
    org: "flarebyte"
    repo: "maat-ostraca"
}
sync: {
    mode: "push"
}

repository: {
    description: "Translate the ghost in the machine into the poetry of human intent"
    defaultBranch: "main"
    homepage: "https://github.com/flarebyte/maat-ostraca#readme"
    visibility: "public"
    template: false
    topics: ["code-analysis", "flarebyte", "static-analysis", "typescript"]
    // Preserve all existing GitHub labels.
    labels: [
        {
            name: "bug"
            color: "d73a4a"
            description: "Something isn't working"
        },
        {
            name: "documentation"
            color: "0075ca"
            description: "Improvements or additions to documentation"
        },
        {
            name: "duplicate"
            color: "cfd3d7"
            description: "This issue or pull request already exists"
        },
        {
            name: "enhancement"
            color: "a2eeef"
            description: "New feature or request"
        },
        {
            name: "good first issue"
            color: "7057ff"
            description: "Good for newcomers"
        },
        {
            name: "help wanted"
            color: "008672"
            description: "Extra attention is needed"
        },
        {
            name: "invalid"
            color: "e4e669"
            description: "This doesn't seem right"
        },
        {
            name: "question"
            color: "d876e3"
            description: "Further information is requested"
        },
        {
            name: "wontfix"
            color: "ffffff"
            description: "This will not be worked on"
        },
    ]
    features: {
        mergeCommit: false
        rebaseMerge: false
        squashMerge: true
        deleteBranchOnMerge: true
    }
}

// Required config metadata only during stage one. Continue using npm/Make
// for development: gh-flarebyte TypeScript commands require a Bun migration.
build: {
    language: "typescript"
    mode: "library"
    packages: ["./..."]
    runTests: false
}

// Version metadata only. The npm publishing workflow owns tags and releases.
release: {
    versionSource: "package.json"
    tagPrefix: "v"
    notesMode: "generate-notes"
    includeArtifacts: false
}
