#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const glob = require("glob");

const lintResults = [];

const rootPrefix = path.dirname(path.resolve("."));

let output = "status";
if (process.argv.length > 2) {
  output = process.argv[2];
}

let sha = null;
if (process.argv.length > 3) {
  sha = process.argv[3];
}

let repoUrl = null;
if (process.argv.length > 4) {
  repoUrl = process.argv[4];
}

glob("**/ktlint.json", async function (err, files) {
  // console.dir(files);
  for (let index = 0; index < files.length; index++) {
    try {
      const results = JSON.parse(fs.readFileSync(files[index]));
      for (let iindex = 0; iindex < results.length; iindex++) {
        lintResults.push(results[iindex]);
      }
    } catch (e) {}
  }

  if (output === "text") {
    outputText();
  } else if (output === "summary") {
    outputSummary();
  } else {
    if (lintResults.length > 0) {
      console.log(
        "ktlint findings detected, so returning a non-zero exit code"
      );
      process.exit(1);
    }
  }
});

function outputText() {
  let files = {};
  lintResults.forEach(function (finding) {
    const fileName = finding.file.replace(rootPrefix + "/", "");
    if (files[fileName] == null) {
      files[fileName] = {
        findings: [finding],
      };
    } else {
      files[fileName].findings.push(finding);
    }
  });

  Object.keys(files).forEach(function (key) {
    if (sha != null && repoUrl != null) {
      console.log(
        "### [" + key + "](" + repoUrl + "/blob/" + sha + "/" + key + ")"
      );
    } else {
      console.log("### " + key);
    }

    console.log(" ");
    console.log("Finding | Line | Description ");
    console.log("------- | ---- | ------------");

    files[key].findings.forEach(function (finding) {
      for (let index = 0; index < finding.errors.length; index++) {
        let error = finding.errors[index];
        let output = "";
        output += ":rotating_light: ";
        output += error.rule + " | ";
        if (sha != null && repoUrl != null) {
          output +=
            "[" +
            error.line +
            "](" +
            repoUrl +
            "/blob/" +
            sha +
            "/" +
            key +
            "#L" +
            error.line +
            ") | ";
          output +=
            "[" +
            error.message +
            "](" +
            repoUrl +
            "/blob/" +
            sha +
            "/" +
            key +
            "#L" +
            error.line +
            ") | ";
        } else {
          output += error.line + " | ";
          output += error.message;
        }
        console.log(output);
      }
    });
    console.log(" ");
  });
}

function outputSummary() {
  let warnings = 0;
  let errors = 0;
  lintResults.forEach(function (finding) {
    errors += finding.errors.length;
  });

  console.log("### Lint Summary:");
  console.log(" ");
  console.log("- :rotating_light: " + errors.toString() + " Error(s)");
}
