import {getInputs} from "./inputs.js";

// Percentage weights based on rough analysis found here:
// https://github.com/sc0tfree/morsewalker/issues/8#issuecomment-2585349244
const US_CALLSIGN_PREFIXES_WEIGHTED = [
    // Large items
  { value: 'K', weight: 730 },  // ~73.0%
  { value: 'W', weight: 138 },  // ~13.8%
  { value: 'N', weight: 106 },  // ~10.6%

  // Smaller items
  { value: 'AA', weight: 4 },   // ~0.4%
  { value: 'AB', weight: 4 },   // ~0.4%
  { value: 'AC', weight: 4 },   // ~0.4%
  { value: 'AD', weight: 3 },   // ~0.3%
  { value: 'AE', weight: 2 },   // ~0.2%
  { value: 'AF', weight: 2 },   // ~0.2%
  { value: 'AG', weight: 2 },   // ~0.2%
  { value: 'AH', weight: 1 },   // ~0.1%
  { value: 'AI', weight: 2 },   // ~0.2%
  { value: 'AJ', weight: 1 },   // ~0.1%
  { value: 'AK', weight: 1 },   // ~0.1%
  { value: 'AL', weight: 0 },   //  0.0% (won’t ever be chosen)
]

const NON_US_CALLSIGN_PREFIXES = [
  '9A', 'CT', 'DL', 'E', 'EA', 'EI', 'ES', 'EU', 'F', 'G',
  'GM', 'GW', 'HA', 'HB', 'I', 'JA', 'LA', 'LU', 'LY', 'LZ',
  'OE', 'OH', 'OK', 'OM', 'ON', 'OZ', 'PA', 'PY', 'S', 'SM',
  'SP', 'SV', 'UA', 'UR', 'VE', 'VK', 'YO', 'YT'
];
const stateAbbreviations = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];
const names = [
  "Adam", "Ahmed", "Ali", "Amanda", "Amy", "Ana", "Andrew", "Angela", "Anna", "Anthony",
  "Aria", "Ashley", "Barbara", "Benjamin", "Brandon", "Brian", "Charles", "Christopher", "Cynthia", "Daniel",
  "David", "Deborah", "Dennis", "Donna", "Dorothy", "Edward", "Elena", "Elizabeth", "Emily", "Eric",
  "Fatima", "Frank", "George", "Gregory", "Heather", "Henry", "Hong", "Jack", "Jacob", "James",
  "Jason", "Jeffrey", "Jennifer", "Jessica", "John", "Jonathan", "Joseph", "Joshua", "Justin", "Karen",
  "Katherine", "Kathleen", "Kevin", "Kimberly", "Larry", "Laura", "Linda", "Lisa", "Maria", "Margaret",
  "Mark", "Mary", "Matthew", "Melissa", "Michael", "Michelle", "Mohammad", "Nancy", "Nicole", "Nicholas",
  "Noor", "Patricia", "Patrick", "Paul", "Peter", "Rebecca", "Richard", "Robert", "Ronald", "Ryan",
  "Sandra", "Sarah", "Scott", "Shirley", "Sofia", "Stephanie", "Stephen", "Steven", "Susan", "Thomas",
  "Timothy", "Tyler", "Wei", "William", "Yan"
];

/**
 * Retrieves the current user's station configuration.
 *
 * This function pulls data from the `getInputs` module to retrieve user-specific
 * parameters like callsign, speed (WPM), volume, sidetone frequency, and name.
 * If no inputs are available, it returns `null`. It also sets default values
 * for `player` and `qsb`.
 *
 * @returns {Object|null} The user's station configuration or null if inputs are unavailable.
 */
export function getYourStation() {

  let inputs = getInputs();
  if (inputs === null) return;

  return {
    callsign: inputs.yourCallsign,
    wpm: inputs.yourSpeed,
    volume: inputs.yourVolume,
    frequency: inputs.yourSidetone,
    name: inputs.yourName,
    state: inputs.yourState,
    player: null,
    qsb: false
  }
}


/**
 * Generates a random calling station configuration.
 *
 * Uses `getInputs` to pull user-defined constraints like speed, volume, and tone ranges.
 * Determines if the station is US-based or international with a 40% likelihood for US stations
 * (unless `usOnly` is true). The station's attributes, including callsign, name, state,
 * serial number, and CWOPS number, are randomly generated within the specified constraints.
 * Additionally, introduces optional QSB (fading) parameters like frequency and depth.
 *
 * @returns {Object|null} The calling station configuration or null if inputs are unavailable.
 */
export function getCallingStation() {

  let inputs = getInputs();
  if (inputs === null) return;

  // determine if it's a US station
  let isUS = inputs.usOnly ? true : Math.random() < 0.4;

  return {
    callsign: isUS ? getRandomUSCallsign(inputs.formats) : getRandomNonUSCallsign(inputs.formats),
    wpm: Math.floor(Math.random() * (inputs.maxSpeed - inputs.minSpeed + 1)) + inputs.minSpeed,
    volume: Math.random() * (inputs.maxVolume - inputs.minVolume) + inputs.minVolume,
    frequency: Math.floor(Math.random() * (inputs.maxTone - inputs.minTone) + inputs.minTone),
    name: randomElement(names),
    state: isUS ? randomElement(stateAbbreviations) : "",
    serialNumber: Math.floor(Math.random() * 30) + 1,
    cwopsNumber: Math.floor(Math.random() * 4000) + 1,
    player: null,
    qsb: inputs.qsb ? Math.random() < inputs.qsbPercentage / 100 : false,
    // QSB frequency range: 0.05 to 0.5
    qsbFrequency: Math.random() * 0.45 + 0.05,
    // QSB depth range: 0.6 to 1.0
    qsbDepth: Math.random() * 0.4 + 0.6,
  }
}
/**
 * Handles Super Check partial for callsign selection
 */

function parseMASTERSCP() {
  // This is the callback function, called by get_MASTERSCP() upon "load"
  let content = this.responseText;

  CALLSIGNS = content.split(/\r?\n/);   // split the text into array elements
                                        // on the basis of \r and \n
  CALLSIGNS.splice(0,4);                // The first 4 elements are discarded.

} // end parseMASTERSCP()


// From https://onlinewebtutorblog.com/how-to-read-a-file-from-server-using-javascript/
function getMASTERSCP() {
  // Creates a http request of type GET and downloads the MASTER.SCP
    let xmlhttp;

    xmlhttp = new XMLHttpRequest();
    xmlhttp.addEventListener("load", parseMASTERSCP);  // callback function

    // The file to download is hard-coded below.
    xmlhttp.open("GET", "Libs/MASTER.SCP", true);
    xmlhttp.send();
} // end getMASTERSCP()

function getUSCallsign(formats) {
  const matches = [];
  const format = randomElement(formats);
  switch (format) {
    case '1x1':
      const pattern = /^[KNW][0-9][A-Z]{1}$/img;
    case '1x2':
      const pattern = /^[KNW][0-9][A-Z]{2}$/img;
    case '1x3':
      const pattern = /^[KNW][0-9][A-Z]{3}$/img;
    case '2x1':
      const pattern = /^([KNW][A-Z]|A[A-L])[0-9][A-Z]$/img;
    case '2x2':
      const pattern = /^([KNW][A-Z]|A[A-L])[0-9][A-Z]{2}$/img;
    case '2x3':
      const pattern = /^[KNW][A-Z][0-9][A-Z]{3}$/img;
    default:
      const pattern = /^[KNW][0-9][A-Z]{3}$/img; // Defaults to '1x3'
  }
  CALLSIGNS.forEach(element => {
    if (pattern.test(element)) matches.push(element);
  });
  //return a random US callsign from MASTER.SCP
  return matches[Math.round(Math.random() * matches.length)];
}

/**
 * Generates a random US amateur radio callsign.
 *
 * Based on the provided format (e.g., '1x1', '2x3'), this function builds a valid US callsign
 * by combining a prefix, a digit, and a random sequence of letters. Defaults to a '1x3' format
 * if an unknown format is passed. Utilizes predefined US callsign prefixes.
 *
 * @param {string[]} formats - An array of valid callsign formats.
 * @returns {string} A randomly generated US callsign.
 */
function getRandomUSCallsign(formats) {
  const format = randomElement(formats);
  const number = randomDigit();

  // If it’s a 1× format (1x1, 1x2, 1x3), we only want one-letter prefixes
  let possiblePrefixes;
  if (format.startsWith('1x')) {
    possiblePrefixes = US_CALLSIGN_PREFIXES_WEIGHTED.filter(item => item.value.length === 1);
  } else {
    possiblePrefixes = US_CALLSIGN_PREFIXES_WEIGHTED;
  }

  const prefix = weightedRandomElement(possiblePrefixes);

  switch (format) {
    case '1x1':
      return `${prefix}${number}${generateRandomLetters(1)}`;
    case '1x2':
      return `${prefix}${number}${generateRandomLetters(2)}`;
    case '1x3':
      return `${prefix}${number}${generateRandomLetters(3)}`;
    case '2x1':
      return `${prefix}${generateRandomLetters(1)}${number}${generateRandomLetters(1)}`;
    case '2x2':
      return `${prefix}${generateRandomLetters(1)}${number}${generateRandomLetters(2)}`;
    case '2x3':
      return `${prefix}${generateRandomLetters(1)}${number}${generateRandomLetters(3)}`;
    default:
      return `${prefix}${number}${generateRandomLetters(3)}`; // Default to '1x3'
  }
}

