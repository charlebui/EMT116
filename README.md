# EMT 116

Static, GitHub Pages-ready course exam practice. No build or dependency installation required.

## Publish

1. Extract this ZIP.
2. Upload the extracted contents to your GitHub repository and commit them to `main`. Place `index.html` directly at the repository root; do not upload the ZIP itself or put everything inside an extra folder. Include the `questions` folder and `.nojekyll` file.
3. Open repository **Settings → Pages**.
4. Select **Deploy from a branch**, choose **main** and **/(root)**, then **Save**.
5. Once deployment completes, open the site address shown on that page. For a project repository it is usually `https://USERNAME.github.io/REPOSITORY/`.

GitHub Free supports Pages from public repositories. Other plans also support private repositories; Pages site visibility is configured separately.

Official publishing instructions: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## Included behavior

- 681 active multiple-choice questions across 12 chapters, including 36 multiple-choice fill-in-the-blank questions.
- Chapter practice: up to 10 questions per set, without repeats until the chapter pool is answered.
- Comprehensive: 50 questions across chapters; questions may repeat between exams.
- Missed-question practice and correct/incorrect/unanswered dashboard.
- Objective coverage uses distinct current-version questions answered / available. Repeated attempts do not inflate coverage.

Question content uses the supplied class material. Original class documents are not bundled. Archived questions remain in the data to support historical results.

## Progress

Progress is saved in this browser for this website address. It does not automatically transfer from the earlier hosted site to GitHub Pages or between browsers/devices. Clearing browser site data removes saved progress.

## Development

All runtime files are at the repository root, with banks in `questions/`. No server backend, account setup, or API keys are required. To run the included logic checks with Node.js installed, run `npm test`. Serve the folder over HTTP for local use; opening `index.html` through a file URL will not load the question banks correctly.

This package preserves the current site behavior. Automated checks cover grading, selection, history, and objective coverage; they do not replace an end-to-end browser check after deployment. Course-based practice is not independently verified or NREMT endorsed.

## A&P matching

Open A&P matching from the navigation. The 13 supplied worksheet diagrams contain 141 labeled parts. Check matches to see descriptions of location or function, and retry missed labels. Matching evidence is separate from MCQ exam coverage and is stored in the current browser.

## Diagram assets

Six generated assets redraw 11 matching diagrams from the supplied class photos on white backgrounds. Male and female reproductive systems use separate source-guided SVG schematics with front and side views. Original photos are available through a comparison link. Redraw provenance and prompts are in docs/.
