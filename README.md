# EMT 116 — GitHub Pages update

Latest export: October 10, 2026; Sites version 47.
644 active questions, including four 2025 AHA BLS replacements.

## Update your existing site
1. Extract this ZIP. Upload its CONTENTS, with index.html at your existing publishing folder’s top level. Do not upload the ZIP itself or add an extra enclosing folder.
2. Check your repository Settings > Pages for the publishing branch and folder. For Deploy from a branch, it is either /(root) or /docs. Upload to that same location. Preserve your existing CNAME and unrelated repository files.
3. In that location, choose Add file > Upload files. Drag the extracted files and the questions and anatomy folders into the upload area. Preserve the folder structure.
4. Commit the replacement files to the publishing branch (or merge your pull request into it).
5. If configuring branch deployment, Settings > Pages > Source: Deploy from a branch; select your publishing branch and /(root) (or /docs, if you placed the files there), then Save. Existing custom Actions deployments can retain their workflow; replace the static files in its configured input folder.
6. Wait for the Pages deployment to finish in Actions, then refresh your existing site URL.

The .nojekyll file is included. If your file picker hides it, keep your existing .nojekyll or create an empty file with that name in the publishing folder.

## Verify
- Chapter 14 contains 71 active questions; all chapters total 644.
- The mock exam selects 100 questions.
- A&P diagrams load.
- Guessed and unanswered submissions count as incorrect.

This is a static site: no npm install or build is needed. Local preview requires a web server, not opening index.html directly.
Saved progress stays in the same browser at the same GitHub Pages origin. Progress from the separately hosted Sites URL does not automatically transfer.

Official instructions:
https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository
