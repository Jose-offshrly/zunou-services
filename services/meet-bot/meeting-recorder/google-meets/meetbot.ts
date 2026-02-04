import assert from 'node:assert'
import fs from 'node:fs'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { PassThrough } from 'node:stream'

import ffmpeg from 'fluent-ffmpeg'
// import puppeteer from 'puppeteer-extra'
// import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import { getStream, launch } from 'puppeteer-stream'

import {
  MAX_INTERVAL,
  MEET_BOT_MAX_DURATION,
  MIN_AUDIO_CHUNK_LENGTH,
  MIN_SILENCE_DURATION,
  SILENCE_THRESHOLD,
  ENABLE_FULL_AUDIO_ACCUMULATION,
} from './constants.ts'
import { env } from './env.ts'
import state, { type Page } from './state.ts'
import { stopAudioProcessing, stopMeetBot } from './stop_meet_bot.ts'
import {
  batchAudioChunk,
  delay,
  isBufferSilent,
  monitorKickout,
  monitorSpeakers,
  openChatWindow,
  sendChatMessage,
  detectMeetingPlatform,
  transformZoomUrl,
  type MeetingPlatform,
} from './utils.ts'
import { sendToWhisper } from './whisper.ts'
import audioProcessor from './audio-processor.ts'
import { assemblyAIRealtime } from './assemblyai-realtime.ts'

// puppeteer.use(StealthPlugin())

let lastFlushTime = Date.now()
let lastSpeechTime = Date.now()

const recordingsDir = './recordings'
if (!fs.existsSync(recordingsDir)) {
  fs.mkdirSync(recordingsDir, { recursive: true })
}

// Debug screenshot utility

// ✅ **Protected page.evaluate helper to prevent CDP errors during shutdown**
async function safeEvaluate<T>(page: Page, func: any, ...args: any[]): Promise<T | null> {
  try {
    if (!state.isBotRunning) {
      console.log('🚫 Bot not running - skipping page.evaluate call')
      return null
    }
    return await page.evaluate(func, ...args)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes('Target closed') || errorMessage.includes('Protocol error') || errorMessage.includes('TargetCloseError')) {
      console.log('🚫 Skipping page.evaluate - target closed during operation')
      return null
    }
    throw error
  }
}

// Helper: Try multiple selectors in parallel and click first found
async function findAndClickFirst(page: Page, selectors: string[], actionName: string, timeout = 1000): Promise<boolean> {
  const promises = selectors.map(async (selector) => {
    try {
      const element = await page.waitForSelector(selector, { timeout })
      if (element) {
        await element.click()
        console.log(`${actionName}: ${selector}`)
        return true
      }
    } catch {
      return false
    }
    return false
  })
  
  try {
    const result = await Promise.race(promises)
    return result || false
  } catch {
    return false
  }
}

// Google Meet joining logic
async function joinGoogleMeet(page: Page, meetUrl: string) {
  const startTime = Date.now()
  console.log(`Starting Google Meet join process: ${meetUrl}`)
  console.log(`Current page URL: ${page.url()}`)
  
  // Handle popups (pre-injected handlers should catch most, this is backup)
  await Promise.race([
    Promise.allSettled([
      findAndClickFirst(page, [
        "span[jsname='V67aGc'].mUIrbf-vQzf8d",
        "button[jsname='IbE0S']"
      ], "Continue without devices"),
      
      findAndClickFirst(page, [
        "button[data-mdc-dialog-action='accept']"
      ], "Accept cookies"),
      
      findAndClickFirst(page, [
        "button[jsname='EszDEe']"
      ], "Got it"),
      
      findAndClickFirst(page, [
        'button.VfPpkd-LgbsSe'
      ], "Dismiss sign-in")
    ]),
    delay(1500)
  ])
  
  console.log(`Popups handled in ${Date.now() - startTime}ms`)
  
  // Disable camera and mute mic (pre-injected handlers should catch most)
  const mediaStartTime = Date.now()
  
  const muteMic = async () => {
    const selectors = [
      "div[jsname='hw0c9'][data-is-muted='false']",
      "div[jsname='hw0c9'][aria-label*='Turn off microphone']",
      "div[jsname='hw0c9']",
      "div[aria-label*='Turn off microphone']",
      "button[aria-label*='Turn off microphone']",
    ]
    
    for (const selector of selectors) {
      try {
        const micButton = await page.$(selector)
        if (!micButton) continue
        
        const state = await micButton.evaluate((el: Element) => {
          const element = el as HTMLElement
          const dataMuted = element.getAttribute('data-is-muted')
          const ariaLabel = element.getAttribute('aria-label') || ''
          const hasDeviceProblem = ariaLabel.toLowerCase().includes('problem')
          const hasValidStructure = element.getAttribute('jsname') === 'hw0c9' || 
                                   dataMuted !== null || 
                                   ariaLabel.toLowerCase().includes('microphone')
          
          if (hasDeviceProblem && !hasValidStructure) {
            return { skip: true }
          }
          
          const isMicOn = dataMuted === 'false' || 
                         ariaLabel.toLowerCase().includes('turn off microphone') ||
                         ariaLabel.toLowerCase().includes('mute microphone')
          
          return { skip: false, isMicOn }
        })
        
        if (state.skip) continue
        
        if (state.isMicOn) {
          await micButton.click()
          console.log('Microphone muted')
        } else {
          console.log('Microphone already muted')
        }
        return
      } catch {}
    }
  }
  
  const disableCamera = async () => {
    try {
      const cameraButton = await page.$("div[jsname='psRWwc']")
      if (cameraButton) {
        await cameraButton.click()
        console.log('Camera disabled')
      }
    } catch {}
  }
  
  await Promise.allSettled([disableCamera(), muteMic()])
  console.log(`Media controls handled in ${Date.now() - mediaStartTime}ms`)

  // Enter name and click join button
  const nameAndJoinStartTime = Date.now()
  
  // Enter bot name
  const nameSelectors = [
    'input[aria-label*="name"]',
    'input[placeholder*="name"]',
    'input[data-promo-anchor-id="displayName"]',
    'input[jsname="YPqjbf"]',
    'input[type="text"]'
  ]
  
  let nameEntered = false
  for (const selector of nameSelectors) {
    try {
      const nameInput = await page.$(selector)
      if (nameInput) {
        await nameInput.evaluate((el, name) => { 
          (el as HTMLInputElement).value = name
          el.dispatchEvent(new Event('input', { bubbles: true }))
          el.dispatchEvent(new Event('change', { bubbles: true }))
        }, state.botName)
        console.log(`Name entered: ${state.botName}`)
        nameEntered = true
        break
      }
    } catch {}
  }
  
  if (!nameEntered) {
    console.log('Name input not found')
  }
  
  // Wait for join button to become enabled
  await delay(500)
  
  // Click join button
  const joinButtonSelectors = [
    'span[jsname="V67aGc"].UywwFc-vQzf8d',
    'div[role="button"][aria-label*="Ask to join"]',
    'button[aria-label*="Ask to join"]',
    'span.UywwFc-vQzf8d',
    "[jsname='V67aGc']"
  ]
  
  let joinButtonClicked = false
  
  for (const selector of joinButtonSelectors) {
    if (joinButtonClicked) break
    
    try {
      await page.waitForSelector(selector, { timeout: 1000, visible: true })
      const button = await page.$(selector)
      
      if (button) {
        const isClickable = await button.evaluate((el: Element) => {
          const element = el as HTMLElement
          const rect = element.getBoundingClientRect()
          const style = window.getComputedStyle(element)
          return rect.width > 0 && 
                 rect.height > 0 && 
                 style.visibility !== 'hidden' &&
                 style.display !== 'none' &&
                 !element.hasAttribute('disabled')
        })
        
        if (isClickable) {
          await button.click()
          
          // Force click to ensure it registers
          await page.evaluate((sel) => {
            const btn = document.querySelector(sel) as HTMLElement
            if (btn) {
              btn.click()
              btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
            }
          }, selector)
          
          console.log(`Join button clicked: ${selector}`)
          joinButtonClicked = true
        }
      }
    } catch {
      continue
    }
  }
  
  // Verify join button was clicked
  if (joinButtonClicked) {
    await delay(1000)
    
    // Check if button is still visible (click may not have worked)
    const stillHasButton = await page.evaluate(() => {
      return !!document.querySelector('span[jsname="V67aGc"], [jsname="V67aGc"]')
    })
    
    if (stillHasButton) {
      // Try text-based fallback
      await page.evaluate(() => {
        const selectors = [
          'span[jsname="V67aGc"]',
          '[jsname="V67aGc"]',
          'span.UywwFc-vQzf8d',
          'div[role="button"][aria-label*="Ask to join"]'
        ]
        
        for (const sel of selectors) {
          const btn = document.querySelector(sel) as HTMLElement
          if (btn) {
            btn.click()
            btn.dispatchEvent(new MouseEvent('click', { bubbles: true }))
            return
          }
        }
      })
    }
  }
  
  // Final fallback if no selector worked
  if (!joinButtonClicked) {
    try {
      const clicked = await page.evaluate(() => {
        const joinPatterns = ['ask to join', 'join now', 'join', 'request to join']
        const allElements = Array.from(document.querySelectorAll('button, [role="button"], span[jsname], div[jsname]'))
        
        for (const el of allElements) {
          const text = el.textContent?.toLowerCase().trim() || ''
          const ariaLabel = el.getAttribute('aria-label')?.toLowerCase() || ''
          
          if (joinPatterns.some(pattern => text.includes(pattern) || ariaLabel.includes(pattern))) {
            const rect = el.getBoundingClientRect()
            if (rect.width > 0 && rect.height > 0) {
              (el as HTMLElement).click()
              return true
            }
          }
        }
        return false
      })
      
      if (clicked) {
        console.log('Join button clicked via fallback')
        joinButtonClicked = true
      }
    } catch {}
  }
  
  // Log diagnostics if join failed
  if (!joinButtonClicked) {
    console.log('Failed to click join button')
    
    const diagnostics = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, [role="button"], span, div'))
        .filter(el => {
          const text = el.textContent?.toLowerCase() || ''
          return text.includes('join') || text.includes('enter')
        })
        .map(el => ({
          tag: el.tagName,
          text: el.textContent?.trim().substring(0, 50),
          visible: el.getBoundingClientRect().width > 0
        }))
      
      return { buttons: buttons.slice(0, 5) }
    })
    
    console.log('Available buttons:', JSON.stringify(diagnostics, null, 2))
    
    try {
      const screenshotPath = path.join(state.sessionDir || './recordings', 'join_failed.png')
      await page.screenshot({ path: screenshotPath })
      console.log(`Screenshot saved: ${screenshotPath}`)
    } catch {}
  }
  
  // Verify we're in waiting state
  await delay(1000)
  const finalState = await page.evaluate(() => {
    const bodyText = document.body.innerText.toLowerCase()
    return bodyText.includes('asking to join') || 
           bodyText.includes('waiting for') || 
           bodyText.includes('waiting to be admitted')
  })
  
  if (finalState) {
    console.log('Bot requested to join - waiting for admission')
  } else {
    console.log('Warning: May not have successfully requested to join')
  }
  
  const totalJoinTime = Date.now() - startTime
  console.log(`Join process completed in ${totalJoinTime}ms`)
}

// ✅ **LEGACY CODE BELOW - KEPT FOR REFERENCE BUT NOT EXECUTED**
// The optimized joinGoogleMeet function above handles all join logic
// This legacy code is preserved for debugging/fallback purposes only

