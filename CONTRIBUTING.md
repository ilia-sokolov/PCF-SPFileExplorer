# Contributing

## Build from source

You need [Node.js](https://nodejs.org/) 22 and, to create the solution package, the [.NET SDK](https://dotnet.microsoft.com/download) 8.

```bash
npm ci             # install dependencies
npm run build      # build the control into out/controls
npm start          # build and run the control with mock data in the local test harness
                   # (the harness, pcf-start, is downloaded on first use)

# build the managed solution into Solution/SPFileExplorerSolution/bin/Release
dotnet build Solution/SPFileExplorerSolution --configuration Release
```

The local test harness has no SharePoint, so it shows file icons instead of thumbnails, and the full preview cannot load.

## Add a language

Corrections from native speakers are welcome. To add a language:

1. Copy `SPFileExplorer/strings/SPFileExplorer.1033.resx` to `SPFileExplorer.<LCID>.resx`.
2. Translate the values.
3. Add the file to the `resources` element of `SPFileExplorer/ControlManifest.Input.xml`.

Languages without a resource file fall back to English.

## Release process

The packaged solution (`Solution/SPFullFileExplorer.zip`) is built and updated automatically by the [Build solution](/.github/workflows/build-solution.yml) GitHub Actions workflow:

1. Increase the `version` of the control in `SPFileExplorer/ControlManifest.Input.xml` (e.g. `0.0.3` → `0.0.4`) and add the changes to the [changelog](/CHANGELOG.md). Dataverse applies an updated control only if its version is higher than the installed one.
2. Merge the changes into `master`.
3. The workflow builds the managed solution and commits the updated `Solution/SPFullFileExplorer.zip` to `master`.

The solution version is derived from the control version: `<major>.<minor>` from `Solution/SPFileExplorerSolution/src/Other/Solution.xml`, followed by `<control major × 100 + control minor>.<control patch>` (e.g. control `0.0.4` → solution `1.1.0.4`).

If the control version was not increased, the package is built but not committed. A lower control version than the packaged one fails the build. Every push to any branch and every pull request is linted and built as well, and the resulting package can be downloaded from the workflow run artifacts for testing.

The workflow commits with the `GITHUB_TOKEN`. If the commit is rejected, allow GitHub Actions to write to the repository (**Settings** → **Actions** → **General** → **Workflow permissions**) and make sure `master` is not protected against pushes from GitHub Actions.