function getAllCallsigns() {
  return CALLSIGNS[Math.round(Math.random() * CALLSIGNS.length)];
}

/**
 * Generates a random non-US amateur radio callsign.
 *
 * Combines a random international prefix with a digit and a sequence of letters
 * according to the specified format. Ensures compatibility between prefix length
 * and format requirements. Retries until a valid combination is found for prefixes
 * and formats. Leverages predefined international prefixes.
 *
 * @param {string[]} formats - An array of valid callsign formats.
 * @returns {string} A randomly generated non-US callsign.
 */
function getRandomNonUSCallsign(formats) {
  let prefix, format;
  do {
    prefix = randomElement(NON_US_CALLSIGN_PREFIXES);
    format = randomElement(formats);
  } while (format.startsWith('1x') && prefix.length !== 1);

  const number = randomDigit();
  const lettersBeforeNumber = format.startsWith('2x') ? 2 - prefix.length : 0;
  const lettersAfterNumber = parseInt(format.slice(-1));

  return `${prefix}${generateRandomLetters(lettersBeforeNumber)}${number}${generateRandomLetters(lettersAfterNumber)}`;
}

/**
 * Creates a random sequence of letters.
 *
 * Utilizes the English alphabet to generate a string of random uppercase letters
 * with the specified length.
 *
 * @param {number} length - The number of letters to generate.
 * @returns {string} A string of random uppercase letters.
 */
function generateRandomLetters(length) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return Array.from({length}, () => randomElement(alphabet)).join('');
}

/**
 * Selects a random element from an array.
 *
 * Picks and returns one random element from the given array using a uniform distribution.
 *
 * @param {Array} array - The array to select a random element from.
 * @returns {*} A random element from the array.
 */
function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Selects a random element from an array using weighted values.
 *
 * Each object in the array should have:
 *   - value:  the item you want to pick
 *   - weight: the numeric weight (or percentage) of that item
 *
 * Example usage:
 * ```js
 * const fruits = [
 *   { value: 'apple',  weight: 50 }, // 50% chance
 *   { value: 'banana', weight: 30 }, // 30% chance
 *   { value: 'mango',  weight: 20 }, // 20% chance
 * ];
 *
 * const pickedFruit = weightedRandomElement(fruits);
 * console.log(pickedFruit); // Logs 'apple', 'banana', or 'mango' based on weights
 * ```
 *
 * @param {Array} weightedArray - The array of objects to select from.
 * @returns {*} A random element's `value` from the array, based on the weights.
 */
function weightedRandomElement(weightedArray) {
  // Sum all weights
  const totalWeight = weightedArray.reduce((sum, item) => sum + item.weight, 0);

  // Pick a random number between 0 and totalWeight
  let randomValue = Math.random() * totalWeight;

  // Determine which item is 'hit' by randomValue
  for (const item of weightedArray) {
    randomValue -= item.weight;
    if (randomValue <= 0) {
      return item.value;
    }
  }

  // Fallback (should not happen if weights are set up correctly)
  return null;
}

/**
 * Generates a random single-digit number.
 *
 * Returns a random integer between 0 and 9 inclusive.
 *
 * @returns {number} A random single-digit number.
 */
function randomDigit() {
  return Math.floor(Math.random() * 10);
}

// // Test cases for each callsign type individually
// const formats = ['1x1', '1x2', '1x3', '2x1', '2x2', '2x3'];
//
// console.log("---- US Callsigns (Individual Formats) ----");
// for (const format of formats) {
//   console.log(`US Callsign with format '${format}':`);
//   getRandomCallsign(true, [format]);
// }
//
// console.log("\n---- Non-US Callsigns (Individual Formats) ----");
// for (const format of formats) {
//   console.log(`Non-US Callsign with format '${format}':`);
//   getRandomCallsign(false, [format]);
// }
//
// // Test cases with multiple formats
// const multipleFormats = ['1x1', '2x2', '1x3'];
//
// console.log("\n---- US Callsign with Multiple Formats ----");
// for (let i = 0; i < 10; i++) {
//   getRandomCallsign(true, formats);
// }
//
// // Test cases to demonstrate the 40% US and 60% Non-US chance when usOnly is false
// console.log("\n---- Random Callsigns with 40% US and 60% Non-US ----");
// for (let i = 0; i < 10; i++) {
//   getRandomCallsign(false, formats);
// }
