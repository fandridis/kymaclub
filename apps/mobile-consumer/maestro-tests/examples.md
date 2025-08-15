# ================================
# COMPREHENSIVE MAESTRO TEST SUITE
# ================================
# This example demonstrates all major Maestro capabilities
# Replace 'com.example.app' with your actual bundle ID

appId: com.example.app

# Environment variables can be passed and used throughout the test
env:
  TEST_EMAIL: "test@example.com"
  TEST_PASSWORD: "SecurePass123"
  API_TIMEOUT: 5000

# Tags help organize and filter tests
tags:
  - smoke
  - critical
  - login

---

# ================================
# 1. APP LAUNCH & INITIAL STATE
# ================================

# Launch the app (always start with this)
- launchApp

# Wait for app to fully load (good practice for slower apps)
- waitForAnimationToEnd

# Take a screenshot for documentation/debugging
- takeScreenshot: "screenshots/01-app-launch.png"

# Assert the app launched correctly
- assertVisible: "Welcome to MyApp"
- assertVisible: 
    text: "Get Started"
    timeout: 3000  # Wait up to 3 seconds for element

# ================================
# 2. NAVIGATION TESTING
# ================================

# Basic tap interactions
- tapOn: "Get Started"
- assertVisible: "Choose Your Plan"

# Tap using coordinates (useful when text/ID isn't reliable)
- tapOn:
    point: "50%,80%"  # Center horizontally, 80% down vertically

# Tap using test IDs (most reliable method)
- tapOn:
    id: "premium-plan-button"

# Navigate back
- back
- assertVisible: "Choose Your Plan"

# Swipe gestures for navigation
- swipe:
    direction: LEFT
    duration: 500  # milliseconds
- assertVisible: "Plan Details"

- swipe:
    direction: RIGHT
- assertVisible: "Choose Your Plan"

# ================================
# 3. FORM INTERACTIONS & INPUT
# ================================

- tapOn: "Sign Up"
- assertVisible: "Create Account"

# Text input using environment variables
- tapOn:
    id: "email-input"
- inputText: "${TEST_EMAIL}"

# Clear field and input new text
- tapOn:
    id: "password-input"
- clearText
- inputText: "${TEST_PASSWORD}"

# Input with specific element targeting
- inputText:
    text: "John Doe"
    id: "full-name-input"

# Special key presses
- pressKey: "Tab"  # Move to next field
- inputText: "1234567890"
- pressKey: "Enter"  # Submit form

# ================================
# 4. SCROLLING & LIST INTERACTIONS
# ================================

- assertVisible: "Product List"

# Scroll down to find elements
- scroll:
    direction: DOWN
    duration: 1000

# Scroll until specific element is visible
- scrollUntilVisible:
    element: "Premium Product"
    direction: DOWN
    speed: 40  # Scroll speed (1-100)

# Scroll to specific coordinates
- scroll:
    direction: UP
    coordinate: "50%,30%"  # Scroll from this point

# ================================
# 5. CONDITIONAL LOGIC & FLOWS
# ================================

# Run commands only if element is visible
- runFlow:
    when:
      visible: "Skip Tutorial"
    commands:
      - tapOn: "Skip Tutorial"
      - assertVisible: "Main Menu"

# Run commands if element is NOT visible
- runFlow:
    when:
      notVisible: "Login Required"
    commands:
      - tapOn: "Continue as Guest"

# Multiple conditions
- runFlow:
    when:
      visible: 
        - "Terms & Conditions"
        - "Accept"
    commands:
      - tapOn: "Accept"
      - assertVisible: "Welcome"

# ================================
# 6. WAITING & TIMING
# ================================

# Wait for animations to complete
- waitForAnimationToEnd

# Wait for specific duration
- wait: 2000  # 2 seconds

# Wait for element to appear with timeout
- assertVisible:
    text: "Loading complete"
    timeout: 10000  # 10 seconds

# Wait for element to disappear
- assertNotVisible:
    text: "Loading..."
    timeout: 5000

# ================================
# 7. ADVANCED ASSERTIONS
# ================================

# Multiple assertion types
- assertVisible: "Dashboard"
- assertNotVisible: "Error Message"

# Assert with regex patterns
- assertVisible:
    text: "Balance: \\$[0-9,]+\\.[0-9]{2}"  # Matches currency format

# Assert element properties
- assertTrue: ${maestro.copiedText.length() > 0}  # After copy operation

