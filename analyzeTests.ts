var fs = require('fs');
var files = fs.readdirSync('./testResult/testResultJson/');

const result = {
  totalRuns: 0,
  totalFailedRuns: 0,
  totalFailedTests: 0,
  leastAmountOfFailedTests: undefined,
  biggestAmountOfFailedTests: undefined,
  totalFailedTestsPerRun: {},
  averageFailingTestsPerRun: 0,
  mostCommonReasonOfFailing: "",
  allFailingTests: {},
  totalFailedSnapshotsPerRun: {},
}

result.totalRuns = files.length;

files.forEach((file) => {
  const testResult = JSON.parse(fs.readFileSync(`./testResultJson/${file}`));
  const runNumber = file.replace('.json', '');
  if (!testResult.success) {
    // Standard info
    result.totalFailedRuns += 1;
    result.totalFailedTests += testResult.numFailedTests;
    result.totalFailedTestsPerRun[runNumber] = testResult.numFailedTests;

    // Least and biggest amount of failing tests
    if (!result.leastAmountOfFailedTests) {
      result.leastAmountOfFailedTests = testResult.numFailedTests;
      result.biggestAmountOfFailedTests = testResult.numFailedTests;
    } else {
      if (testResult.numFailedTests < result.leastAmountOfFailedTests) result.leastAmountOfFailedTests = testResult.numFailedTests;
      else if (testResult.numFailedTests > result.biggestAmountOfFailedTests) result.biggestAmountOfFailedTests = testResult.numFailedTests;
    }

    // Gather all the errors
    result.allFailingTests[runNumber] = {};
    testResult.testResults.forEach(testSuite => {
      if (testSuite.status !== "passed") {
        const testSuiteName = testSuite.assertionResults[0].ancestorTitles[0];
        const failedTestResults = {};

        testSuite.assertionResults.forEach(singleTest => {
          
          if (singleTest.status === "failed") {
            failedTestResults[singleTest.title] = singleTest.failureMessages;
          }
        });
        result.allFailingTests[runNumber][testSuiteName] = failedTestResults;
      }
    });

    // Snapshots
    result.totalFailedSnapshotsPerRun[runNumber] = testResult.snapshot.filesUnmatched;
  }
});

const avg = (result.totalFailedTests / result.totalFailedRuns) || 0;
result.averageFailingTestsPerRun = avg;

console.log(result);
fs.writeFile("resultAnalysis.json", JSON.stringify(result), function(err) {
  if (err) {
      console.log(err);
  }
});