async function joinGoogleMeet_LEGACY_UNUSED(page: Page, meetUrl: string) {
  console.log('⚠️ WARNING: Legacy join function should not be called!')
  
  // ✅ **Enter bot name with better selector and validation**
  try {
    // Try multiple selectors for the name input field
    const nameSelectors = [
      'input[aria-label*="name"]',  // Most specific
      'input[placeholder*="name"]', // Common pattern  
      'input[data-promo-anchor-id="displayName"]', // Google Meet specific
      'input[jsname="YPqjbf"]',     // Google Meet jsname
      'input[type="text"]'          // Fallback
    ]
    
    let nameInput = null
    let usedSelector = ''
    
    for (const selector of nameSelectors) {
      try {
        nameInput = await page.$(selector)
  if (nameInput) {
          usedSelector = selector
          console.log(`✅ Found name input with selector: ${selector}`)
          break
        }
      } catch (error) {
        console.log(`⚠️ Selector ${selector} failed:`, error instanceof Error ? error.message : error)
      }
    }
    
        if (nameInput) {
      // Clear any existing text first - use multiple methods for reliability
      await nameInput.evaluate((el) => { (el as HTMLInputElement).value = '' }) // Direct clear
      await nameInput.click({ clickCount: 3 }) // Select all (in case evaluate didn't trigger events)
      await nameInput.press('Backspace') // Delete any remaining text
      await delay(200) // Brief pause for UI to update
    await nameInput.type(state.botName)
      
      // Verify the name was actually entered
      const enteredName = await nameInput.evaluate((el) => (el as HTMLInputElement).value)
      if (enteredName === state.botName) {
        console.log(`✅ Bot name successfully entered using ${usedSelector}: "${enteredName}"`)
  } else {
        console.log(`⚠️ Name verification failed. Expected: "${state.botName}", Got: "${enteredName}"`)
      }
      
      await delay(1000)
    } else {
             console.log('❌ Name input field not found with any selector!')

      
      // Debug: Log all input elements
      const allInputs = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('input')).map(input => ({
          type: input.type,
          placeholder: input.placeholder,
          ariaLabel: input.getAttribute('aria-label'),
          className: input.className,
          jsname: input.getAttribute('jsname')
        }))
      })
      console.log('🔍 All input elements found:', JSON.stringify(allInputs, null, 2))
    }
     } catch (error) {
     console.error('❌ Error entering bot name:', error instanceof Error ? error.message : error)
   }



     // ✅ **Click "Ask to join" button with better validation**

   
   // ✅ **INVESTIGATE: Join button accessibility despite modal**
   const joinButtonInvestigation = await page.evaluate(() => {
     const modal = document.querySelector('[role="dialog"], .modal, [data-mdc-dialog-surface]')
     const joinButton = document.querySelector('span[jsname="V67aGc"].UywwFc-vQzf8d, button[jsname="Qx7uuf"]')
     
     if (modal && joinButton) {
       const modalRect = modal.getBoundingClientRect()
       const buttonRect = joinButton.getBoundingClientRect()
       const modalStyle = window.getComputedStyle(modal)
       const buttonStyle = window.getComputedStyle(joinButton)
       
       return {
         modalOverlapsButton: !(
           modalRect.right < buttonRect.left || 
           modalRect.left > buttonRect.right || 
           modalRect.bottom < buttonRect.top || 
           modalRect.top > buttonRect.bottom
         ),
         modalZIndex: modalStyle.zIndex,
         buttonZIndex: buttonStyle.zIndex,
         modalPointerEvents: modalStyle.pointerEvents,
         buttonPointerEvents: buttonStyle.pointerEvents,
         buttonVisibility: buttonStyle.visibility,
         buttonDisplay: buttonStyle.display
       }
     }
     return { noModalOrButton: true }
   })
   
   console.log('🔍 JOIN BUTTON vs MODAL INVESTIGATION:')
   console.log(JSON.stringify(joinButtonInvestigation, null, 2))
   
   try {
    // Try multiple selectors for the Ask to join button
    const joinButtonSelectors = [
      "span[jsname='V67aGc'].UywwFc-vQzf8d", // Original selector
      "button[jsname='Qx7uuf']", // Alternative Google Meet button  
      "div[role='button'][jsname='Qx7uuf']", // Sometimes it's a div
      "[data-idom-class*='join']", // General join button
      "span[jsname='V67aGc']", // Simplified jsname selector
      "button[aria-label*='join']" // Aria label based
    ]
    
    let joinButton = null
    let usedSelector = ''
    
    for (const selector of joinButtonSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 3000 })
        joinButton = await page.$(selector)
        if (joinButton) {
          usedSelector = selector
          console.log(`✅ Found 'Ask to join' button with selector: ${selector}`)
          break
        }
      } catch (error) {
        console.log(`⚠️ Join button selector ${selector} failed:`, error instanceof Error ? error.message : error)
             }
     }
     
     // If no button found with selectors, try text-based search
     if (!joinButton) {
       console.log('🔍 Attempting text-based search for join button...')
       try {
         const textButtons = await page.$$eval('*', (elements) => {
           return elements.map((el, index) => {
             const text = el.textContent?.toLowerCase().trim()
             if (text === 'ask to join' || text === 'join' || text === 'request to join') {
               el.setAttribute('data-found-by-text', String(index))
               return index
             }
             return -1
           }).filter(i => i >= 0)
         })
         
         if (textButtons.length > 0) {
           joinButton = await page.$(`[data-found-by-text="${textButtons[0]}"]`)
           if (joinButton) {
             usedSelector = 'text-based search'
             console.log('✅ Found join button via text-based search')
           }
         }
       } catch (error) {
         console.log('⚠️ Text-based search failed:', error instanceof Error ? error.message : error)
       }
     }
     
     if (joinButton) {
       // Ensure the button is visible and clickable
      const isVisible = await joinButton.evaluate((el) => {
        const rect = el.getBoundingClientRect()
        return rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).visibility !== 'hidden'
      })
      
             if (isVisible) {
         await joinButton.click()
                 console.log(`✅ Successfully clicked 'Ask to join' button using ${usedSelector}`)
        
        // ✅ **ENHANCED JOIN VERIFICATION**
        await delay(2000)
        

        
        // Multiple verification checks
        const joinVerification = await page.evaluate((selector) => {
          const button = document.querySelector(selector)
          const buttonExists = !!button
          const buttonVisible = button ? button.getBoundingClientRect().width > 0 : false
          const buttonText = button ? button.textContent?.trim() : ''
          
          // Check for waiting/joined indicators
          const bodyText = document.body.innerText.toLowerCase()
          const hasWaitingText = bodyText.includes('asking to join') || bodyText.includes('waiting for the host') || bodyText.includes('waiting to be admitted')
          const hasJoinedText = bodyText.includes('you joined') || bodyText.includes('joined the meeting')
          
          return {
            buttonExists,
            buttonVisible,
            buttonText,
            hasWaitingText,
            hasJoinedText,
            bodySnippet: bodyText.substring(0, 300)
          }
        }, usedSelector)
        
        console.log('🔍 Join verification results:')
        console.log(`   Button exists: ${joinVerification.buttonExists}`)
        console.log(`   Button visible: ${joinVerification.buttonVisible}`) 
        console.log(`   Has waiting text: ${joinVerification.hasWaitingText}`)
        console.log(`   Has joined text: ${joinVerification.hasJoinedText}`)
        
        if (joinVerification.buttonExists && joinVerification.buttonVisible) {
          console.log("⚠️ 'Ask to join' button still present - attempting additional clicks...")
          
          // Try multiple click methods
          for (let attempt = 1; attempt <= 3; attempt++) {
            console.log(`🔄 Additional click attempt ${attempt}/3...`)
            
            try {
              // Method 1: Direct click
              await page.click(usedSelector)
              await delay(500)
              
              // Method 2: Force click via evaluate (with protection)
              try {
                if (!state.isBotRunning) {
                  console.log('🚫 Bot not running - skipping page.evaluate call')
                  break
                }
                await page.evaluate((sel) => {
                  const btn = document.querySelector(sel)
                  if (btn) {
                    ;(btn as HTMLElement).click()
                    console.log('Forced click executed')
                  }
                }, usedSelector)
              } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error)
                if (errorMessage.includes('Target closed') || errorMessage.includes('Protocol error')) {
                  console.log('🚫 Skipping page.evaluate - target closed during join process')
                  break
                }
                throw error
              }
              await delay(500)
              
              // Method 3: Click all join-like buttons (with protection)
              try {
                if (!state.isBotRunning) {
                  console.log('🚫 Bot not running - skipping page.evaluate call')
                  break
                }
                await page.evaluate(() => {
                  const joinTexts = ['ask to join', 'join', 'enter']
                  const allButtons = document.querySelectorAll('button, [role="button"], span[jsname], div[jsname]')
                  
                  for (const btn of Array.from(allButtons)) {
                    const text = btn.textContent?.toLowerCase().trim() || ''
                    if (joinTexts.some(jt => text.includes(jt))) {
                      const rect = btn.getBoundingClientRect()
                      if (rect.width > 0 && rect.height > 0) {
                        ;(btn as HTMLElement).click()
                      }
                    }
                  }
                })
              } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error)
                if (errorMessage.includes('Target closed') || errorMessage.includes('Protocol error')) {
                  console.log('🚫 Skipping page.evaluate - target closed during join process')
                  break
                }
                throw error
              }
              await delay(1000)
              
              // Check if successful (with protection)
              let stillVisible = false
              try {
                if (state.isBotRunning) {
                  stillVisible = (await page.evaluate((sel) => {
                    const btn = document.querySelector(sel)
                    return btn && btn.getBoundingClientRect().width > 0
                  }, usedSelector)) ?? false
                }
              } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error)
                if (errorMessage.includes('Target closed') || errorMessage.includes('Protocol error')) {
                  console.log('🚫 Skipping page.evaluate - target closed during success check')
                  break
                }
                throw error
              }
              
              if (!stillVisible) {
                console.log(`✅ Button disappeared after attempt ${attempt}`)
                break
              }
            } catch (error) {
              console.log(`⚠️ Click attempt ${attempt} failed:`, error)
            }
          }
        } else if (joinVerification.hasWaitingText) {
          console.log("✅ Join successful - bot is waiting to be admitted")
        } else if (joinVerification.hasJoinedText) {
          console.log("✅ Join successful - bot has entered the meeting")
        } else {
          console.log("✅ Join request appears successful - 'Ask to join' button is gone")
        }
             } else {
         console.log("❌ 'Ask to join' button found but not visible/clickable")

       }
    } else {
             console.log("❌ 'Ask to join' button not found with any selector!")

      
      // Debug: Log all clickable elements
      const allButtons = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('button, [role="button"], span[jsname], div[jsname]')).map(el => ({
          tagName: el.tagName,
          textContent: el.textContent?.trim().substring(0, 50),
          className: el.className,
          jsname: el.getAttribute('jsname'),
          role: el.getAttribute('role')
        })).filter(el => el.textContent && el.textContent.length > 0)
      })
      console.log('🔍 All potential buttons found:', JSON.stringify(allButtons.slice(0, 10), null, 2))
      
    await stopMeetBot()
    throw new Error("'Ask to join' button not found")
    }
  } catch (error) {
    console.error("❌ Error clicking 'Ask to join' button:", error instanceof Error ? error.message : error)
    await stopMeetBot()
    throw error
  }

  await delay(10000) // Wait for meeting acceptance
  

  
  // ✅ **POST-JOIN MICROPHONE VERIFICATION & MUTING** (Safety net)
  console.log('🎤 Verifying and muting microphone after joining meeting (safety net)...')
  await delay(3000) // Wait for meeting UI to stabilize
  
  const postJoinMicSelectors = [
    // ✅ **EXACT SELECTORS FROM USER'S HTML** (highest priority)
    "div[jsname='hw0c9'][aria-label*='Turn off microphone']", // EXACT match from user's inspect
    "div[jsname='hw0c9'][aria-label*='Turn on microphone']",  // Muted state version
    "div[jsname='hw0c9'][data-is-muted='false']",     // Using data attribute (mic ON)
    "div[jsname='hw0c9'][data-is-muted='true']",      // Using data attribute (mic OFF)
    "div[jsname='hw0c9']",                            // Broader fallback
    
    // ✅ **STANDARD POST-JOIN SELECTORS**
    "button[aria-label*='Unmute']",                  // If button says "Unmute", mic is muted ✅
    "button[aria-label*='Turn on microphone']",      // If says "Turn on", mic is off ✅
    "button[aria-label*='Mute']",                    // If says "Mute", mic is on ❌
    "button[aria-label*='Turn off microphone']",     // If says "Turn off", mic is on ❌
    "div[aria-label*='Turn off microphone']",        // Div version
    "div[aria-label*='Turn on microphone']",         // Div version
    "div[aria-label*='Unmute']",                     // Div unmute
    "div[aria-label*='Mute microphone']",            // Div mute
    "[role='button'][aria-label*='Turn off microphone']", // Role-based
    "[role='button'][aria-label*='Turn on microphone']",  // Role-based
    "button[data-tooltip*='Unmute']",                // Tooltip-based
    "button[title*='Unmute']",                       // Title-based
    "button[jsname='BOHaEe']"                        // Alternative selector
  ]
  
  let postJoinMicMuted = false
  for (const selector of postJoinMicSelectors) {
    try {
      const micButton = await page.$(selector)
      if (micButton) {
        console.log(`🔍 Found post-join microphone button with selector: ${selector}`)
        
        const buttonState = await page.evaluate((el: Element) => {
          const element = el as HTMLElement
          return {
            ariaPressed: element.getAttribute('aria-pressed'),
            ariaLabel: element.getAttribute('aria-label'),
            className: element.className,
            title: element.title,
            textContent: element.textContent?.trim(),
            dataMuted: element.getAttribute('data-is-muted'),
            dataTooltip: element.getAttribute('data-tooltip'),
            jsname: element.getAttribute('jsname')
          }
        }, micButton)
        
        console.log(`📊 Post-join microphone button state:`, JSON.stringify(buttonState, null, 2))
        
        // ✅ **INTELLIGENT DEVICE PROBLEM FILTERING** in post-join too
        const hasDeviceProblemText = buttonState.ariaLabel?.toLowerCase().includes('problem') ||
            buttonState.ariaLabel?.toLowerCase().includes('show more info') ||
            buttonState.ariaLabel?.toLowerCase().includes('error') ||
            buttonState.ariaLabel?.toLowerCase().includes('not found')
        
        const hasValidMicStructure = selector.includes("jsname='hw0c9'") || // Has correct jsname
            selector.includes('data-is-muted') || // Has mute data attribute
            buttonState.ariaLabel?.toLowerCase().includes('microphone') // Clearly mic-related
        
        if (hasDeviceProblemText && !hasValidMicStructure) {
          console.log(`⚠️ Skipping post-join device problem button: "${buttonState.ariaLabel}" - not a mic control`)
          continue
        } else if (hasDeviceProblemText && hasValidMicStructure) {
          console.log(`🔧 Post-join Docker environment: Found mic control with device problem label - will attempt to use it`)
          console.log(`   → Selector: ${selector}`)
          console.log(`   → Label: "${buttonState.ariaLabel}"`)
        }
        
        // Check data-is-muted attribute first (most reliable)
        const dataMuted = buttonState.dataMuted
        console.log(`🔍 Post-join data-is-muted attribute: "${dataMuted}"`)
        
        // Microphone is MUTED if:
        // - data-is-muted="true" (most reliable)
        // - aria-pressed="true" (pressed = muted)
        // - aria-label contains "Unmute" or "Turn on microphone"
        const isMicMuted = 
          dataMuted === 'true' ||
          buttonState.ariaPressed === 'true' ||
          buttonState.ariaLabel?.toLowerCase().includes('unmute') ||
          buttonState.ariaLabel?.toLowerCase().includes('turn on microphone') ||
          buttonState.ariaLabel?.toLowerCase().includes('enable microphone') ||
          buttonState.className?.includes('muted') ||
          buttonState.className?.includes('mic-off') ||
          buttonState.title?.toLowerCase().includes('unmute')

        // Microphone is ON if:
        // - data-is-muted="false" (most reliable)
        // - aria-pressed="false" (not pressed = not muted)
        // - aria-label contains "Mute" or "Turn off microphone" 
        const isMicOn = 
          dataMuted === 'false' ||
          buttonState.ariaPressed === 'false' ||
          buttonState.ariaLabel?.toLowerCase().includes('turn off microphone') ||
          buttonState.ariaLabel?.toLowerCase().includes('mute microphone') ||
          (buttonState.ariaLabel?.toLowerCase().includes('mute') && 
           !buttonState.ariaLabel?.toLowerCase().includes('unmute'))

        console.log(`🔍 Post-join microphone analysis: isMuted=${isMicMuted}, isOn=${isMicOn}`)

        if (isMicMuted) {
          console.log('✅ Microphone is properly muted in meeting.')
          postJoinMicMuted = true
          break
        } else if (isMicOn) {
          console.log('⚠️ Microphone is ON in meeting, muting now...')
          await micButton.click()
          await delay(1000)
          console.log('✅ Microphone muted in meeting.')
          postJoinMicMuted = true
          break
        }
      }
    } catch (error) {
      console.log(`⚠️ Error with post-join mic selector ${selector}:`, error instanceof Error ? error.message : error)
    }
  }

  if (!postJoinMicMuted) {
    console.log('⚠️ Could not verify microphone state after joining - attempting post-join fallback...')
    
    try {
      const postJoinFallbackResult = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, div[role="button"], div[jscontroller], div[jsname]'))
        for (const btn of buttons) {
          const element = btn as HTMLElement
          const label = element.getAttribute('aria-label')?.toLowerCase() || ''
          const title = element.title?.toLowerCase() || ''
          const dataMuted = element.getAttribute('data-is-muted')
          const jsname = element.getAttribute('jsname')
          
          // Skip device problem buttons
          if (label.includes('problem') || label.includes('show more info') || 
              label.includes('error') || label.includes('not found')) {
            continue
          }
          
          // Priority 1: Check data-is-muted="false" (mic is ON, needs muting)
          if (dataMuted === 'false' || 
              label.includes('turn off microphone') ||
              title.includes('turn off microphone') ||
              label.includes('mute microphone') && !label.includes('unmute') ||
              (jsname === 'hw0c9' && dataMuted === 'false')) {
            console.log('Found post-join fallback mic button:', { 
              label: element.getAttribute('aria-label'), 
              title: element.title, 
              dataMuted, 
              jsname,
              reason: dataMuted === 'false' ? 'data-is-muted=false' : 'aria-label match'
            })
            element.click()
            return { success: true, method: 'post-join-fallback', label, dataMuted, jsname }
          }
        }
        return { success: false }
      })
      
      if (postJoinFallbackResult.success) {
        console.log('✅ Post-join fallback microphone mute successful:', postJoinFallbackResult)
        postJoinMicMuted = true
      } else {
        console.log('ℹ️ No post-join mute actions needed - microphone may already be properly muted')
      }
    } catch (finalError) {
      console.log('⚠️ Post-join fallback mute attempt failed:', finalError instanceof Error ? finalError.message : finalError)
    }
  }
  
  // ✅ Handle "This Video call is being recorded" modal
  try {
    await page.waitForSelector("span[jsname='V67aGc']", { timeout: 5000 })
    const joinNowButtons = await page.$$("span[jsname='V67aGc']")
    
    for (const button of joinNowButtons) {
      const text = await page.evaluate((el: Element) => el.textContent, button)
      if (text && (text.includes('Join now') || text.includes('Join Now'))) {
        await button.click()
        console.log("✅ Clicked 'Join Now' in recording consent modal.")
        await delay(2000)
        break
      }
    }
  } catch {
    console.log("⚠️ No recording consent modal found (meeting may not be recorded).")
  }
}

// Helper function to debug available elements
async function debugAvailableElements(page: Page, stepName: string) {
  try {
    const elements = await page.evaluate(() => {
      const allElements = document.querySelectorAll('*[data-tid], input, button, a')
      return Array.from(allElements).slice(0, 20).map(el => ({
        tag: el.tagName.toLowerCase(),
        id: el.id,
        dataTid: el.getAttribute('data-tid'),
        ariaLabel: el.getAttribute('aria-label'),
        className: el.className,
        text: el.textContent?.slice(0, 50) || ''
      }))
    })
    console.log(`🔍 Debug ${stepName} - Available elements:`, JSON.stringify(elements, null, 2))
  } catch (error) {
    console.error(`❌ Error debugging elements for ${stepName}:`, error)
  }
}

// ✅ **Microsoft Teams Joining Logic**
async function joinTeams(page: Page) {
  console.log('🔵 Starting Microsoft Teams joining process...')
  
  // ✅ Step 1: Handle "Join on the web instead" link
  try {
    const joinOnWebSelectors = [
      'a[data-tid="joinOnWeb"]',
      'a[href*="launcher=false"]',
      'a:has-text("Join on the web instead")',
      'a:has-text("web instead")',
      'button[data-tid="joinOnWeb"]'
    ]
    
    let joinOnWebLink = null
    for (const selector of joinOnWebSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 })
        joinOnWebLink = await page.$(selector)
        if (joinOnWebLink) {
          console.log(`✅ Found join on web link with selector: ${selector}`)
          await joinOnWebLink.click()
          console.log('✅ Clicked "Join on the web instead" link.')
          await delay(3000)
          break
        }
      } catch {
        // Continue to next selector
      }
    }
    
    if (!joinOnWebLink) {
      console.log('⚠️ No "Join on the web instead" link found, proceeding...')
    }
  } catch {
    console.log('⚠️ No "Join on the web instead" link found, proceeding...')
  }
  
      console.log('🔗 Current URL after join on web:', page.url())

  // ✅ Step 2: IMMEDIATELY disable camera and microphone (before entering name)
  console.log('🔇 PRIORITY: Disabling camera and microphone BEFORE any other actions...')
  
  // Wait for prejoin interface to fully load
  await delay(3000)
  
      console.log('🔧 Disabling camera and microphone before joining...')
  
  // Disable camera with comprehensive checks - PRIORITY ACTION
  try {
    console.log('📷 PRIORITY: Disabling camera before joining...')
    const cameraSelectors = [
      'input[data-tid="toggle-video"]', // Teams Live camera toggle (primary)
      'button[data-tid="toggle-camera"]',
      'button[data-tid="prejoin-camera-button"]',
      'button[aria-label*="camera"]',
      'button[aria-label*="Camera"]',
      'button[title*="camera"]',
      'button[title*="Camera"]',
      'button[data-tid="camera-button"]',
      'div[data-tid="toggle-camera"] button',
      'button:has([data-tid="camera-on"])',
      'button:has([data-tid="camera-off"])',
      'input[aria-label*="camera"]',
      'input[aria-label*="Camera"]'
    ]
    
    let cameraDisabled = false
    for (const selector of cameraSelectors) {
      try {
        const cameraButton = await page.$(selector)
        if (cameraButton) {
          console.log(`🔍 Found camera button with selector: ${selector}`)
          
          // Check multiple ways to determine if camera is enabled
          const buttonState = await page.evaluate((el: Element) => {
            const element = el as HTMLElement
            return {
              ariaPressed: element.getAttribute('aria-pressed'),
              ariaLabel: element.getAttribute('aria-label'),
              className: element.className,
              title: element.title,
              dataPressed: element.getAttribute('data-pressed'),
              innerHTML: element.innerHTML,
              tagName: element.tagName.toLowerCase(),
              checked: element.tagName.toLowerCase() === 'input' ? (element as HTMLInputElement).checked : null
            }
          }, cameraButton)
          
          console.log(`📊 Camera button state:`, JSON.stringify(buttonState, null, 2))
          
          // ✅ **Teams Live Logic**: For input[data-tid="toggle-video"], checked=true means camera ON
          if (selector === 'input[data-tid="toggle-video"]' && buttonState.checked === true) {
            console.log('📷 Teams Live: Camera is ON (checked=true), disabling...')
            await cameraButton.click()
            await delay(1000)
            console.log('✅ Teams Live: Camera disabled.')
            cameraDisabled = true
            break
          }
          // ✅ **Teams Live Logic**: For input[data-tid="toggle-video"], checked=false means camera OFF
          else if (selector === 'input[data-tid="toggle-video"]' && buttonState.checked === false) {
            console.log('📷 Teams Live: Camera is already OFF (checked=false).')
            cameraDisabled = true
            break
          }
          // ✅ **Regular Teams Logic**: Complex detection for other Teams variants
          else {
            const isCameraOn = 
              buttonState.ariaPressed === 'true' ||
              buttonState.ariaLabel?.toLowerCase().includes('turn camera off') ||
              buttonState.ariaLabel?.toLowerCase().includes('turn off camera') ||
              buttonState.ariaLabel?.toLowerCase().includes('disable camera') ||
              buttonState.ariaLabel?.toLowerCase().includes('camera off') ||
              buttonState.className?.includes('camera-on') ||
              buttonState.className?.includes('enabled') ||
              buttonState.dataPressed === 'true' ||
              buttonState.innerHTML?.includes('camera-on') ||
              (buttonState.tagName === 'input' && buttonState.checked === true) ||
              (!buttonState.ariaLabel?.toLowerCase().includes('turn camera on') && 
               !buttonState.ariaLabel?.toLowerCase().includes('turn on camera') &&
               !buttonState.ariaLabel?.toLowerCase().includes('enable camera') &&
               buttonState.ariaLabel?.toLowerCase().includes('camera'))
            
            console.log(`🔍 Camera analysis: ariaLabel="${buttonState.ariaLabel}", tagName="${buttonState.tagName}", checked=${buttonState.checked}, isCameraOn=${isCameraOn}`)
            
            if (isCameraOn) {
              console.log('📷 Camera is ON, disabling NOW before joining...')
              await cameraButton.click()
              await delay(1000)
              console.log('✅ Camera disabled BEFORE joining.')
              cameraDisabled = true
              break
            } else {
              console.log('📷 Camera is already OFF or disabled.')
              cameraDisabled = true
              break
            }
          }
        }
      } catch (error) {
        console.log(`⚠️ Error checking camera button with selector ${selector}:`, error)
      }
    }
    
    if (!cameraDisabled) {
      console.log('⚠️ No camera button found or camera could not be disabled')
    }
  } catch (error) {
    console.error('❌ Error disabling camera:', error)
  }

  // Disable microphone with comprehensive checks - PRIORITY ACTION
  try {
    console.log('🎤 PRIORITY: Disabling microphone before joining...')
    const micSelectors = [
      'input[data-tid="toggle-mute"]', // Teams prejoin microphone toggle
      'button[data-tid="toggle-mute"]',
      'button[data-tid="prejoin-mic-button"]',
      'button[aria-label*="microphone"]',
      'button[aria-label*="Microphone"]',
      'button[aria-label*="mute"]',
      'button[aria-label*="Mute"]',
      'button[title*="microphone"]',
      'button[title*="Microphone"]',
      'button[title*="mute"]',
      'button[title*="Mute"]',
      'button[data-tid="mic-button"]',
      'div[data-tid="toggle-mute"] button',
      'button:has([data-tid="mic-on"])',
      'button:has([data-tid="mic-off"])',
      'input[aria-label*="microphone"]',
      'input[aria-label*="Microphone"]',
      'input[aria-label*="mute"]',
      'input[aria-label*="Mute"]'
    ]
    
    let micDisabled = false
    for (const selector of micSelectors) {
      try {
        const micButton = await page.$(selector)
        if (micButton) {
          console.log(`🔍 Found microphone button with selector: ${selector}`)
          
          // Check multiple ways to determine if microphone is enabled
          const buttonState = await page.evaluate((el: Element) => {
            const element = el as HTMLElement
            return {
              ariaPressed: element.getAttribute('aria-pressed'),
              ariaLabel: element.getAttribute('aria-label'),
              className: element.className,
              title: element.title,
              dataPressed: element.getAttribute('data-pressed'),
              innerHTML: element.innerHTML,
              tagName: element.tagName.toLowerCase(),
              checked: element.tagName.toLowerCase() === 'input' ? (element as HTMLInputElement).checked : null
            }
          }, micButton)
          
          console.log(`📊 Microphone button state:`, JSON.stringify(buttonState, null, 2))
          
          // ✅ **Teams Live Logic**: For input[data-tid="toggle-mute"], checked=true means mic ON
          if (selector === 'input[data-tid="toggle-mute"]' && buttonState.checked === true) {
            console.log('🎤 Teams Live: Microphone is ON (checked=true), disabling...')
            await micButton.click()
            await delay(1000)
            console.log('✅ Teams Live: Microphone disabled.')
            micDisabled = true
            break
          }
          // ✅ **Teams Live Logic**: For input[data-tid="toggle-mute"], checked=false means mic OFF
          else if (selector === 'input[data-tid="toggle-mute"]' && buttonState.checked === false) {
            console.log('🎤 Teams Live: Microphone is already OFF (checked=false).')
            micDisabled = true
            break
          }
          // ✅ **Regular Teams Logic**: Complex detection for other Teams variants
          else {
            // Determine if microphone is on (multiple checks)
            // If button says "Mute mic" or "Turn off microphone" - microphone is ON
            // If button says "Unmute mic" or "Turn on microphone" - microphone is OFF
            // For regular Teams input elements: checked=false means microphone is ON (not muted)
            const isMicOn = 
              buttonState.ariaPressed === 'false' || // In Teams, aria-pressed="false" means mic is ON
              buttonState.ariaLabel?.toLowerCase().includes('mute mic') ||
              buttonState.ariaLabel?.toLowerCase().includes('mute microphone') ||
              buttonState.ariaLabel?.toLowerCase().includes('turn off microphone') ||
              buttonState.ariaLabel?.toLowerCase().includes('turn microphone off') ||
              buttonState.ariaLabel?.toLowerCase().includes('disable microphone') ||
              (buttonState.ariaLabel?.toLowerCase().includes('mute') && 
               !buttonState.ariaLabel?.toLowerCase().includes('unmute')) ||
              buttonState.className?.includes('mic-on') ||
              buttonState.className?.includes('enabled') ||
              buttonState.dataPressed === 'false' ||
              buttonState.innerHTML?.includes('mic-on') ||
              (buttonState.tagName === 'input' && buttonState.checked === false) // Regular Teams input: unchecked = mic on
            
            console.log(`🔍 Microphone analysis: ariaLabel="${buttonState.ariaLabel}", tagName="${buttonState.tagName}", checked=${buttonState.checked}, isMicOn=${isMicOn}`)
            
            if (isMicOn) {
              console.log('🎤 Microphone is ON, muting NOW before joining...')
              await micButton.click()
              await delay(1000)
              console.log('✅ Microphone muted BEFORE joining.')
              micDisabled = true
              break
            } else {
              console.log('🎤 Microphone is already muted.')
              micDisabled = true
              break
            }
          }
        }
      } catch (error) {
        console.log(`⚠️ Error checking microphone button with selector ${selector}:`, error)
      }
    }
    
    if (!micDisabled) {
      console.log('⚠️ No microphone button found or microphone could not be disabled')
    }
  } catch (error) {
    console.error('❌ Error disabling microphone:', error)
  }


  
  // Wait for UI to stabilize after disabling camera/mic
  await delay(2000)
  console.log('🔇 PRIORITY: Camera and microphone disabled BEFORE joining process completed.')

  // ✅ Step 3: Enter bot name (after camera/mic are disabled)
  try {
    console.log('🔍 Waiting for Teams interface to fully load...')
    await delay(3000) // Give Teams more time to load after redirection
    
    // Try multiple possible selectors for the name input (enhanced for Teams Live)
    const nameSelectors = [
      '#displayName',
      'input[placeholder*="name"]',
      'input[placeholder*="Name"]',
      'input[data-tid="prejoin-display-name-input"]',
      'input[data-tid="displayName"]',
      'input[type="text"]',
      'input[aria-label*="name"]',
      'input[aria-label*="Name"]',
      'input[aria-label*="display"]',
      'input[aria-label*="Display"]',
      'input[title*="name"]',
      'input[title*="Name"]',
      // Teams Live specific selectors
      'input[placeholder*="Enter"]',
      'input[placeholder*="Your"]',
      '[data-tid="prejoin-display-name"] input',
      '[data-tid="displayName"] input',
      '.fui-Input input',
      // Generic text inputs on Teams pages
      'input:not([type]):not([hidden])',
      'input[type="text"]:not([hidden])'
    ]
    
    let nameInput = null
    for (const selector of nameSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 1000 })
        nameInput = await page.$(selector)
        if (nameInput) {
          // Check if the input is visible and not disabled
          const isVisible = await page.evaluate((el: Element) => {
            const element = el as HTMLInputElement
            const rect = element.getBoundingClientRect()
            return rect.width > 0 && rect.height > 0 && !element.disabled && !element.hidden
          }, nameInput)
          
          if (isVisible) {
            console.log(`✅ Found name input with selector: ${selector}`)
            break
          } else {
            nameInput = null
          }
        }
      } catch {
        // Continue to next selector
      }
    }
    
    if (nameInput) {
      try {
        await nameInput.click() // Focus the input
        await delay(500)
        await nameInput.evaluate((el: Element) => { (el as HTMLInputElement).value = '' })
        await nameInput.type(state.botName)
        console.log('✅ Entered bot name in Teams.')
        await delay(1000)
      } catch (error) {
        console.log('❌ Error entering name:', error)
      }
    } else {
      console.log('⚠️ Name input field not found - proceeding (may be optional for this Teams meeting)')
    }
  } catch (error) {
    console.error('❌ Error entering name:', error)
  }

  // ✅ Step 4: Click "Join now" button (camera and microphone already disabled)

  
  try {
    // Try multiple possible selectors for the join button
    const joinButtonSelectors = [
      'button[data-tid="prejoin-join-button"]',
      'button[data-tid="call-join-button"]',
      'button[aria-label*="Join"]',
      'button[aria-label*="join"]',
      'button:has-text("Join now")',
      'button:has-text("Join")',
      'button[title*="Join"]'
    ]
    
    let joinButton = null
    for (const selector of joinButtonSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 })
        joinButton = await page.$(selector)
        if (joinButton) {
          console.log(`✅ Found join button with selector: ${selector}`)
          await joinButton.click()
          console.log('✅ Clicked "Join now" button.')
          await delay(5000)
          break
        }
      } catch {
        // Continue to next selector
      }
    }
    
    if (!joinButton) {
      throw new Error('No join button found with any selector')
    }
  } catch {
    console.log('❌ "Join now" button not found!')
    

    
    await stopMeetBot()
    throw new Error('"Join now" button not found')
  }

  // ✅ Step 5: Handle lobby wait if needed
  try {
    const lobbyMessage = await page.$('[data-tid="lobby-screen"]')
    if (lobbyMessage) {
      console.log('🚪 Bot is waiting in the lobby...')
      await delay(5000)
    }
  } catch {
    console.log('⚠️ No lobby screen detected, proceeding...')
  }

  // ✅ Step 6: Handle any additional permission dialogs
  try {
    await page.waitForSelector('button[data-tid="join-teams-meeting"]', { timeout: 5000 })
    await page.click('button[data-tid="join-teams-meeting"]')
    console.log('✅ Clicked additional join button.')
    await delay(2000)
  } catch {
    console.log('⚠️ No additional join button found.')
  }

  console.log('🔵 Microsoft Teams joining process completed.')
  
  // ✅ **Teams-Specific Browser-Side Audio Capture** (similar to Zoom)
  console.log('🎧 Setting up Teams-specific browser-side audio capture...')
  
  try {
    // ✅ **Expose handleRealAudioChunk to browser context for Teams**
    await page.exposeFunction('handleRealAudioChunk', (audioChunk: number[], sampleRate: number = 48000) => {
      // ✅ **TEAMS STOP FIX**: Check if bot is stopping before processing audio
      if (!state.isBotRunning || state.isClosing) {
        // Bot is stopping - ignore audio chunks
        return
      }
      
      console.log(`🎵 Teams: Received audio chunk from browser: ${audioChunk.length} bytes, sample rate: ${sampleRate} Hz`)
      try {
        // Convert back to Uint8Array and send to transcription system with correct sample rate
        const uint8Array = new Uint8Array(audioChunk)
        batchAudioChunk(uint8Array, sampleRate) // Use Teams sample rate (48000 Hz)
        console.log(`✅ Teams: Audio chunk sent to transcription system with ${sampleRate} Hz`)
      } catch (error) {
        console.log(`❌ Teams: Error processing audio chunk:`, error)
      }
    })
    console.log('✅ Teams: handleRealAudioChunk function exposed to browser')

    // ✅ **Execute Teams Browser-Side Audio Capture**
    console.log('🎧 Starting Teams browser-side audio capture...')
    
    const teamsAudioResult = await Promise.race([
      page.evaluate(() => {
        return new Promise((resolve) => {
          const diagnostics: string[] = []
          diagnostics.push('🔥 Teams: Browser-side audio capture started')
          
          let audioSetupSuccess = false
          let audioChunkCount = 0
          let realAudioDetected = false
          
          try {
            const audioContext = new AudioContext()
            diagnostics.push(`🔊 Teams: AudioContext created with sample rate: ${audioContext.sampleRate} Hz`)
            
            // Find all audio/video elements in Teams interface
            const audioElements = document.querySelectorAll('audio, video')
            diagnostics.push(`📊 Teams: Found ${audioElements.length} audio/video elements`)
            
            if (audioElements.length === 0) {
              diagnostics.push('⚠️ Teams: No audio/video elements found initially, will retry...')
              
              // Teams Live might load audio elements after joining, retry after delay
              setTimeout(() => {
                const retryElements = document.querySelectorAll('audio, video')
                diagnostics.push(`📊 Teams: Retry found ${retryElements.length} audio/video elements`)
                
                if (retryElements.length > 0) {
                  setupTeamsAudioCapture(retryElements, audioContext, diagnostics)
                }
              }, 3000)
            } else {
              setupTeamsAudioCapture(audioElements, audioContext, diagnostics)
            }
            
            function setupTeamsAudioCapture(elements: NodeListOf<Element>, context: AudioContext, diag: string[]) {
              elements.forEach((element, index) => {
                try {
                  let source: MediaElementAudioSourceNode | MediaStreamAudioSourceNode | null = null
                  
                  if ((element as any).srcObject) {
                    source = context.createMediaStreamSource((element as any).srcObject)
                    diag.push(`✅ Teams: Created MediaStream source for element ${index}`)
                  } else if ((element as any).src) {
                    source = context.createMediaElementSource(element as HTMLMediaElement)
                    diag.push(`✅ Teams: Created MediaElement source for element ${index}`)
                  }
                  
                  if (source) {
                    const processor = context.createScriptProcessor(4096, 2, 2)
                    const gainNode = context.createGain()
                    gainNode.gain.value = 3.0 // Boost gain for Teams
                    
                    processor.onaudioprocess = (event) => {
                      const inputData = event.inputBuffer.getChannelData(0)
                      
                      // Calculate audio level
                      let sum = 0
                      for (let i = 0; i < inputData.length; i++) {
                        sum += Math.abs(inputData[i])
                      }
                      const audioLevel = sum / inputData.length
                      
                      // Detect significant audio
                      if (audioLevel > 0.005) {
                        if (!realAudioDetected) {
                          console.log(`🎉 Teams: FIRST REAL AUDIO DETECTED! Level: ${audioLevel.toFixed(4)}`)
                          realAudioDetected = true
                        }
                        
                        // Log every 50th chunk for monitoring
                        if (audioChunkCount % 50 === 0) {
                          console.log(`🔊 Teams: Audio chunk #${audioChunkCount} - Level: ${audioLevel.toFixed(4)}`)
                        }
                        
                        // Convert to 16-bit PCM for transcription
                        const int16Array = new Int16Array(inputData.length)
                        for (let i = 0; i < inputData.length; i++) {
                          int16Array[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768))
                        }
                        
                        // Send to transcription system
                        if ((window as any).handleRealAudioChunk) {
                          (window as any).handleRealAudioChunk(Array.from(new Uint8Array(int16Array.buffer)), context.sampleRate)
                        }
                        
                        audioChunkCount++
                      }
                    }
                    
                    // Connect audio pipeline
                    console.log('🔥 Teams: Connecting audio pipeline...')
                    source.connect(gainNode)
                    console.log('🔥 Teams: Source → Gain connected')
                    gainNode.connect(processor)
                    console.log('🔥 Teams: Gain → Processor connected')
                    processor.connect(context.destination)
                    console.log('🔥 Teams: Processor → Destination connected')
                    
                    diag.push(`✅ Teams: Audio capture setup complete for element ${index}`)
                    audioSetupSuccess = true
                  }
                } catch (elementError) {
                  diag.push(`❌ Teams: Error setting up audio for element ${index}: ${elementError}`)
                }
              })
            }
            
            // Set success flag and resolve after setup
            setTimeout(() => {
              diagnostics.push(`✅ Teams: Audio capture setup completed. Success: ${audioSetupSuccess}`)
              resolve({
                success: audioSetupSuccess,
                diagnostics: diagnostics,
                elementsFound: audioElements.length,
                platform: 'teams'
              })
            }, 2000)
            
          } catch (error) {
            diagnostics.push(`❌ Teams: Browser-side audio capture error: ${error}`)
            resolve({
              success: false,
              diagnostics: diagnostics,
              error: error instanceof Error ? error.message : String(error),
              platform: 'teams'
            })
          }
        })
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Teams audio capture timeout')), 15000)
      )
    ])
    
    console.log('🎧 Teams audio capture result:', JSON.stringify(teamsAudioResult, null, 2))
    
  } catch (error) {
    console.log('❌ Teams: Error setting up browser-side audio capture:', error)
  }

  
  // ✅ Step 7: Verify camera and microphone are still disabled in the meeting
  console.log('🔍 Verifying camera and microphone are disabled in the meeting...')
  await delay(3000) // Wait for meeting interface to load
  
  try {
    // Check if camera is still disabled in meeting
    const inMeetingCameraSelectors = [
      'button[data-tid="camera-button"]',
      'button[aria-label*="camera"]',
      'button[title*="camera"]',
      'button[data-tid="toggle-camera"]',
      'div[data-tid="camera-button"] button',
      'button:has([data-tid="camera-off"])',
      'button[aria-label*="Turn on camera"]',
      'button[aria-label*="Start camera"]'
    ]
    
    let cameraStillDisabled = false
    for (const selector of inMeetingCameraSelectors) {
      try {
        const cameraButton = await page.$(selector)
        if (cameraButton) {
          const buttonState = await page.evaluate((el: Element) => {
            const element = el as HTMLElement
            return {
              ariaPressed: element.getAttribute('aria-pressed'),
              ariaLabel: element.getAttribute('aria-label'),
              className: element.className,
              title: element.title
            }
          }, cameraButton)
          
          console.log(`📊 In-meeting camera button state:`, JSON.stringify(buttonState, null, 2))
          
          // Camera is disabled if button says "Turn camera on" or "Enable camera"
          // Camera is enabled if button says "Turn camera off" or "Disable camera"
          const isCameraDisabled = 
            buttonState.ariaPressed === 'false' ||
            buttonState.ariaLabel?.toLowerCase().includes('turn camera on') ||
            buttonState.ariaLabel?.toLowerCase().includes('turn on camera') ||
            buttonState.ariaLabel?.toLowerCase().includes('enable camera') ||
            buttonState.ariaLabel?.toLowerCase().includes('start camera') ||
            buttonState.className?.includes('camera-off') ||
            buttonState.className?.includes('disabled')
          
          console.log(`🔍 In-meeting camera analysis: ariaLabel="${buttonState.ariaLabel}", isCameraDisabled=${isCameraDisabled}`)
          
          if (isCameraDisabled) {
            console.log('✅ Camera is confirmed disabled in meeting.')
            cameraStillDisabled = true
          } else {
            console.log('⚠️ Camera might be enabled in meeting, attempting to disable...')
            await cameraButton.click()
            await delay(1000)
            console.log('✅ Camera disabled in meeting.')
            cameraStillDisabled = true
          }
          break
        }
      } catch (error) {
        console.log(`⚠️ Error checking in-meeting camera with selector ${selector}:`, error)
      }
    }
    
    if (!cameraStillDisabled) {
      console.log('⚠️ Could not verify camera state in meeting')
    }
  } catch (error) {
    console.error('❌ Error verifying camera in meeting:', error)
  }
  
  try {
    // Check if microphone is still disabled in meeting  
    const inMeetingMicSelectors = [
      'button[data-tid="microphone-button"]',
      'button[data-tid="mic-button"]',
      'button[aria-label*="microphone"]',
      'button[aria-label*="Microphone"]',
      'button[aria-label*="mute"]',
      'button[aria-label*="Mute"]',
      'button[title*="microphone"]',
      'button[title*="mute"]',
      'button[data-tid="toggle-mute"]',
      'div[data-tid="microphone-button"] button',
      'button:has([data-tid="mic-off"])',
      'button[aria-label*="Unmute"]',
      'button[aria-label*="Turn on microphone"]'
    ]
    
    let micStillDisabled = false
    for (const selector of inMeetingMicSelectors) {
      try {
        const micButton = await page.$(selector)
        if (micButton) {
          const buttonState = await page.evaluate((el: Element) => {
            const element = el as HTMLElement
            return {
              ariaPressed: element.getAttribute('aria-pressed'),
              ariaLabel: element.getAttribute('aria-label'),
              className: element.className,
              title: element.title
            }
          }, micButton)
          
          console.log(`📊 In-meeting microphone button state:`, JSON.stringify(buttonState, null, 2))
          
          // Microphone is disabled if button says "Unmute" or "Turn on microphone"
          // Microphone is enabled if button says "Mute" or "Turn off microphone"
          const isMicDisabled = 
            buttonState.ariaPressed === 'true' ||
            buttonState.ariaLabel?.toLowerCase().includes('unmute') ||
            buttonState.ariaLabel?.toLowerCase().includes('turn on microphone') ||
            buttonState.ariaLabel?.toLowerCase().includes('turn microphone on') ||
            buttonState.ariaLabel?.toLowerCase().includes('enable microphone') ||
            buttonState.className?.includes('muted') ||
            buttonState.className?.includes('mic-off')
          
          console.log(`🔍 In-meeting microphone analysis: ariaLabel="${buttonState.ariaLabel}", isMicDisabled=${isMicDisabled}`)
          
          if (isMicDisabled) {
            console.log('✅ Microphone is confirmed muted in meeting.')
            micStillDisabled = true
          } else {
            console.log('⚠️ Microphone might be enabled in meeting, attempting to mute...')
            await micButton.click()
            await delay(1000)
            console.log('✅ Microphone muted in meeting.')
            micStillDisabled = true
          }
          break
        }
      } catch (error) {
        console.log(`⚠️ Error checking in-meeting microphone with selector ${selector}:`, error)
      }
    }
    
    if (!micStillDisabled) {
      console.log('⚠️ Could not verify microphone state in meeting')
    }
  } catch (error) {
    console.error('❌ Error verifying microphone in meeting:', error)
  }
  

  
  console.log('🔇 Camera and microphone verification in meeting completed.')

  // ✅ **Final Verification Summary**
  console.log('📋 Final verification summary:')
  try {
    const finalState = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'))
      let micState = 'unknown'
      let cameraState = 'unknown'
      
      for (const btn of buttons) {
        const label = btn.getAttribute('aria-label')?.toLowerCase() || ''
        const text = btn.textContent?.toLowerCase() || ''
        
        // Check microphone state
        if (label.includes('unmute') || (label.includes('turn on') && label.includes('microphone'))) {
          micState = 'muted' // If button says "unmute", mic is muted ✅
        } else if (label.includes('mute') && !label.includes('unmute')) {
          micState = 'active' // If button says "mute", mic is active ❌
        }
        
        // Check camera state  
        if (label.includes('turn on') && (label.includes('video') || label.includes('camera'))) {
          cameraState = 'disabled' // If button says "turn on video", camera is disabled ✅
        } else if (label.includes('start') && (label.includes('video') || label.includes('camera'))) {
          cameraState = 'disabled' // If button says "start video", camera is disabled ✅
        } else if (label.includes('stop') && (label.includes('video') || label.includes('camera'))) {
          cameraState = 'active' // If button says "stop video", camera is active ❌
        } else if (label.includes('turn off') && (label.includes('video') || label.includes('camera'))) {
          cameraState = 'active' // If button says "turn off video", camera is active ❌
        }
      }
      
      return { micState, cameraState }
    })
    
    console.log(`🎤 Microphone final state: ${finalState.micState}`)
    console.log(`📷 Camera final state: ${finalState.cameraState}`)
    
    if (finalState.micState === 'muted' && finalState.cameraState === 'disabled') {
      console.log('✅ SUCCESS: Both microphone and camera are properly disabled!')
    } else {
      console.log('⚠️ WARNING: Some controls may still be active - check manually if needed')
    }
    
  } catch (summaryError) {
    console.log('⚠️ Could not verify final state:', summaryError instanceof Error ? summaryError.message : summaryError)
  }

  // ✅ **UPDATE DYNAMODB STATUS TO 'RECORDING'** - Teams Successfully Joined
  console.log('📊 Updating DynamoDB status to "recording" - Teams bot successfully joined!')
  if (state.meetingId) {
    try {
      const { markMeetingAsRecording } = await import('./dynamo.ts')
      await markMeetingAsRecording(state.meetingId)
      console.log('✅ Teams: DynamoDB status updated to "recording"')
    } catch (error) {
      console.error('❌ Teams: Error updating DynamoDB status to recording:', error)
    }
  }
}

// ✅ **Zoom Joining Logic** - Based on your exact working code
async function joinZoom(page: Page) {
  console.log('🎯 Starting Zoom meeting join with PROVEN approach...')
  
  // Human-like random delay function (EXACT from your working code)
  const randomDelay = (min: number = 1000, max: number = 3000) => {
        return new Promise(resolve => setTimeout(resolve, Math.random() * (max - min) + min))
  }

  try {
    // Set viewport to common resolution (from your working code)
    await page.setViewport({ width: 1920, height: 1080 })

    // Additional stealth measures (from your working code)
    await page.evaluateOnNewDocument(() => {
      // Remove webdriver property
      delete Object.getPrototypeOf(navigator).webdriver
      
      // Override the `plugins` property to use a custom getter.
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      })
      
      // Override the `languages` property to use a custom getter.
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
      })
      
      // Override the `webdriver` property to use a custom getter.
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
      })
      
      // Mock chrome object
      ;(window as any).chrome = {
        runtime: {},
        loadTimes: function() {},
        csi: function() {},
        app: {}
      }
      
      // Mock notification permission
      const originalQuery = window.navigator.permissions.query
      window.navigator.permissions.query = (parameters: PermissionDescriptor) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: Notification.permission } as PermissionStatus) :
          originalQuery(parameters)
      )
    })

    // ✅ **ZOOM OPTIMIZATION**: Reduced delay for faster join
    // Still keep some delay for anti-detection, but much shorter
    await randomDelay(500, 1000)

    // ✅ **Accept cookies if prompted** (EXACT from your working code)
    try {
      await page.waitForSelector('button#onetrust-accept-btn-handler', { timeout: 5000 })
      await randomDelay(500, 1500)
      await page.click('button#onetrust-accept-btn-handler')
      console.log('✅ Accepted cookies.')
    } catch {
      console.log('ℹ️ No cookies popup found, continuing...')
    }

    // ✅ **Handle Camera/Mic Permission Popup** (EXACT from your working code)
    try {
      await page.waitForSelector('.allow-permission-prompt', { timeout: 5000 })
      console.log('🔒 Permission popup detected!')
      
      await randomDelay(1000, 2000)
      
      // Try to find and click Allow button instead of removing modal (from your working code)
      const allowButton = await page.$('button[aria-label*="Allow"], button:contains("Allow"), button[data-selenium*="allow"]')
      if (allowButton) {
        await allowButton.click()
        console.log('✅ Clicked Allow on permission popup.')
      } else {
        // Fallback to removing modal (from your working code)
        await page.evaluate(() => {
          let modal = document.querySelector('.ReactModalPortal')
          if (modal) modal.remove()
        })
        console.log('✅ Permission popup removed.')
      }
    } catch {
      console.log('ℹ️ No permission popup detected.')
    }

    // Use bot name from state
    console.log(`🤖 Using name: ${state.botName}`)

    // ✅ **Enter bot name with human-like typing** (EXACT from your working code)
    await page.waitForSelector('#input-for-name', { timeout: 10000 })
    await page.click('#input-for-name', { clickCount: 3 }) // Select all existing text
    await randomDelay(300, 800)
    
    // Type with realistic delays between characters (EXACT from your working code)
    for (const char of state.botName) {
      await page.keyboard.type(char)
      await randomDelay(50, 200)
    }

    await randomDelay(1000, 2000)

    // ✅ **PRIORITY: Disable Camera and Microphone BEFORE Joining**
    console.log('🔇 PRIORITY: Disabling camera and microphone BEFORE joining Zoom meeting...')
    
    // Disable camera first - comprehensive Zoom selectors
    console.log('📷 PRIORITY: Disabling camera before joining...')
    const cameraSelectors = [
      // Zoom pre-join camera selectors
      '#preview-video-control-button',
      'button[aria-label*="Turn off camera"]',
      'button[aria-label*="Stop camera"]',
      'button[aria-label*="Disable camera"]',
      'button[aria-label*="camera"]',
      'button[aria-label*="Camera"]',
      'button[title*="camera"]',
      'button[title*="Camera"]',
      'button[class*="camera"]',
      'button[class*="video"]',
      '[data-testid*="camera"]',
      '[data-testid*="video"]',
      'button[aria-label*="Turn on camera"]', // If already off, this text appears
      'button[aria-label*="Start camera"]',
      '.preview-video-control button',
      '#preview-video-button',
      'button:has([class*="camera"])',
      'button:has([class*="video"])'
    ]
    
    let cameraDisabled = false
    for (const selector of cameraSelectors) {
      try {
        const cameraButton = await page.$(selector)
        if (cameraButton) {
          console.log(`🔍 Found camera button with selector: ${selector}`)
          
          // Check button state to determine if camera is on/off
          const buttonState = await page.evaluate((el: Element) => {
            const element = el as HTMLElement
            return {
              ariaLabel: element.getAttribute('aria-label'),
              title: element.title,
              className: element.className,
              textContent: element.textContent?.trim(),
              disabled: element.hasAttribute('disabled'),
              pressed: element.getAttribute('aria-pressed'),
            }
          }, cameraButton)
          
          console.log(`📊 Camera button state:`, JSON.stringify(buttonState, null, 2))
          
          // Determine if camera is currently ON and needs to be turned OFF
          // If button says "Turn off camera" or "Stop camera" or "Stop Video" - camera is ON
          // If button says "Turn on camera" or "Start camera" - camera is already OFF
          const isCameraOn = 
            buttonState.ariaLabel?.toLowerCase().includes('turn off camera') ||
            buttonState.ariaLabel?.toLowerCase().includes('stop camera') ||
            buttonState.ariaLabel?.toLowerCase().includes('disable camera') ||
            buttonState.ariaLabel?.toLowerCase().includes('stop video') ||
            buttonState.ariaLabel?.toLowerCase().includes('turn off video') ||
            buttonState.ariaLabel?.toLowerCase().includes('stop my video') ||
            buttonState.ariaLabel?.toLowerCase().includes('turn off my video') ||
            buttonState.textContent?.toLowerCase().includes('stop video') ||
            (buttonState.ariaLabel?.toLowerCase().includes('camera') && 
             !buttonState.ariaLabel?.toLowerCase().includes('turn on') &&
             !buttonState.ariaLabel?.toLowerCase().includes('start') &&
             !buttonState.ariaLabel?.toLowerCase().includes('enable')) ||
            buttonState.pressed === 'true'
          
          console.log(`🔍 Camera analysis: ariaLabel="${buttonState.ariaLabel}", pressed="${buttonState.pressed}", isCameraOn=${isCameraOn}`)
          
          if (isCameraOn) {
            console.log('📷 Camera is ON, disabling NOW before joining...')
            await randomDelay(500, 1000)
            await cameraButton.click()
            await randomDelay(500, 1000)
            console.log('✅ Camera disabled BEFORE joining.')
            cameraDisabled = true
            break
          } else {
            console.log('📷 Camera is already OFF or disabled.')
            cameraDisabled = true
            break
          }
        }
      } catch (error) {
        console.log(`⚠️ Error checking camera button with selector ${selector}:`, error instanceof Error ? error.message : error)
      }
    }
    
    if (!cameraDisabled) {
      console.log('⚠️ No camera button found - camera may already be disabled by default')
    }

    // Disable microphone - comprehensive Zoom selectors
    console.log('🎤 PRIORITY: Disabling microphone before joining...')
    const micSelectors = [
      // Zoom pre-join microphone selectors
      '#preview-audio-control-button',
      'button[aria-label*="Mute microphone"]',
      'button[aria-label*="Turn off microphone"]',
      'button[aria-label*="Disable microphone"]',
      'button[aria-label*="mute"]',
      'button[aria-label*="Mute"]',
      'button[aria-label*="microphone"]',
      'button[aria-label*="Microphone"]',
      'button[title*="mute"]',
      'button[title*="Mute"]',
      'button[title*="microphone"]',
      'button[title*="Microphone"]',
      'button[class*="mute"]',
      'button[class*="audio"]',
      '[data-testid*="mute"]',
      '[data-testid*="audio"]',
      'button[aria-label*="Unmute microphone"]', // If already muted, this text appears
      'button[aria-label*="Turn on microphone"]',
      '.preview-audio-control button',
      '#preview-audio-button',
      'button:has([class*="mute"])',
      'button:has([class*="audio"])'
    ]
    
    let micDisabled = false
    for (const selector of micSelectors) {
      try {
        const micButton = await page.$(selector)
        if (micButton) {
          console.log(`🔍 Found microphone button with selector: ${selector}`)
          
          // Check button state to determine if mic is on/off
          const buttonState = await page.evaluate((el: Element) => {
            const element = el as HTMLElement
            return {
              ariaLabel: element.getAttribute('aria-label'),
              title: element.title,
              className: element.className,
              textContent: element.textContent?.trim(),
              disabled: element.hasAttribute('disabled'),
              pressed: element.getAttribute('aria-pressed'),
            }
          }, micButton)
          
          console.log(`📊 Microphone button state:`, JSON.stringify(buttonState, null, 2))
          
          // Determine if microphone is currently ON and needs to be MUTED
          // If button says "Mute microphone" or "Turn off microphone" - mic is ON
          // If button says "Unmute microphone" or "Turn on microphone" - mic is already MUTED
          const isMicOn = 
            buttonState.ariaLabel?.toLowerCase().includes('mute microphone') ||
            buttonState.ariaLabel?.toLowerCase().includes('turn off microphone') ||
            buttonState.ariaLabel?.toLowerCase().includes('disable microphone') ||
            (buttonState.ariaLabel?.toLowerCase().includes('microphone') && 
             !buttonState.ariaLabel?.toLowerCase().includes('unmute') &&
             !buttonState.ariaLabel?.toLowerCase().includes('turn on') &&
             !buttonState.ariaLabel?.toLowerCase().includes('enable')) ||
            (buttonState.ariaLabel?.toLowerCase().includes('mute') && 
             !buttonState.ariaLabel?.toLowerCase().includes('unmute')) ||
            buttonState.pressed === 'false' // For Zoom, pressed="false" often means mic is ON
          
          console.log(`🔍 Microphone analysis: ariaLabel="${buttonState.ariaLabel}", pressed="${buttonState.pressed}", isMicOn=${isMicOn}`)
          
          if (isMicOn) {
            console.log('🎤 Microphone is ON, muting NOW before joining...')
            await randomDelay(500, 1000)
            await micButton.click()
            await randomDelay(500, 1000)
            console.log('✅ Microphone muted BEFORE joining.')
            micDisabled = true
            break
          } else {
            console.log('🎤 Microphone is already muted or disabled.')
            micDisabled = true
          break
          }
        }
      } catch (error) {
        console.log(`⚠️ Error checking microphone button with selector ${selector}:`, error instanceof Error ? error.message : error)
      }
    }
    
    if (!micDisabled) {
      console.log('⚠️ No microphone button found - mic may already be muted by default')
    }

    // Wait for UI to stabilize after camera/mic changes
    await randomDelay(1000, 2000)
    console.log('✅ PRIORITY: Camera and microphone controls completed BEFORE joining.')

    // ✅ **Click Join Button** (EXACT from your working code)
    await page.waitForSelector('button.preview-join-button', { timeout: 5000 })
    await randomDelay(500, 1500)
    await page.evaluate(() => {
      const button = document.querySelector('button.preview-join-button') as HTMLButtonElement
      if (button) button.click()
    })

    console.log('✅ Bot joined Zoom successfully!')

    // ✅ **Wait for meeting to fully load** (EXACT from your working code)
    console.log('⏳ Waiting for meeting UI to fully load...')
    await randomDelay(8000, 12000)

    // ✅ **Enable system audio capture** (from your working code)
    await page.evaluate(() => {
      // Override audio context to capture system audio
      const originalGetUserMedia = navigator.mediaDevices.getUserMedia
      navigator.mediaDevices.getUserMedia = function(constraints: any) {
        if (constraints && constraints.audio) {
          constraints.audio = {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
            sampleRate: 44100,
            channelCount: 2
          }
        }
        return originalGetUserMedia.call(this, constraints)
      }
    })

    // ✅ **Wait for Video Elements and ensure audio is available** (from your working code)
    console.log('⏳ Waiting for media elements...')
    try {
      await page.waitForSelector('video, audio', { timeout: 20000 })
      console.log('✅ Media elements detected, proceeding...')
      
      // Wait a bit more for audio streams to establish (from your working code)
      await randomDelay(5000, 8000)
    } catch {
      console.log('⚠️ No media elements detected. Continuing anyway...')
    }

    // ✅ **Handle microphone muting for both pre-join and in-meeting states**
    console.log('🎤 Verifying microphone and camera are disabled in meeting...')
    
    // First verify microphone is muted in the meeting
    const inMeetingMuteSelectors = [
      // Zoom in-meeting mute selectors
      'button[aria-label*="Unmute microphone"]', // If muted, button shows "Unmute"
      'button[aria-label*="Unmute"]',
      'button[aria-label*="Turn on microphone"]',
      'button[aria-label*="Enable microphone"]',
      'button[aria-label*="Mute microphone"]', // If unmuted, button shows "Mute"
      'button[aria-label*="Mute"]',
      'button[aria-label*="Turn off microphone"]',
      'button[aria-label*="microphone"]',
      'button[aria-label*="Microphone"]',
      'button[title*="mute"]',
      'button[title*="Mute"]',
      'button[class*="mute"]',
      'button[class*="audio"]',
      '[data-testid*="mute"]',
      '[data-testid*="audio"]',
      '.audio-control button',
      '.mic-control button'
    ]
    
    let micVerified = false
    for (const selector of inMeetingMuteSelectors) {
      try {
        const muteButton = await page.$(selector)
        if (muteButton) {
          console.log(`🔍 Found mute button with selector: ${selector}`)
          
          // Check button state
          const buttonState = await page.evaluate((el: Element) => {
            const element = el as HTMLElement
            return {
              ariaLabel: element.getAttribute('aria-label'),
              title: element.title,
              className: element.className,
              textContent: element.textContent?.trim(),
              pressed: element.getAttribute('aria-pressed'),
            }
          }, muteButton)
          
          console.log(`📊 In-meeting mute button state:`, JSON.stringify(buttonState, null, 2))
          
          // If button says "Unmute" or "Turn on microphone" - mic is already MUTED ✅
          // If button says "Mute" or "Turn off microphone" - mic is ON and needs to be muted
          const isMicMuted = 
            buttonState.ariaLabel?.toLowerCase().includes('unmute') ||
            buttonState.ariaLabel?.toLowerCase().includes('turn on microphone') ||
            buttonState.ariaLabel?.toLowerCase().includes('enable microphone') ||
            buttonState.pressed === 'true' // pressed="true" often means muted
          
          const isMicOn = 
            buttonState.ariaLabel?.toLowerCase().includes('mute microphone') ||
            buttonState.ariaLabel?.toLowerCase().includes('turn off microphone') ||
            buttonState.ariaLabel?.toLowerCase().includes('disable microphone') ||
            (buttonState.ariaLabel?.toLowerCase().includes('mute') && 
             !buttonState.ariaLabel?.toLowerCase().includes('unmute')) ||
            buttonState.pressed === 'false'
          
          console.log(`🔍 Microphone verification: isMuted=${isMicMuted}, isOn=${isMicOn}`)
          
          if (isMicMuted) {
            console.log('✅ Microphone is properly muted in meeting.')
            micVerified = true
               break
          } else if (isMicOn) {
            console.log('🎤 Microphone is ON in meeting, muting now...')
            await randomDelay(500, 1000)
            await muteButton.click()
            await randomDelay(500, 1000)
            console.log('✅ Microphone muted in meeting.')
            micVerified = true
               break
          }
        }
      } catch (error) {
        console.log(`⚠️ Error with mute selector ${selector}:`, error instanceof Error ? error.message : error)
      }
    }
    
    if (!micVerified) {
      console.log('⚠️ Could not verify microphone state - attempting fallback mute...')
      
      // Fallback: Try to find and mute via JavaScript
      try {
        const jsResult = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'))
          for (const btn of buttons) {
            const label = btn.getAttribute('aria-label')?.toLowerCase() || ''
            const title = btn.title?.toLowerCase() || ''
            const text = btn.textContent?.toLowerCase() || ''
            
            // Look for buttons that would mute the mic (not unmute)
            if ((label.includes('mute') && !label.includes('unmute')) ||
                (title.includes('mute') && !title.includes('unmute')) ||
                (text.includes('mute') && !text.includes('unmute'))) {
              console.log('Found potential mute button:', { label, title, text })
              ;(btn as HTMLButtonElement).click()
              return true
            }
          }
          return false
        })
        
        if (jsResult) {
          console.log('✅ JavaScript mute attempt completed!')
        } else {
          console.log('⚠️ No mute button found via JavaScript.')
        }
      } catch (jsError) {
        console.log('❌ JavaScript mute failed:', jsError instanceof Error ? jsError.message : jsError)
      }
    }

    // Now verify camera is disabled in the meeting
    console.log('📷 Verifying camera is disabled in meeting...')
    const inMeetingCameraSelectors = [
      // Zoom in-meeting camera selectors - comprehensive list
      'button[aria-label*="Turn on camera"]', // If camera off, button shows "Turn on"
      'button[aria-label*="Start camera"]',
      'button[aria-label*="Enable camera"]',
      'button[aria-label*="Turn off camera"]', // If camera on, button shows "Turn off"
      'button[aria-label*="Stop camera"]',
      'button[aria-label*="Disable camera"]',
      'button[aria-label*="stop my video"]', // Zoom often uses this exact text
      'button[aria-label*="turn off my video"]',
      'button[aria-label*="start my video"]',
      'button[aria-label*="turn on my video"]',
      'button[aria-label*="stop video"]',
      'button[aria-label*="turn off video"]',
      'button[aria-label*="start video"]',
      'button[aria-label*="turn on video"]',
      'button[aria-label*="camera"]',
      'button[aria-label*="Camera"]',
      'button[aria-label*="video"]',
      'button[aria-label*="Video"]',
      'button[title*="camera"]',
      'button[title*="Camera"]',
      'button[title*="video"]',
      'button[title*="Video"]',
      'button[class*="camera"]',
      'button[class*="video"]',
      'button[class*="send-video"]', // Zoom uses send-video-container class
      '[data-testid*="camera"]',
      '[data-testid*="video"]',
      '.video-control button',
      '.camera-control button',
      '.send-video-container button', // Zoom-specific class
      '.footer-button-base__button[class*="video"]',
      'button:has([class*="video"])',
      'button:has([class*="camera"])'
    ]
    
    let cameraVerified = false
    for (const selector of inMeetingCameraSelectors) {
      try {
        const cameraButton = await page.$(selector)
        if (cameraButton) {
          console.log(`🔍 Found camera button with selector: ${selector}`)
          
          // Check button state
          const buttonState = await page.evaluate((el: Element) => {
            const element = el as HTMLElement
            return {
              ariaLabel: element.getAttribute('aria-label'),
              title: element.title,
              className: element.className,
              textContent: element.textContent?.trim(),
              pressed: element.getAttribute('aria-pressed'),
            }
          }, cameraButton)
          
          console.log(`📊 In-meeting camera button state:`, JSON.stringify(buttonState, null, 2))
          
          // If button says "Turn on camera" or "Start camera" - camera is already OFF ✅
          // If button says "Turn off camera" or "Stop camera" or "stop my video" - camera is ON and needs to be turned off
          const isCameraOff = 
            buttonState.ariaLabel?.toLowerCase().includes('turn on camera') ||
            buttonState.ariaLabel?.toLowerCase().includes('start camera') ||
            buttonState.ariaLabel?.toLowerCase().includes('enable camera') ||
            buttonState.ariaLabel?.toLowerCase().includes('start my video') ||
            buttonState.ariaLabel?.toLowerCase().includes('turn on my video') ||
            buttonState.pressed === 'false' // pressed="false" often means camera off
          
          const isCameraOn = 
            buttonState.ariaLabel?.toLowerCase().includes('turn off camera') ||
            buttonState.ariaLabel?.toLowerCase().includes('stop camera') ||
            buttonState.ariaLabel?.toLowerCase().includes('disable camera') ||
            buttonState.ariaLabel?.toLowerCase().includes('stop my video') || // CRITICAL: Handle "stop my video"
            buttonState.ariaLabel?.toLowerCase().includes('turn off my video') ||
            buttonState.ariaLabel?.toLowerCase().includes('stop video') ||
            buttonState.ariaLabel?.toLowerCase().includes('turn off video') ||
            buttonState.textContent?.toLowerCase().includes('stop video') ||
            buttonState.pressed === 'true'
          
          console.log(`🔍 Camera verification: isOff=${isCameraOff}, isOn=${isCameraOn}`)
          
          if (isCameraOff) {
            console.log('✅ Camera is properly disabled in meeting.')
            cameraVerified = true
            break
          } else if (isCameraOn) {
            console.log('📷 Camera is ON in meeting, disabling now...')
            await randomDelay(500, 1000)
            await cameraButton.click()
            await randomDelay(500, 1000)
            console.log('✅ Camera disabled in meeting.')
            cameraVerified = true
            break
          }
        }
      } catch (error) {
        console.log(`⚠️ Error with camera selector ${selector}:`, error instanceof Error ? error.message : error)
      }
    }
    
    if (!cameraVerified) {
      console.log('⚠️ Could not verify camera state - attempting fallback camera disable...')
      
      // Fallback: Try to find and disable camera via JavaScript
      try {
        const jsResult = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'))
          for (const btn of buttons) {
            const label = btn.getAttribute('aria-label')?.toLowerCase() || ''
            const title = btn.title?.toLowerCase() || ''
            const text = btn.textContent?.toLowerCase() || ''
            
            // Look for buttons that would disable/stop the camera (not enable/start)
            if ((label.includes('stop') && (label.includes('video') || label.includes('camera'))) ||
                (title.includes('stop') && (title.includes('video') || title.includes('camera'))) ||
                (text.includes('stop') && (text.includes('video') || text.includes('camera'))) ||
                (label.includes('turn off') && (label.includes('video') || label.includes('camera'))) ||
                (label.includes('disable') && (label.includes('video') || label.includes('camera')))) {
              console.log('Found potential camera disable button:', { label, title, text })
              ;(btn as HTMLButtonElement).click()
              return true
            }
          }
          return false
        })
        
        if (jsResult) {
          console.log('✅ JavaScript camera disable attempt completed!')
        } else {
          console.log('⚠️ No camera disable button found via JavaScript.')
        }
      } catch (jsError) {
        console.log('❌ JavaScript camera disable failed:', jsError instanceof Error ? jsError.message : jsError)
      }
    }
    
    console.log('✅ Microphone and camera verification completed!')
      
    // ✅ **Final Verification Summary**
    console.log('📋 Final verification summary:')
      try {
      const finalState = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'))
        let micState = 'unknown'
        let cameraState = 'unknown'
        
          for (const btn of buttons) {
          const label = btn.getAttribute('aria-label')?.toLowerCase() || ''
            const text = btn.textContent?.toLowerCase() || ''
            
          // Check microphone state
          if (label.includes('unmute') || (label.includes('turn on') && label.includes('microphone'))) {
            micState = 'muted' // If button says "unmute", mic is muted ✅
          } else if (label.includes('mute') && !label.includes('unmute')) {
            micState = 'active' // If button says "mute", mic is active ❌
          }
          
          // Check camera state  
          if (label.includes('turn on') && (label.includes('video') || label.includes('camera'))) {
            cameraState = 'disabled' // If button says "turn on video", camera is disabled ✅
          } else if (label.includes('start') && (label.includes('video') || label.includes('camera'))) {
            cameraState = 'disabled' // If button says "start video", camera is disabled ✅
          } else if (label.includes('stop') && (label.includes('video') || label.includes('camera'))) {
            cameraState = 'active' // If button says "stop video", camera is active ❌
          } else if (label.includes('turn off') && (label.includes('video') || label.includes('camera'))) {
            cameraState = 'active' // If button says "turn off video", camera is active ❌
          }
        }
        
        return { micState, cameraState }
      })
      
      console.log(`🎤 Microphone final state: ${finalState.micState}`)
      console.log(`📷 Camera final state: ${finalState.cameraState}`)
      
      if (finalState.micState === 'muted' && finalState.cameraState === 'disabled') {
        console.log('✅ SUCCESS: Both microphone and camera are properly disabled!')
        } else {
        console.log('⚠️ WARNING: Some controls may still be active - check manually if needed')
        }
      
    } catch (summaryError) {
      console.log('⚠️ Could not verify final state:', summaryError instanceof Error ? summaryError.message : summaryError)
      }

    // ✅ **CRITICAL: Implement Browser-Side Audio Capture System** (always for Zoom)
    console.log('🎧 Starting Zoom browser-side audio capture...')
    
    // ✅ **CRITICAL: Expose handleRealAudioChunk to browser context**
    await page.exposeFunction('handleRealAudioChunk', (audioChunk: number[], sampleRate: number = 44100) => {
      // ✅ **ZOOM STOP FIX**: Check if bot is stopping before processing audio
      if (!state.isBotRunning || state.isClosing) {
        // Bot is stopping - ignore audio chunks
        return
      }
      
      console.log(`🎵 Received audio chunk from browser: ${audioChunk.length} bytes, sample rate: ${sampleRate} Hz`)
      try {
        // Convert back to Uint8Array and send to transcription system with correct sample rate
        const uint8Array = new Uint8Array(audioChunk)
        batchAudioChunk(uint8Array, sampleRate) // FIXED: Pass the actual sample rate from browser
        // console.log(`✅ Audio chunk sent to transcription system with ${sampleRate} Hz`)
      } catch (error) {
        console.log(`❌ Error processing audio chunk:`, error)
      }
    })
    console.log('✅ handleRealAudioChunk function exposed to browser')

    // ✅ **Execute Browser-Side Audio Capture with Promise.race timeout**
    try {
      console.log('🔊 Setting up system audio capture in browser...')
      
      const systemAudioResult = await Promise.race([
        page.evaluate(() => {
          return new Promise((resolve) => {
            const diagnostics: string[] = []
            diagnostics.push('🔥 GUARANTEED: Browser-side audio capture script started')
            
            let realAudioDetected = false
            let audioChunkCount = 0
            
            // Try direct audio element capture first (most reliable for Zoom)
            const audioElements = document.querySelectorAll('audio, video')
            diagnostics.push(`📊 MediaStream details: Found ${audioElements.length} audio/video elements`)
            
            if (audioElements.length > 0) {
              diagnostics.push('🔥 GUARANTEED: Found audio/video elements, setting up direct capture')
              
              try {
                const audioContext = new AudioContext()
                diagnostics.push(`🔊 AudioContext created with sample rate: ${audioContext.sampleRate} Hz`)
                
                audioElements.forEach((element, index) => {
                  try {
                    diagnostics.push(`🔍 TRACK DEBUG: Element ${index}: ${element.tagName}`)
                    
                    let source: MediaElementAudioSourceNode | MediaStreamAudioSourceNode | null = null
                    
                    // Handle both srcObject (MediaStream) and src (URL) elements
                    if ((element as any).srcObject) {
                      diagnostics.push(`📈 Audio processing entries: Element ${index} has srcObject (MediaStream)`)
                      source = audioContext.createMediaStreamSource((element as any).srcObject)
                    } else if ((element as any).src) {
                      diagnostics.push(`📈 Audio processing entries: Element ${index} has src (${(element as any).src})`)
                      source = audioContext.createMediaElementSource(element as HTMLMediaElement)
                    }
                    
                    if (source) {
                      const processor = audioContext.createScriptProcessor(4096, 2, 2)
                      const gainNode = audioContext.createGain()
                      gainNode.gain.value = 3.0 // Boost gain for better detection
                      
                      processor.onaudioprocess = (event) => {
                        const inputData = event.inputBuffer.getChannelData(0)
                        let sum = 0
                        for (let i = 0; i < inputData.length; i++) {
                          sum += inputData[i] * inputData[i]
                        }
                        const rms = Math.sqrt(sum / inputData.length)
                        const audioLevel = rms * 100
                        
                        // Detect significant audio
                        if (audioLevel > 0.005) {
                          if (!realAudioDetected) {
                            console.log(`🎉 FIRST REAL AUDIO DETECTED! Level: ${audioLevel.toFixed(4)}`)
                            realAudioDetected = true
                          }
                          
                          // Log every 50th chunk for monitoring
                          if (audioChunkCount % 50 === 0) {
                            console.log(`🔊 Audio chunk #${audioChunkCount} - Level: ${audioLevel.toFixed(4)}`)
                          }
                          
                          // Convert to 16-bit PCM for transcription
                          const int16Array = new Int16Array(inputData.length)
                          for (let i = 0; i < inputData.length; i++) {
                            int16Array[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768))
                          }
                          
                          // Send to transcription system
                          if ((window as any).handleRealAudioChunk) {
                            (window as any).handleRealAudioChunk(Array.from(new Uint8Array(int16Array.buffer)), audioContext.sampleRate)
                          }
                          
                          audioChunkCount++
                        }
                      }
                      
                      // Connect audio pipeline
                      console.log('🔥 GUARANTEED: Connecting audio pipeline...')
                      source.connect(gainNode)
                      console.log('🔥 GUARANTEED: Source → Gain connected')
                      gainNode.connect(processor)
                      console.log('🔥 GUARANTEED: Gain → Processor connected')
                      processor.connect(audioContext.destination)
                      console.log('🔥 GUARANTEED: Processor → Destination connected')
                      
                      diagnostics.push(`✅ Audio capture setup complete for element ${index}`)
                    }
                  } catch (elementError) {
                    diagnostics.push(`❌ Error setting up audio for element ${index}: ${elementError}`)
                  }
                })
                
                diagnostics.push('✅ Direct audio element capture setup completed')
                
              } catch (audioContextError) {
                diagnostics.push(`❌ AudioContext setup failed: ${audioContextError}`)
              }
              
            } else if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
              // Fallback to getDisplayMedia for system audio
              diagnostics.push('🔄 No audio elements found, trying getDisplayMedia...')
              
              try {
                navigator.mediaDevices.getDisplayMedia({ 
                  audio: true, 
                  video: false 
                }).then(stream => {
                  diagnostics.push('✅ getDisplayMedia stream obtained')
                  
                  const audioContext = new AudioContext()
                  const source = audioContext.createMediaStreamSource(stream)
                  const processor = audioContext.createScriptProcessor(4096, 1, 1)
                  
                  processor.onaudioprocess = (event) => {
                    const inputData = event.inputBuffer.getChannelData(0)
                    let sum = 0
                    for (let i = 0; i < inputData.length; i++) {
                      sum += inputData[i] * inputData[i]
                    }
                    const rms = Math.sqrt(sum / inputData.length)
                    const audioLevel = rms * 100
                    
                    if (audioLevel > 0.005) {
                      if (!realAudioDetected) {
                        console.log(`🎉 SYSTEM AUDIO DETECTED! Level: ${audioLevel.toFixed(4)}`)
                        realAudioDetected = true
                      }
                      
                      const int16Array = new Int16Array(inputData.length)
                      for (let i = 0; i < inputData.length; i++) {
                        int16Array[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768))
                      }
                      
                      if ((window as any).handleRealAudioChunk) {
                        (window as any).handleRealAudioChunk(Array.from(new Uint8Array(int16Array.buffer)), audioContext.sampleRate)
                      }
                      
                      audioChunkCount++
                    }
                  }
                  
                  source.connect(processor)
                  processor.connect(audioContext.destination)
                  
                }).catch(error => {
                  diagnostics.push(`❌ getDisplayMedia failed: ${error}`)
                })
                
              } catch (displayMediaError) {
                diagnostics.push(`❌ getDisplayMedia not available: ${displayMediaError}`)
              }
            } else {
              diagnostics.push('❌ No audio capture methods available')
            }
            
            diagnostics.push('🔥 GUARANTEED: Audio capture setup completed')
            
            // ✅ **ZOOM OPTIMIZATION**: Return immediately, no delay needed
            // Audio capture is already working and will start streaming to Assembly.ai right away
            resolve({
              success: true,
              audioElementsFound: audioElements.length,
              diagnostics: diagnostics,
              realAudioDetected: realAudioDetected,
              audioChunkCount: audioChunkCount
            })
          })
        }),
        // Timeout promise
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Audio setup timeout')), 15000)
        )
      ])
      
      console.log('✅ System audio capture result:', systemAudioResult)
      
      if (systemAudioResult && typeof systemAudioResult === 'object') {
        const result = systemAudioResult as any
        console.log(`📊 Audio setup completed - Elements: ${result.audioElementsFound}, Success: ${result.success}`)
        
        if (result.diagnostics && Array.isArray(result.diagnostics)) {
          result.diagnostics.forEach((diagnostic: string) => {
            console.log(`🔍 Diagnostic: ${diagnostic}`)
          })
        }
      }
      
    } catch (audioError) {
      console.log('❌ System audio setup error:', audioError)
      console.log('❌ Will continue without real-time audio capture')
    }

    // ✅ ** Anti-Detection Strategy** - Start immediately after joining
    console.log('🕵️ Starting anti-detection measures...')
    await startAntiDetectionBehavior(page)

    console.log('🟡 Zoom joining process completed with system audio capture approach.')

    // ✅ **UPDATE DYNAMODB STATUS TO 'RECORDING'** - Zoom Successfully Joined
    console.log('📊 Updating DynamoDB status to "recording" - Zoom bot successfully joined!')
    if (state.meetingId) {
      try {
        const { markMeetingAsRecording } = await import('./dynamo.ts')
        await markMeetingAsRecording(state.meetingId)
        console.log('✅ Zoom: DynamoDB status updated to "recording"')
      } catch (error) {
        console.error('❌ Zoom: Error updating DynamoDB status to recording:', error)
      }
    }

  } catch (error) {
    console.log('❌ Error in Zoom joining process:', error instanceof Error ? error.message : error)
    throw error
  }
}

// ✅ ** Anti-Detection Behavior System**
async function startAntiDetectionBehavior(page: Page) {
  console.log('🤖 Initializing human-like behavior patterns...')
  
  // Start multiple behavior patterns simultaneously
  Promise.all([
    simulateHumanMouseActivity(page),
    simulateRealisticScrolling(page),
    simulatePeriodicInteractions(page),
    preventIdleDetection(page),
  ]).catch(error => {
    console.log('⚠️ Anti-detection behavior error (continuing):', error instanceof Error ? error.message : error)
  })
}

// 🖱️ **Human-like Mouse Movement Pattern**
async function simulateHumanMouseActivity(page: Page) {
  const randomDelay = (min: number = 3000, max: number = 8000) => {
    return new Promise(resolve => setTimeout(resolve, Math.random() * (max - min) + min))
  }
  
  while (state.isBotRunning && !state.isClosing) {
    try {
      await randomDelay(5000, 15000) // Random interval between movements
      
      if (!state.isBotRunning || state.isClosing) break
      
      // Generate realistic mouse coordinates (avoid edges)
      const x = Math.floor(Math.random() * 800) + 200
      const y = Math.floor(Math.random() * 400) + 200
      
      // Smooth mouse movement with human-like curves
      await page.mouse.move(x, y, { steps: Math.floor(Math.random() * 5) + 3 })
      
      // Occasionally simulate micro-movements (human fidgeting)
      if (Math.random() < 0.3) {
        await page.mouse.move(x + Math.random() * 20 - 10, y + Math.random() * 20 - 10, { steps: 2 })
      }
      
      console.log(`🖱️ Human-like mouse movement to (${x}, ${y})`)
      
    } catch (error) {
      console.log('⚠️ Mouse simulation error:', error instanceof Error ? error.message : error)
      await randomDelay(10000, 20000) // Wait longer on error
    }
  }
}

// 📜 **Realistic Scrolling Behavior**
async function simulateRealisticScrolling(page: Page) {
  const randomDelay = (min: number = 8000, max: number = 20000) => {
    return new Promise(resolve => setTimeout(resolve, Math.random() * (max - min) + min))
  }
  
  while (state.isBotRunning && !state.isClosing) {
    try {
      await randomDelay(10000, 25000)
      
      if (!state.isBotRunning || state.isClosing) break
      
      // Random scroll direction and amount
      const scrollDelta = Math.random() < 0.5 ? 
        -(Math.random() * 200 + 50) : // Scroll up
        (Math.random() * 200 + 50)    // Scroll down
      
      await page.mouse.wheel({ deltaY: scrollDelta })
      
      // Sometimes do multiple small scrolls (reading behavior)
      if (Math.random() < 0.4) {
        await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200))
        await page.mouse.wheel({ deltaY: scrollDelta * 0.3 })
      }
      
      console.log(`📜 Realistic scroll (${scrollDelta > 0 ? 'down' : 'up'}: ${Math.abs(scrollDelta)})`)
      
    } catch (error) {
      console.log('⚠️ Scroll simulation error:', error instanceof Error ? error.message : error)
      await randomDelay(15000, 30000)
    }
  }
}

// 👆 **Periodic Human-like Interactions**
async function simulatePeriodicInteractions(page: Page) {
  const randomDelay = (min: number = 15000, max: number = 40000) => {
    return new Promise(resolve => setTimeout(resolve, Math.random() * (max - min) + min))
  }
  
  while (state.isBotRunning && !state.isClosing) {
    try {
      await randomDelay(20000, 50000) // Longer intervals for interactions
      
      if (!state.isBotRunning || state.isClosing) break
      
      // Randomly choose an interaction type
      const interactions = [
        'hover_participant',
        'brief_focus_change',
        'subtle_click',
        'keyboard_activity'
      ]
      
      const interaction = interactions[Math.floor(Math.random() * interactions.length)]
      
      switch (interaction) {
        case 'hover_participant':
          await simulateParticipantHover(page)
          break
        case 'brief_focus_change':
          await simulateFocusChange(page)
          break
        case 'subtle_click':
          await simulateSubtleClick(page)
          break
        case 'keyboard_activity':
          await simulateKeyboardActivity(page)
          break
      }
      
      console.log(`👆 Performed interaction - ${interaction}`)
      
    } catch (error) {
      console.log('⚠️ Interaction simulation error:', error instanceof Error ? error.message : error)
      await randomDelay(30000, 60000)
    }
  }
}

// 👥 **Simulate hovering over participant video (natural curiosity)**
async function simulateParticipantHover(page: Page) {
  try {
    const videos = await page.$$('video')
    if (videos.length > 0) {
      const randomVideo = videos[Math.floor(Math.random() * videos.length)]
      const box = await randomVideo.boundingBox()
      
      if (box) {
        await page.mouse.move(
          box.x + box.width * (0.3 + Math.random() * 0.4),
          box.y + box.height * (0.3 + Math.random() * 0.4),
          { steps: 5 }
        )
        await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 3000))
      }
    }
  } catch (error) {
    console.log('⚠️ Participant hover simulation failed')
  }
}

// 🎯 **Simulate focus changes (natural attention shifts)**
async function simulateFocusChange(page: Page) {
  try {
    // Simulate Alt+Tab or clicking somewhere else briefly
    await page.keyboard.down('Alt')
    await new Promise(resolve => setTimeout(resolve, 100))
    await page.keyboard.up('Alt')
    
    // Brief delay to simulate looking away
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000))
  } catch (error) {
    console.log('⚠️ Focus change simulation failed')
  }
}

// 🖱️ **Subtle clicks on non-interactive areas**
async function simulateSubtleClick(page: Page) {
  try {
    // Click on empty areas that won't trigger actions
    const x = Math.floor(Math.random() * 400) + 300
    const y = Math.floor(Math.random() * 200) + 200
    
    await page.mouse.click(x, y)
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000))
  } catch (error) {
    console.log('⚠️ Subtle click simulation failed')
  }
}

// ⌨️ **Subtle keyboard activity (non-disruptive)**
async function simulateKeyboardActivity(page: Page) {
  try {
    // Simulate keyboard presence without typing visible characters
    await page.keyboard.down('Shift')
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200))
    await page.keyboard.up('Shift')
  } catch (error) {
    console.log('⚠️ Keyboard activity simulation failed')
  }
}

// 🚫 **Prevent Idle Detection**
async function preventIdleDetection(page: Page) {
  const randomDelay = (min: number = 25000, max: number = 45000) => {
    return new Promise(resolve => setTimeout(resolve, Math.random() * (max - min) + min))
  }
  
  while (state.isBotRunning && !state.isClosing) {
    try {
      await randomDelay(30000, 60000) // Every 30-60 seconds
      
      if (!state.isBotRunning || state.isClosing) break
      
      // Execute anti-idle measures
      await page.evaluate(() => {
        // Simulate user activity at the browser level
        const events = [
          'mousedown',
          'mouseup', 
          'mousemove',
          'keydown',
          'keyup',
          'focus',
          'blur'
        ]
        
        const event = events[Math.floor(Math.random() * events.length)]
        document.dispatchEvent(new Event(event, { bubbles: true }))
        
        // Reset any idle timers
        if (typeof window !== 'undefined') {
          ;(window as any).lastActivity = Date.now()
        }
      })
      
      console.log('🚫 Anti-idle measures executed')
      
    } catch (error) {
      console.log('⚠️ Anti-idle error:', error instanceof Error ? error.message : error)
      await randomDelay(45000, 90000)
    }
  }
}

export async function pauseMeetBot() {
  if (state.isBotPaused) {
    console.log('⏸️ Bot is already paused.')
    return
  }

  console.log('⏸️ Pausing meet bot...')
  state.isBotPaused = true

  // 1. Stop the interval
  if (state.audioProcessingInterval) {
    clearInterval(state.audioProcessingInterval)
    state.audioProcessingInterval = null
    console.log('🛑 Audio processing interval paused.')
  }
  
  // 2. Send the pause message
  if (state.page) {
    // Open chat panel first to ensure the chat input is available
    const chatOpened = await openChatWindow(state.page)
    if (chatOpened) {
      // Add small delay after opening chat panel
      await delay(1000)
      
      try {
        await sendChatMessage(state.page, 'Recording paused')
      } catch (error) {
        console.error('❌ Failed to send pause message')

        throw error
      }
    } else {
      console.warn('⚠️ Could not open chat panel')

    }
  }

  // 3. Process any remaining audio before clearing
  console.log('🚀 Processing remaining audio before pause...')
  // The enhanced processor will handle any pending audio automatically
  console.log('🧹 Audio processing paused.')
}

export async function resumeMeetBot() {
  if (!state.isBotPaused) {
    console.log('❌ The bot is not paused, cannot resume.')
    return
  }
  // Mark the bot as no longer paused
  state.isBotPaused = false

  // If the bot is still considered "running," we re-start audio processing
  if (state.isBotRunning && !state.audioProcessingInterval) {
    // Recreate the same logic used when you first start audio processing
    console.log('▶️ Restarting audio processing interval...')
    startAudioProcessing()
  }

  // Send resumed message
  if (state.page) {
    console.log('📤 Preparing to send resume message...')
    
    // **ENHANCED RESUME MESSAGE**: More robust approach with multiple attempts
    let resumeMessageSent = false
    let attempts = 0
    const maxAttempts = 3
    
    while (!resumeMessageSent && attempts < maxAttempts) {
      attempts++
      console.log(`📤 Resume message attempt ${attempts}/${maxAttempts}`)
      
      try {
        // Open chat panel first to ensure the chat input is available
        const chatOpened = await openChatWindow(state.page)
        if (chatOpened) {
          // Longer delay for resume to ensure UI is fully stable
          await delay(2000)
          
          console.log(`📝 Sending resume message (attempt ${attempts})...`)
          await sendChatMessage(state.page, 'Recording resumed')
          resumeMessageSent = true
          console.log('✅ Resume message sent successfully!')
          
        } else {
          console.warn(`⚠️ Could not open chat panel on attempt ${attempts}`)
          if (attempts === maxAttempts) {
            console.warn('⚠️ Final attempt failed to open chat panel')

          }
        }
      } catch (error) {
        console.error(`❌ Failed to send resume message on attempt ${attempts}:`, error instanceof Error ? error.message : error)
        
        if (attempts === maxAttempts) {
          console.error('❌ All resume message attempts failed')

          // Don't throw error for resume - just log and continue
          console.warn('⚠️ Resume message could not be sent, but bot will continue running')
        } else {
          // Wait before retry
          await delay(2000)
        }
      }
    }
  }
}

// ✅ **Enhanced Audio Processing with Real-time Speech Detection**
export function startAudioProcessing() {
  if (state.audioProcessingInterval) {
    console.log('⚠️ Audio processing is already running.')
    return
  }

  // ✅ **ZOOM OPTIMIZATION**: Skip legacy audio processor monitoring for Zoom
  // Zoom uses Assembly.ai real-time exclusively, no need for buffer management
  const platform = state.meetingPlatform || 'google-meet'
  
  if (platform === 'zoom') {
    console.log('🎤 [ZOOM] Skipping legacy audio processor - using Assembly.ai real-time only')
    return
  }

  console.log('🎤 Starting enhanced audio processing...')
  
  // Reset audio processor for new session
  audioProcessor.reset()
  
  // Balanced monitoring with buffer management
  state.audioProcessingInterval = setInterval(() => {
    if (!state.isBotRunning) {
      console.log('🛑 Bot stopped but interval still running. Clearing it now.')
      stopAudioProcessing()
      return
    }

    // Monitor stats and provide feedback
    const stats = audioProcessor.getStats()
    
    // Log stats with different frequencies based on buffer size
    if (stats.bufferDurationMs > 8000) {
      console.log(`⚠️ Audio buffer growing: ${stats.bufferDurationMs}ms buffered, speech: ${stats.isSpeechActive ? 'YES' : 'NO'}, content: ${stats.speechRatio}, variance: ${stats.energyVariance}`)
    } else if (stats.bufferDurationMs > 1000) {
      console.log(`🎤 Audio status: ${stats.bufferDurationMs}ms buffered, speech: ${stats.isSpeechActive ? 'YES' : 'NO'}, content: ${stats.speechRatio}`)
    }
    
    // Buffer management with progressive warnings
    if (stats.bufferDurationMs > 18000) { // 18 seconds critical threshold
      console.log('🚨 Critical buffer size reached, resetting to prevent memory issues...')
      audioProcessor.reset()
    } else if (stats.bufferDurationMs > 12000) { // 12 seconds warning
      console.log(`⚠️ Large buffer detected (${stats.bufferDurationMs}ms) - checking for processing issues...`)
      
      // Force a processing attempt with relaxed criteria
      const result = audioProcessor.processAudioChunk(Buffer.alloc(0), state.currentSpeaker || 'Unknown', false, state.currentAudioSampleRate)
      if (result.shouldTranscribe && result.processedAudio.length > 0) {
        console.log(`🔄 Forced processing: ${result.reason}`)
        // Use the correct sample rate from state for forced processing
        sendToWhisper(result.processedAudio, 0, false, state.currentAudioSampleRate, state.currentSpeaker)
      }
    }
  }, 2000) // Check every 2 seconds for balanced monitoring
  
  console.log('✅ Enhanced audio processing started with buffer management')
}

// ✅ **Browser-Side Audio Capture Fallback Implementation**
async function implementBrowserSideAudioCapture(page: Page, platform: string) {
  try {
    // Platform-specific sample rate configuration
    const targetSampleRate = platform === 'zoom' ? 44100 : platform === 'teams' ? 48000 : 16000
    console.log(`🎵 Setting up browser-side audio capture for ${platform} (target sample rate: ${targetSampleRate} Hz)`)
    
    // ✅ **Expose handleRealAudioChunk to browser context** (check if not already exposed)
    try {
          await page.exposeFunction('handleRealAudioChunk', (audioChunk: number[], browserSampleRate: number) => {
      // ✅ **FALLBACK STOP FIX**: Check if bot is stopping before processing audio
      if (!state.isBotRunning || state.isClosing) {
        // Bot is stopping - ignore audio chunks
        return
      }
      
      console.log(`🎵 Fallback: Received audio chunk from browser: ${audioChunk.length} bytes, browser rate: ${browserSampleRate} Hz, target rate: ${targetSampleRate} Hz`)
      try {
        const uint8Array = new Uint8Array(audioChunk)
        // Use target sample rate for platform consistency
        batchAudioChunk(uint8Array, targetSampleRate)
        console.log(`✅ Fallback: Audio chunk sent to transcription system with ${targetSampleRate} Hz`)
      } catch (error) {
        console.log(`❌ Fallback: Error processing audio chunk:`, error)
      }
    })
      console.log('✅ Fallback: handleRealAudioChunk function exposed to browser')
    } catch (exposeError) {
      console.log('ℹ️ Fallback: handleRealAudioChunk already exposed, using existing function')
    }

    // ✅ **Execute Browser-Side Audio Capture**
    const audioResult = await Promise.race([
      page.evaluate((targetSampleRate) => {
        return new Promise((resolve) => {
          const diagnostics: string[] = []
          diagnostics.push('🔥 FALLBACK: Browser-side audio capture started')
          
          let audioSetupSuccess = false
          let audioChunkCount = 0
          
          try {
            const audioContext = new AudioContext()
            diagnostics.push(`🔊 Fallback: AudioContext created with sample rate: ${audioContext.sampleRate} Hz (target: ${targetSampleRate} Hz)`)
            
            // Try to find audio/video elements first
            const audioElements = document.querySelectorAll('audio, video')
            diagnostics.push(`📊 Fallback: Found ${audioElements.length} audio/video elements`)
            
            // ✅ **Google Meet specific audio element discovery**
            if (audioElements.length === 0 && targetSampleRate === 16000) { // Google Meet uses 16000 Hz
              diagnostics.push('🔍 Google Meet: No audio elements found initially, waiting for Google Meet to load...')
              
              // Google Meet sometimes loads audio elements after UI is ready
              setTimeout(() => {
                const delayedElements = document.querySelectorAll('audio, video')
                diagnostics.push(`📊 Google Meet: Found ${delayedElements.length} audio elements after delay`)
                
                if (delayedElements.length > 0) {
                  setupAudioCapture(delayedElements, audioContext, diagnostics)
                } else {
                  // Try to capture from getUserMedia streams if no elements found
                  diagnostics.push('🔍 Google Meet: Attempting to capture from navigator.mediaDevices...')
                  // This is a more advanced fallback for Google Meet
                }
              }, 3000)
            }
            
            if (audioElements.length > 0) {
              setupAudioCapture(audioElements, audioContext, diagnostics)
            } else {
              diagnostics.push('⚠️ Fallback: No audio elements found')
            }
            
            function setupAudioCapture(elements: NodeListOf<Element>, context: AudioContext, diag: string[]) {
              elements.forEach((element, index) => {
                try {
                  let source: MediaElementAudioSourceNode | MediaStreamAudioSourceNode | null = null
                  
                  if ((element as any).srcObject) {
                    source = audioContext.createMediaStreamSource((element as any).srcObject)
                    diagnostics.push(`✅ Fallback: Created MediaStream source for element ${index}`)
                  } else if ((element as any).src) {
                    source = audioContext.createMediaElementSource(element as HTMLMediaElement)
                    diagnostics.push(`✅ Fallback: Created MediaElement source for element ${index}`)
                  }
                  
                  if (source) {
                    const processor = audioContext.createScriptProcessor(4096, 2, 2)
                    const gainNode = audioContext.createGain()
                    gainNode.gain.value = 2.0
                    
                    processor.onaudioprocess = (event) => {
                      const inputData = event.inputBuffer.getChannelData(0)
                      let sum = 0
                      for (let i = 0; i < inputData.length; i++) {
                        sum += inputData[i] * inputData[i]
                      }
                      const rms = Math.sqrt(sum / inputData.length)
                      const audioLevel = rms * 100
                      
                      if (audioLevel > 0.005) {
                        const int16Array = new Int16Array(inputData.length)
                        for (let i = 0; i < inputData.length; i++) {
                          int16Array[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768))
                        }
                        
                        if ((window as any).handleRealAudioChunk) {
                          (window as any).handleRealAudioChunk(Array.from(new Uint8Array(int16Array.buffer)), audioContext.sampleRate)
                        }
                        
                        audioChunkCount++
                        if (audioChunkCount === 1) {
                          console.log(`🎉 Fallback: First audio detected! Level: ${audioLevel.toFixed(4)}`)
                          audioSetupSuccess = true
                        }
                      }
                    }
                    
                    source.connect(gainNode)
                    gainNode.connect(processor)
                    processor.connect(audioContext.destination)
                    
                    diagnostics.push(`✅ Fallback: Audio pipeline connected for element ${index}`)
                  }
                } catch (elementError) {
                  diagnostics.push(`❌ Fallback: Error with element ${index}: ${elementError}`)
                }
              })
            }
            
          } catch (setupError) {
            diagnostics.push(`❌ Fallback: Audio setup error: ${setupError}`)
          }
          
          // Return result after short delay
          setTimeout(() => {
            resolve({
              success: audioSetupSuccess,
              diagnostics: diagnostics,
              audioChunkCount: audioChunkCount
            })
          }, 3000)
        })
      }, targetSampleRate),
      // 10 second timeout
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Fallback audio setup timeout')), 10000)
      )
    ])
    
    console.log('✅ Fallback: Browser-side audio capture setup completed:', audioResult)
    
    if (audioResult && typeof audioResult === 'object') {
      const result = audioResult as any
      if (result.diagnostics && Array.isArray(result.diagnostics)) {
        result.diagnostics.forEach((diagnostic: string) => {
          console.log(`🔍 Fallback: ${diagnostic}`)
        })
      }
      console.log(`📊 Fallback: Setup result - Success: ${result.success}, Chunks: ${result.audioChunkCount}`)
    }
    
  } catch (error) {
    console.log('❌ Fallback: Browser-side audio capture setup failed:', error)
    console.log('⚠️ Fallback: Continuing without real-time audio capture')
  }
}