# ================================
# 8. GESTURES & ADVANCED INTERACTIONS
# ================================

# Long press
- longPressOn:
    id: "product-item"
    duration: 1000

# Pinch to zoom
- pinch:
    scale: 2.0  # Zoom in 2x
    anchor: "50%,50%"  # Center of screen

# Double tap
- doubleTapOn: "image-view"

# Drag and drop
- tapOn: "draggable-item"
- swipe:
    direction: RIGHT
    duration: 1000

# ================================
# 9. TEXT OPERATIONS
# ================================

# Copy text from element
- copyTextFrom:
    id: "amount-display"

# Paste copied text
- tapOn:
    id: "transfer-amount"
- paste

# Select all text in field
- tapOn:
    id: "description-field"
- selectAll
- inputText: "New description"

# ================================
# 10. EXTERNAL INTERACTIONS
# ================================

# Open external links
- tapOn: "Privacy Policy"
- openLink: "https://example.com/privacy"

# Handle system dialogs/permissions
- tapOn: "Enable Notifications"
- tapOn: "Allow"  # System permission dialog

# Take photo (camera permission)
- tapOn: "Add Photo"
- tapOn: "Camera"
- tapOn: "Take Photo"  # System camera interface

# ================================
# 11. ERROR HANDLING & VALIDATION
# ================================

# Test error scenarios
- tapOn: "Submit"
- assertVisible: "Email is required"

# Test field validation
- tapOn:
    id: "email-input"
- inputText: "invalid-email"
- tapOn: "Next"
- assertVisible: "Please enter a valid email"

# Clear and retry
- tapOn:
    id: "email-input"
- clearText
- inputText: "${TEST_EMAIL}"
- tapOn: "Next"
- assertNotVisible: "Please enter a valid email"

# ================================
# 12. SCREENSHOT DOCUMENTATION
# ================================

# Strategic screenshots for test documentation
- takeScreenshot: "screenshots/02-after-login.png"

# Screenshot with custom naming using variables
- takeScreenshot: "screenshots/user-${TEST_EMAIL}-profile.png"

# ================================
# 13. PERFORMANCE & LOADING TESTS
# ================================

# Test loading states
- tapOn: "Refresh Data"
- assertVisible: "Loading..."
- assertNotVisible:
    text: "Loading..."
    timeout: 15000  # Ensure loading completes within 15 seconds

# Test offline behavior (if app supports it)
- runFlow:
    when:
      visible: "No Internet Connection"
    commands:
      - assertVisible: "Offline Mode"
      - tapOn: "Try Again"

# ================================
# 14. CLEANUP & APP STATE RESET
# ================================

# Navigate to settings for cleanup
- tapOn: "Profile"
- tapOn: "Settings"

# Logout (reset app state)
- scroll:
    direction: DOWN
- tapOn: "Logout"
- assertVisible: "Are you sure?"
- tapOn: "Yes, Logout"

# Verify logout successful
- assertVisible: "Welcome to MyApp"

# Final screenshot
- takeScreenshot: "screenshots/03-test-complete.png"

# ================================
# ADDITIONAL CAPABILITIES
# ================================

# You can also use these features:

# Repeat actions
# - repeat:
#     times: 3
#     commands:
#       - tapOn: "Refresh"
#       - wait: 1000

# Travel to specific coordinates and perform actions
# - tapOn:
#     coordinate: "100,200"  # Exact pixel coordinates

# Text selection
# - selectText: "specific text to select"

# Keyboard shortcuts (iOS)
# - pressKey: "Command+A"  # Select all
# - pressKey: "Command+C"  # Copy

# ================================
# RUNNING THIS TEST
# ================================

# Basic run:
# maestro test comprehensive-test.yaml

# With debug output:
# maestro test comprehensive-test.yaml --debug-output ./debug

# With specific environment variables:
# maestro test comprehensive-test.yaml -e TEST_EMAIL=user@test.com

# With tags filter:
# maestro test --include-tags smoke comprehensive-test.yaml

# ================================
# BEST PRACTICES DEMONSTRATED
# ================================

# 1. Use testID whenever possible for reliability
# 2. Add meaningful assertions after each major action
# 3. Take screenshots at key points for debugging
# 4. Use environment variables for test data
# 5. Handle conditional flows for different app states
# 6. Wait for animations/loading before proceeding
# 7. Test both happy path and error scenarios
# 8. Clean up app state at the end of tests
# 9. Use descriptive comments for test maintenance
# 10. Organize test into logical sections