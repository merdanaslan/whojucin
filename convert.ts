import bs58 from 'bs58';

const uint8Array = new Uint8Array([]);
const base58String = bs58.encode(uint8Array);

// Add these lines for better output
console.log("Base58 encoded private key:");
console.log("----------------------------------------");
console.log(base58String);
console.log("----------------------------------------");

// Also decode it back to verify it works
const decoded = bs58.decode(base58String);
console.log("\nVerification - decoded back to Uint8Array:");
console.log(Array.from(decoded));