// ✅ **Start Google Meet Bot**
export async function startMeetBot(meetUrl: string, meetingId: string, platform?: MeetingPlatform, companionName?: string, meetingType?: 'regular' | 'brain-dump', keyterms?: string[]) {
  if (state.isBotRunning || state.meetingId === meetingId) {
    console.log(`🚨 A bot is already running! Current state - isBotRunning: ${state.isBotRunning}, meetingId: ${state.meetingId}, requested: ${meetingId}, isClosing: ${state.isClosing}`)
    return { status: 'error', message: 'Bot already running' }
  }
  if (state.stopTimeout) {
    clearTimeout(state.stopTimeout)
    console.log('🧹 Cleared previous timeout.')
    state.stopTimeout = null
  }
  try {
    if (!meetingId) {
      console.error('❌ Missing meeting_id! Cannot proceed.')
      return { status: 'error', message: 'Meeting ID is required' }
    }

    // ✅ Validate meetUrl parameter
    if (!meetUrl || typeof meetUrl !== 'string' || meetUrl.trim() === '') {
      console.error('❌ Missing or invalid meetUrl! Cannot proceed.')
      return { status: 'error', message: 'Valid meeting URL is required' }
    }

    // ✅ Transform Zoom URLs to standard format if needed
    const transformedMeetUrl = transformZoomUrl(meetUrl)

    // ✅ Detect platform if not provided
    const meetingPlatform = platform || detectMeetingPlatform(transformedMeetUrl)
    
    if (meetingPlatform === 'unknown') {
      console.error('❌ Unsupported meeting platform! Cannot proceed.')
      return { status: 'error', message: 'Unsupported meeting platform' }
    }

    // ✅ Store platform in state for use across modules
    state.meetingPlatform = meetingPlatform

    // Store meeting type - brain dumps are one person talking to the bot
    state.meetingType = meetingType || 'regular'
    if (state.meetingType === 'brain-dump') {
      console.log(`🧠 Brain dump mode - single speaker, batch-only processing`)
    }

    // ✅ Generate bot name based on companion name
    const botName = companionName ? `${companionName} Pulse Companion` : 'Pulse Companion'
    state.botName = botName
    console.log(`🤖 Bot will use name: ${botName}`)

    // Clear emergency shutdown state from previous meeting if any
    const { resetEmergencyShutdown } = await import('./utils.ts')
    resetEmergencyShutdown()

    state.meetingStartTime = Date.now()

    console.log(`🚀 Starting bot for ${meetingPlatform} meeting: ${meetUrl}`)

    // 🧪 Initialize experimental audio accumulation mode
    if (ENABLE_FULL_AUDIO_ACCUMULATION) {
      console.log('Full audio accumulation mode enabled')
      state.isFullAccumulationMode = true
      state.fullAudioAccumulator = Buffer.alloc(0)
      state.meetingSpeakers.clear() // Reset speakers for new meeting
      state.speakerHistory = [] // Reset speaker history for new meeting
      state.currentAudioOffsetMs = 0 // Reset audio offset
      state.lastSpeakerUpdate = Date.now() // Initialize last update time
      
      // 🤖 Initialize AI merging arrays
      state.chunkedTranscriptions = []
      state.fullAudioTranscriptions = []
    } else {
      state.isFullAccumulationMode = false
    }

    // Reset speaker tracking state for new meeting
    state.participantRoster.clear()
    state.lastParticipantRosterUpdate = 0
    state.currentSpeaker = 'User'
    state.speakerChangeLog = []
    state.transcriptionLog = []
    state.audioChunkTimeline = []

    // ✅ **REMOVED: Don't start audio processing here**
    // Audio processing will start only after bot joins the meeting (see monitorKickout in utils.ts)
    // startAudioProcessing()
    state.isClosing = false // reset to false if previous session was running
    
    // ✅ Create session directory based on meeting_id
    state.sessionDir = path.join(recordingsDir, meetingId)
    await mkdir(state.sessionDir, { recursive: true })

    const jobId = `meetbot_${Date.now()}`
    state.currentRecordingPath = path.join(state.sessionDir, `${jobId}.webm`)
    
    // Create separate transcription log file paths
    state.transcriptionLogPath = path.join(
      state.sessionDir,
      `${jobId}_transcriptions.log`, // Main transcript (from Assembly.ai with speaker timeline mapping)
    )
    state.chunkedTranscriptionLogPath = path.join(
      state.sessionDir,
      `${jobId}_transcriptions-chunked.log`, // (Deprecated - no longer used)
    )
    state.fullTranscriptionLogPath = path.join(
      state.sessionDir,
      `${jobId}_transcriptions-full-transcript.log`, // (Deprecated - no longer used)
    )
    
    // ✅ NEW: Speaker timeline log path (replaces real-time Whisper transcription)
    state.speakerTimelineLogPath = path.join(
      state.sessionDir,
      `${jobId}_speaker_timeline.log`, // Dense timeline of speaker changes (logged every second)
    )

    state.transcriptionLog = [] // Reset for new session
    state.audioChunkTimeline = [] // Reset audio chunk timeline for new session

    console.log(`📂 Created session directory: ${state.sessionDir}`)
    console.log(
      `${env.RECORD_VIDEO ? '🎥 Video' : '🎙️ Audio'} will be saved at: ${state.currentRecordingPath}`,
    )
    console.log(
      `📝 Transcription log: ${state.transcriptionLogPath}`,
    )
    console.log(
      `📝 Speaker Timeline: ${state.speakerTimelineLogPath}`,
    )

    // Store session info globally
    state.meetingId = meetingId

    console.log(`🚀 Launching browser for ${meetingPlatform} meeting: ${meetUrl}...`)
    state.isBotRunning = true
    state.isBotPaused = false

    const browserArgs = [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--disable-dev-shm-usage',
        '--autoplay-policy=no-user-gesture-required',
        '--remote-debugging-port=9222',
        '--disable-accelerated-video-decode',
        
        // Enhanced stealth measures (from your working code)
        '--disable-blink-features=AutomationControlled',
        '--exclude-switches=enable-automation',
        '--disable-extensions-except',
        '--disable-plugins-discovery',
        '--no-first-run',
        '--disable-default-apps',
        '--disable-component-extensions-with-background-pages',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        
        '--allow-running-insecure-content',
        '--disable-features=WebRtcHideLocalIpsWithMdns',
    ]

    // ✅ **PLATFORM-SPECIFIC APPROACH**: Different media flags for each platform
    if (meetingPlatform === 'zoom') {
      browserArgs.push(
        '--use-fake-device-for-media-stream',  // Zoom uses browser-side capture
        '--use-fake-ui-for-media-stream',      // Zoom uses browser-side capture
      )
      console.log('🔧 Using fake media flags for Zoom (browser-side capture)')
    } else if (meetingPlatform === 'teams') {
      // ✅ **Teams-specific browser configuration**
      browserArgs.push(
        '--use-fake-device-for-media-stream',  // Teams works better with fake media
        '--use-fake-ui-for-media-stream',      // Teams works better with fake media
        '--disable-web-security',              // Teams sometimes needs this for cross-origin
        '--disable-features=VizDisplayCompositor', // Teams compatibility
      )
      console.log('🔧 Using Teams-specific browser configuration (fake media + compatibility flags)')
    } else {
      // For Google Meet: Allow real media access so puppeteer-stream can work
      console.log('🔧 Using real media access for Google Meet (puppeteer-stream capture)')
    }

    state.activeBrowser = await launch({
      headless: false,
      args: browserArgs,
      defaultViewport: {
        height: 1080,
        width: 1920,
      },
      executablePath: env.PUPPETEER_EXECUTABLE_PATH,
    })

    assert(state.activeBrowser)
    const page = await state.activeBrowser.newPage()
    state.page = page

    // Pre-inject handlers to auto-click popups and mute media as soon as they appear
    await page.evaluateOnNewDocument(() => {
      const autoClickInterval = setInterval(() => {
        try {
          const continueBtn = document.querySelector("span[jsname='V67aGc'].mUIrbf-vQzf8d, button[jsname='IbE0S']") as HTMLElement
          if (continueBtn) continueBtn.click()
          
          const cookieBtn = document.querySelector("button[data-mdc-dialog-action='accept']") as HTMLElement
          if (cookieBtn) cookieBtn.click()
          
          const gotItBtn = document.querySelector("button[jsname='EszDEe']") as HTMLElement
          if (gotItBtn) gotItBtn.click()
          
          const signInBtn = document.querySelector('button.VfPpkd-LgbsSe') as HTMLElement
          if (signInBtn) signInBtn.click()
        } catch {}
      }, 100)
      
      setTimeout(() => clearInterval(autoClickInterval), 5000)
    })
    
    await page.evaluateOnNewDocument(() => {
      const autoMuteInterval = setInterval(() => {
        try {
          const micBtn = document.querySelector("div[jsname='hw0c9'][data-is-muted='false']") as HTMLElement
          if (micBtn) micBtn.click()
          
          const camBtn = document.querySelector("div[jsname='psRWwc']") as HTMLElement
          if (camBtn) camBtn.click()
        } catch {}
      }, 100)
      
      setTimeout(() => clearInterval(autoMuteInterval), 5000)
    })
    
    console.log('Popup handlers pre-injected')

    console.log('🎥 Starting recording...')

    const file = fs.createWriteStream(state.currentRecordingPath)

    const audioStream = new PassThrough()

    // ✅ **Platform-specific Audio Configuration**
    let audioSampleRate = 16000 // Default for Google Meet
    if (meetingPlatform === 'zoom') {
      audioSampleRate = 44100 // Zoom prefers higher sample rate
    } else if (meetingPlatform === 'teams') {
      audioSampleRate = 48000 // Teams uses 48000 Hz sample rate (discovered in testing)
    }
    console.log(`🎵 Using ${audioSampleRate} Hz sample rate for ${meetingPlatform} platform`)

    state.activeProcess = ffmpeg()
      .input(audioStream)
      .inputFormat('webm')
      .audioCodec('pcm_s16le')
      .audioFrequency(audioSampleRate) // Platform-specific sample rate
      .audioChannels(1)
      .format('wav')
      .on('error', (err) => console.error('FFmpeg Error:', err))

    state.activeProcess
      .pipe(new PassThrough())
      .on('data', (chunk) => batchAudioChunk(chunk, audioSampleRate)) // Pass sample rate

    const attemptGetStream = async (options: any, timeoutMs: number = 5000) => {
      return Promise.race([
        getStream(page, options),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Media stream timeout')), timeoutMs)
        )
      ])
    }

    // Teams and Zoom use fake media devices, so puppeteer-stream can't capture them
    // They have their own browser-side audio capture built into their join functions
    if (meetingPlatform === 'teams' || meetingPlatform === 'zoom') {
      console.log(`🎧 ${meetingPlatform}: Skipping puppeteer-stream (uses browser-side audio capture)`)
      state.isUsingSimulatedAudio = true
      state.activeStream = new PassThrough()
      console.log(`✅ ${meetingPlatform}: Dummy stream created, will use built-in browser-side audio capture`)
    } else {
      // Google Meet uses real media devices, so try puppeteer-stream
      try {
        console.log('🎬 Attempting to get media stream with 5s timeout...')
        
        const recordingOptions = {
          audio: true,
          video: env.RECORD_VIDEO,
        }
        
        state.activeStream = await attemptGetStream(recordingOptions, 5000)
        console.log('✅ Media stream obtained!')
        
        if (state.activeStream) {
          state.activeStream.on('error', (error) => {
            const errorMessage = error instanceof Error ? error.message : String(error)
            if (
              errorMessage.includes('Execution context was destroyed') ||
              errorMessage.includes('Protocol error') ||
              errorMessage.includes('Session closed') ||
              errorMessage.includes('Target closed')
            ) {
              console.log('⚠️ Stream error due to context destruction during cleanup - this is expected when meeting ends')
            } else {
              console.error('❌ Stream error:', errorMessage)
            }
          })
        }
        
      } catch (streamError) {
        console.error('❌ Failed to get media stream:', streamError instanceof Error ? streamError.message : streamError)
        console.log('🔄 Attempting quick fallback recording setup (3s timeout)...')
        
        try {
          state.activeStream = await attemptGetStream({
            audio: true,
            video: env.RECORD_VIDEO,
          }, 3000)
          console.log('✅ Fallback media stream obtained!')
          
          if (state.activeStream) {
            state.activeStream.on('error', (error) => {
              const errorMessage = error instanceof Error ? error.message : String(error)
              if (
                errorMessage.includes('Execution context was destroyed') ||
                errorMessage.includes('Protocol error') ||
                errorMessage.includes('Session closed') ||
                errorMessage.includes('Target closed')
              ) {
                console.log('⚠️ Fallback stream error due to context destruction during cleanup - this is expected when meeting ends')
              } else {
                console.error('❌ Fallback stream error:', errorMessage)
              }
            })
          }
          
        } catch (fallbackError) {
          console.error('❌ Fallback recording also failed:', fallbackError instanceof Error ? fallbackError.message : fallbackError)
          
          console.log(`⚠️ puppeteer-stream failed for ${meetingPlatform} - implementing browser-side audio capture fallback...`)
          console.log('✅ Dummy stream created, will implement browser-side audio capture after joining...')
          state.isUsingSimulatedAudio = true
          
          state.activeStream = new PassThrough()
        }
      }
    }

    if (state.activeStream) {
      state.activeStream.pipe(file)
      state.activeStream.pipe(audioStream)
    }
    
    // ⚡ OPTIMIZATION: Removed delay(1000) - not needed

    const context = state.activeBrowser.defaultBrowserContext()

    // Grant permissions and navigate in parallel
    const grantPermissions = async () => {
      await context.overridePermissions(transformedMeetUrl, [
        'camera',
        'microphone',
        'notifications',
      ])
      
      if (meetingPlatform === 'zoom') {
        await context.overridePermissions('https://zoom.us', [
          'camera',
          'microphone',
          'clipboard-read',
          'clipboard-write',
          'notifications',
        ])
      }
      
      if (meetingPlatform === 'teams') {
        const teamsDomains = [
          'https://teams.microsoft.com',
          'https://teams.live.com',
          'https://teams.office.com',
        ]
        
        await Promise.all(teamsDomains.map(domain => 
          context.overridePermissions(domain, [
            'camera',
            'microphone',
            'notifications',
            'clipboard-read',
            'clipboard-write',
          ]).catch(() => {})
        ))
      }
    }
    
    const navigateToMeeting = async () => {
      await page.goto(transformedMeetUrl, { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      })
      await page.waitForSelector('body', { timeout: 1000 }).catch(() => {})
    }
    
    await Promise.all([
      grantPermissions(),
      navigateToMeeting()
    ])

    // Route to appropriate joining logic based on platform
    if (meetingPlatform === 'google-meet') {
      await joinGoogleMeet(page, transformedMeetUrl)
    } else if (meetingPlatform === 'teams') {
      await joinTeams(page)
    } else if (meetingPlatform === 'zoom') {
      await joinZoom(page)
    }

    // Browser-side audio capture fallback for Google Meet
    if (state.isUsingSimulatedAudio && meetingPlatform === 'google-meet') {
      console.log(`Implementing browser-side audio capture fallback for ${meetingPlatform}`)
      await implementBrowserSideAudioCapture(page, meetingPlatform)
    }

    // Only Google Meet uses the chat window feature
    if (meetingPlatform === 'google-meet') {
      await openChatWindow(page)
    }

    // Start audio processing for join detection
    console.log('Starting audio processing for join detection')
    startAudioProcessing()
    
    // Start join monitoring
    console.log('Starting join detection monitoring')
    monitorKickout(page).catch(err => console.error('monitorKickout error:', err))
    
    // Brain dump: one person talking to the bot, no need for real-time transcription
    const isBrainDump = state.meetingType === 'brain-dump'
    
    if (isBrainDump) {
      console.log('🧠 Brain dump - skipping real-time transcription (single speaker)')
      console.log('Batch processing will handle transcription after meeting')
      
      // Only run participant detection for brain dumps
      ;(async () => {
        console.log('Detecting participants')
        await monitorSpeakers(page)
        console.log('Participant detection complete')
      })().catch(err => console.error('Error detecting participants:', err))
    } else {
      // Regular meeting: run Assembly.ai and participant detection in parallel
      console.log('Starting Assembly.ai and participant detection in parallel')
      
      // Let people know if they provided custom keyterms
      if (keyterms && keyterms.length > 0) {
        console.log(`🎯 Custom keyterms provided: ${keyterms.length} terms`)
      }
      
      Promise.allSettled([
        (async () => {
          try {
            console.log('Starting Assembly.ai real-time transcription')
            await assemblyAIRealtime.start(keyterms)
            console.log('Assembly.ai real-time transcription started')
            return true
          } catch (error) {
            console.error('Failed to start Assembly.ai real-time transcription:', error)
            console.log('Will fall back to batch processing after meeting')
            return false
          }
        })(),
        (async () => {
          console.log('Detecting participants')
          await monitorSpeakers(page)
          console.log('Participant detection complete')
          
          try {
            await assemblyAIRealtime.notifyRosterReady()
          } catch (error) {
            console.error('Assembly.ai roster notification failed:', error)
          }
          return true
        })()
      ]).then(([assemblyResult, participantResult]) => {
        console.log('Parallel startup completed')
        console.log(`Assembly: ${assemblyResult.status}, Participants: ${participantResult.status}`)
        
        if (assemblyResult.status === 'rejected' || (assemblyResult.status === 'fulfilled' && !assemblyResult.value)) {
          console.log('Assembly.ai real-time transcription not available - will use batch fallback')
        }
      }).catch(err => console.error('Error in parallel startup:', err))
    }

    console.log('Bot is now listening to the meeting')

    // Auto-stop the bot after the maximum duration
    state.stopTimeout = setTimeout(() => {
      console.log(
        `Maximum duration of ${env.MEET_BOT_MAX_DURATION_MINUTES} minutes reached. Stopping bot.`,
      )
      stopMeetBot()
    }, MEET_BOT_MAX_DURATION)

    return { status: 'success', message: 'Bot started successfully' }
  } catch (error) {
    console.error('Error starting meet bot:', error)
    await stopMeetBot()
    return { status: 'error', message: 'Failed to start bot' }
  }
}
