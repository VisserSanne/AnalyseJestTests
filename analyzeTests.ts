var fs = require('fs');
var files = fs.readdirSync('./testResult/testResultJson/');

const result = {
  totalRuns: 0,
  totalFailedRuns: 0,
  totalFailedTests: 0,
  leastAmountOfFailedTests: 0,
  biggestAmountOfFailedTests: 0,
  totalFailedTestsPerRun: {} as Record<number, number>,
  averageFailingTestsPerRun: 0,
  mostCommonReasonOfFailing: {} as Record<ErrorReason, number>,
  allFailingTests: {} as Record<number, Record<string, Record<string, string>>>,
  totalFailedSnapshotsPerRun: {} as Record<number, number>,
  reasonsPerTest: {} as Record<string, {reasons: Record<ErrorReason, number>}>,
}

interface AssertionResult {
  ancestorTitles: string[],
  failureMessages: string[],
  fullName: string,
  location: any,
  status: string,
  title: string,
}

interface SingleTestResult {
  assertionResults: AssertionResult[],
  endTime: number,
  message: string,
  name: string,
  startTime: number,
  status: string,
  summary: string,
}

interface SnapShot {
  added: number,
  didUpdate: boolean,
  failure: boolean,
  filesAdded: number,
  filesRemoved: number,
  filesRemovedList: any[],
  filesUnmatched: number,
  filesUpdated: number,
  matched: number,
  total: number,
  unchecked: number,
  uncheckedKeysByFile: any[],
  unmatched: number,
  updated: number,
}

interface TestResult {
  numFailedTestSuites: number,
  numFailedTests: number,
  numPassedTestSuites: number,
  numPassedTests: number,
  numPendingTestSuites: number,
  numPendingTests: number,
  numRuntimeErrorTestSuites: number,
  numTodoTests: number,
  numTotalTestSuites: number,
  numTotalTests: number,
  openHandles: any[],
  snapshot: SnapShot,
  startTime: number,
  success: boolean,
  testResults: SingleTestResult[],
  wasInterrupted: boolean,
}

// Functions to analyze result

// Set standard data
const setStandardData = (runNumber: number, numFailedTests: number) => {
    result.totalFailedRuns += 1;
    result.totalFailedTests += numFailedTests;
    result.totalFailedTestsPerRun[runNumber] = numFailedTests;
}

// Least and biggest amount of failing tests
const setLeastAndBiggestAmountFailingResults = (numFailedTests: number) => {
  if (result.totalFailedRuns === result.totalRuns) {
    const currentLeastAmount = result.leastAmountOfFailedTests;
    if (currentLeastAmount === 0 || numFailedTests < currentLeastAmount) result.leastAmountOfFailedTests = numFailedTests;
  }

  if (numFailedTests > result.biggestAmountOfFailedTests) result.biggestAmountOfFailedTests = numFailedTests;
}

// Gather errordata
const setStandardErrorData = (runNumber: number, testResults: SingleTestResult[]) => {
  result.allFailingTests[runNumber] = {};
  testResults.forEach((testSuite) => {
    if (testSuite.status !== "passed") {
      const testSuiteName = testSuite.assertionResults[0].ancestorTitles[0];
      const failedTestResults = {} as Record<string, string>;

      testSuite.assertionResults.forEach((singleAssertion) => {
        if (singleAssertion.status === "failed") {
          failedTestResults[singleAssertion.title] = singleAssertion.failureMessages[0];
          setErrorReason(singleAssertion.title, singleAssertion.failureMessages[0]);
          setGeneralMostCommonErrorReason(singleAssertion.failureMessages[0]);
        }
      });
      result.allFailingTests[runNumber][testSuiteName] = failedTestResults;
    }
  });
}

enum ErrorReason {
  ExceededTimeout = "ExceededTimeout",
  ToMatch = "ToMatch",
  ToEqual = "ToEqual",
  UnableToFind = "UnableToFind",
  ToHaveBeenCalled = "ToHaveBeenCalled",
  MultipleElements = "MultipleElements",
}


