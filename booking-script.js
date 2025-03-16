const puppeteer = require("puppeteer-extra")
const StealthPlugin = require("puppeteer-extra-plugin-stealth")

// Add stealth plugin to avoid detection
puppeteer.use(StealthPlugin())

async function bookGymSession() {
  // Launch a visible browser with additional arguments to reduce detection
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-infobars",
      "--window-position=0,0",
      "--ignore-certificate-errors",
      "--ignore-certificate-errors-spki-list",
      '--user-agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"',
    ],
  })

  console.log("Browser launched")

  try {
    const page = await browser.newPage()

    // Set extra headers to appear more like a real browser
    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
      "Accept-Encoding": "gzip, deflate, br",
    })

    // Randomize viewport size slightly to avoid fingerprinting
    await page.setViewport({
      width: 1920 + Math.floor(Math.random() * 100),
      height: 1080 + Math.floor(Math.random() * 100),
      deviceScaleFactor: 1,
      hasTouch: false,
      isLandscape: true,
      isMobile: false,
    })

    console.log("Navigating to login page...")
    await page.goto("https://sportspark.leisurecloud.net/Connect/mrmlogin.aspx", {
      waitUntil: "networkidle2",
      timeout: 60000,
    })

    // Wait a bit to let any Cloudflare challenges complete
    await page.waitForTimeout(5000)

    // Check if we're on a Cloudflare challenge page
    const cloudflareDetected = await page.evaluate(() => {
      return document.body.innerHTML.includes("Cloudflare") || document.body.innerHTML.includes("security check")
    })

    if (cloudflareDetected) {
      console.log("Cloudflare detected, waiting longer...")
      // Wait longer for Cloudflare to clear
      await page.waitForTimeout(10000)
    }

    console.log("Checking if login form is available...")

    // Check if we can find the login form
    const loginFormExists = await page.evaluate(() => {
      return !!document.getElementById("ctl00_MainContent_InputLogin")
    })

    if (!loginFormExists) {
      throw new Error("Login form not found. Cloudflare might be blocking access.")
    }

    console.log("Entering login credentials...")

    // Get credentials from environment variables
    const username = process.env.GYM_USERNAME
    const password = process.env.GYM_PASSWORD

    if (!username || !password) {
      throw new Error("Credentials not found in environment variables")
    }

    // Type credentials with random delays to appear more human-like
    await page.type("#ctl00_MainContent_InputLogin", username, { delay: 100 + Math.floor(Math.random() * 50) })
    await page.type("#ctl00_MainContent_InputPassword", password, { delay: 150 + Math.floor(Math.random() * 50) })

    // Small delay before clicking login
    await page.waitForTimeout(1000 + Math.floor(Math.random() * 1000))

    console.log("Clicking login button...")
    await Promise.all([
      page.click("#ctl00_MainContent_btnLogin"),
      page.waitForNavigation({ waitUntil: "networkidle2", timeout: 60000 }),
    ])

    // Check if login was successful
    const loginSuccessful = await page.evaluate(() => {
      return !document.body.innerHTML.includes("Invalid login details")
    })

    if (!loginSuccessful) {
      throw new Error("Login failed. Check your credentials.")
    }

    console.log("Login successful! Navigating to booking page...")

    // Navigate to the booking page (you'll need to find the correct URL)
    await page.goto("https://sportspark.leisurecloud.net/Connect/mrmbooking.aspx", {
      waitUntil: "networkidle2",
      timeout: 60000,
    })

    console.log("On booking page, looking for available sessions...")

    // Here you would add the specific logic to:
    // 1. Find the session you want to book
    // 2. Click on it
    // 3. Complete the booking process

    // This is placeholder code - you'll need to inspect the actual page to find the correct selectors
    // Example: Find a session by its text content
    const sessionSelector = await page.evaluate(() => {
      // Look for elements containing the session name
      const elements = Array.from(document.querySelectorAll("a, button, div"))
      const sessionElement = elements.find((el) => el.textContent.includes("Your Session Name"))
      return sessionElement ? sessionElement.id || sessionElement.className : null
    })

    if (!sessionSelector) {
      throw new Error("Session not found on booking page")
    }

    console.log(`Found session with selector: ${sessionSelector}, attempting to book...`)

    // Click on the session
    await page.click(`#${sessionSelector}`)

    // Wait for booking confirmation page
    await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 })

    // Confirm booking (if needed)
    const confirmButtonExists = await page.evaluate(() => {
      return !!document.querySelector('button[type="submit"]')
    })

    if (confirmButtonExists) {
      console.log("Confirming booking...")
      await Promise.all([
        page.click('button[type="submit"]'),
        page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 }),
      ])
    }

    // Check if booking was successful
    const bookingSuccessful = await page.evaluate(() => {
      return document.body.innerHTML.includes("successfully booked") || document.body.innerHTML.includes("confirmation")
    })

    if (bookingSuccessful) {
      console.log("Session booked successfully!")
    } else {
      console.log("Booking may have failed. Please check your account manually.")
    }

    // Take a screenshot for verification
    await page.screenshot({ path: "booking-result.png" })

    return "Booking process completed"
  } catch (error) {
    console.error("Error during booking process:", error)

    // Take error screenshot
    if (browser) {
      const page = (await browser.pages())[0]
      if (page) {
        await page.screenshot({ path: "error-screenshot.png" })
      }
    }

    throw error
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

// Run the booking function
bookGymSession()
  .then((result) => {
    console.log("Script completed:", result)
    process.exit(0)
  })
  .catch((error) => {
    console.error("Script failed:", error)
    process.exit(1)
  })

