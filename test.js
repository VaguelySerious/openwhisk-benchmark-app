// The most basic openwhisk action possible
// For debugging openwhisk actions in general
function main() {
  return { env: process.env };
}
exports.main = main;
