# Run this in the project and when done move the directory to ./testResult

for i in {1..100}
do
  yarn jest --json --outputFile=../testResultJson/$i.json
done
