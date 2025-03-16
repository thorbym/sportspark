// A simple script to test basic functionality
const fs = require("fs")
const path = require("path")

console.log("=== DEBUG TEST SCRIPT STARTING ===")
console.log("Current working directory:", process.cwd())
console.log("Files in current directory:", fs.readdirSync("."))

// Test if we can write a simple file
try {
  fs.writeFileSync("test-file.txt", "This is a test file")
  console.log("Successfully wrote test-file.txt")
} catch (error) {
  console.error("Failed to write test file:", error)
}

// Test if puppeteer is installed correctly
try {
  console.log("Checking Puppeteer installation...")
  const puppeteer = require("puppeteer-extra")
  console.log("Puppeteer-extra loaded successfully")

  const StealthPlugin = require("puppeteer-extra-plugin-stealth")
  console.log("Stealth plugin loaded successfully")

  puppeteer.use(StealthPlugin())
  console.log("Stealth plugin applied")

  console.log("Puppeteer configuration looks good")
} catch (error) {
  console.error("Puppeteer check failed:", error)
}

// Check environment variables
console.log("Environment variables:")
console.log("- GYM_USERNAME set:", !!process.env.GYM_USERNAME)
console.log("- GYM_PASSWORD set:", !!process.env.GYM_PASSWORD)
console.log("- PUPPETEER_EXECUTABLE_PATH:", process.env.PUPPETEER_EXECUTABLE_PATH || "Not set")

console.log("=== DEBUG TEST SCRIPT COMPLETED ===")

