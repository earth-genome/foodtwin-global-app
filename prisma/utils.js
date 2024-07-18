/* eslint-disable @typescript-eslint/no-var-requires */
const readline = require("readline");

const askQuestion = (question) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase());
    });
  });
};

module.exports = {
  askQuestion,
};
