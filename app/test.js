// The most basic openwhisk action possible
// For debugging openwhisk actions in general
function main() {
  return { body: process.env };
}
exports.main = main;