const setErrorReason = (title: string, errorMessage: string) => {
  if (!result.reasonsPerTest[title]) {
    result.reasonsPerTest[title] = {} as {reasons: Record<ErrorReason, number>};
    result.reasonsPerTest[title].reasons = {} as Record<ErrorReason, number>;
  }

  if (errorMessage.includes("Exceeded timeout")) {
    const current = result.reasonsPerTest[title].reasons[ErrorReason.ExceededTimeout];
    result.reasonsPerTest[title].reasons[ErrorReason.ExceededTimeout] = current ? current + 1 : 1;
  }
  else if (errorMessage.includes("toMatch")) {
    const current = result.reasonsPerTest[title].reasons[ErrorReason.ToMatch];
    result.reasonsPerTest[title].reasons[ErrorReason.ToMatch] = current ? current + 1 : 1;
  }
  else if (errorMessage.includes("toEqual")) {
    const current = result.reasonsPerTest[title].reasons[ErrorReason.ToEqual];
    result.reasonsPerTest[title].reasons[ErrorReason.ToEqual]  = current ? current + 1 : 1;
  }
  else if (errorMessage.includes("Unable to find")) {
    const current = result.reasonsPerTest[title].reasons[ErrorReason.UnableToFind];
    result.reasonsPerTest[title].reasons[ErrorReason.UnableToFind] = current ? current + 1 : 1;
  }
  else if (errorMessage.includes("toHaveBeenCalled")) {
    const current = result.reasonsPerTest[title].reasons[ErrorReason.ToHaveBeenCalled];
    result.reasonsPerTest[title].reasons[ErrorReason.ToHaveBeenCalled] = current ? current + 1 : 1;
  }
  else if (errorMessage.includes("Found multiple elements")) {
    const current = result.reasonsPerTest[title].reasons[ErrorReason.MultipleElements];
    result.reasonsPerTest[title].reasons[ErrorReason.MultipleElements] = current ? current + 1 : 1;
  }
}

const setGeneralMostCommonErrorReason = (errorMessage: string) => {
  if (errorMessage.includes("Exceeded timeout")) {
    const current = result.mostCommonReasonOfFailing[ErrorReason.ExceededTimeout];
    result.mostCommonReasonOfFailing[ErrorReason.ExceededTimeout] = current ? current + 1 : 1;
  }
  else if (errorMessage.includes("toMatch")) {
    const current = result.mostCommonReasonOfFailing[ErrorReason.ToMatch];
    result.mostCommonReasonOfFailing[ErrorReason.ToMatch] = current ? current + 1 : 1;
  }
  else if (errorMessage.includes("toEqual")) {
    const current = result.mostCommonReasonOfFailing[ErrorReason.ToEqual];
    result.mostCommonReasonOfFailing[ErrorReason.ToEqual]  = current ? current + 1 : 1;
  }
  else if (errorMessage.includes("Unable to find")) {
    const current = result.mostCommonReasonOfFailing[ErrorReason.UnableToFind];
    result.mostCommonReasonOfFailing[ErrorReason.UnableToFind] = current ? current + 1 : 1;
  }
  else if (errorMessage.includes("toHaveBeenCalled")) {
    const current = result.mostCommonReasonOfFailing[ErrorReason.ToHaveBeenCalled];
    result.mostCommonReasonOfFailing[ErrorReason.ToHaveBeenCalled] = current ? current + 1 : 1;
  }
  else if (errorMessage.includes("Found multiple elements")) {
    const current = result.mostCommonReasonOfFailing[ErrorReason.MultipleElements];
    result.mostCommonReasonOfFailing[ErrorReason.MultipleElements] = current ? current + 1 : 1;
  }
}

// "Exceeded timeout"
// "Found multiple elements with the text"

// "toHaveBeenCalledTimes"
// "toHaveBeenCalledWith"

// "Unable to find an accessible element with the role"
// "Unable to find role"
// "Unable to find an element"||"Unable to find an element with the text"

// "toEqual"||"deep equality"

// "toMatch" // (get the 10 characters after this)
// "toMatchSnapshot"


// Analyze all the data

result.totalRuns = files.length;

files.forEach((file: string) => {
  const testResult = JSON.parse(fs.readFileSync(`./testResult/testResultJson/${file}`));
  const runNumber = parseInt(file.replace('.json', ''));
  if (!testResult.success) {
    setStandardData(runNumber, testResult.numFailedTests);

    setLeastAndBiggestAmountFailingResults(testResult.numFailedTests);

    setStandardErrorData(runNumber, testResult.testResults);

    // Snapshots
    result.totalFailedSnapshotsPerRun[runNumber] = testResult.snapshot.filesUnmatched;
  }
});

// Set averages
const avg = (result.totalFailedTests / result.totalFailedRuns) || 0;
result.averageFailingTestsPerRun = avg;


// Write result to file
fs.writeFile("resultAnalysis.json", JSON.stringify(result), function(err: Error) {
  if (err) {
      console.log(err);
  }
});
