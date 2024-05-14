export default function generateLoremIpsum(wordCount: number): string {
  const loremIpsum =
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";

  // Split the default Lorem Ipsum text into an array of words
  const words = loremIpsum.split(" ");

  // Create an array to hold the words for the generated Lorem Ipsum
  let generatedText = [];

  // Loop through the number of words requested
  for (let i = 0; i < wordCount; i++) {
    // Select a random word from the words array
    const randomIndex = Math.floor(Math.random() * words.length);
    generatedText.push(words[randomIndex]);
  }

  // Join the array of words back into a single string with spaces
  let finalText = generatedText.join(" ");

  // Ensure the first character is uppercase
  return finalText.charAt(0).toUpperCase() + finalText.slice(1);
}
