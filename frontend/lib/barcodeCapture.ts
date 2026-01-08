export type BarcodeHandler = (barcode: string) => void;

/**
 * Attaches a global barcode scanner listener
 * Scanners typically type digits rapidly and send Enter/Tab at the end
 */
export function attachBarcodeCapture(handler: BarcodeHandler, options?: {
  debug?: boolean;
  minLength?: number;
  timeout?: number;
  stripPrefix?: boolean;
  stripSuffix?: boolean;
}): () => void {
  let buffer = "";
  let lastTime = 0;
  let isScanning = false;
  let lastScannedCode = "";
  let lastScannedTime = 0;
  let lastKeyProcessed = ""; // Track last key to prevent keydown+keypress duplication
  let lastKeyTime = 0; // Track time of last key
  let enterKeyTime = 0; // Track when Enter was pressed
  let pendingEnterProcessing: NodeJS.Timeout | null = null; // Delay processing Enter to catch last digit
  let bufferStableTime = 0; // Track when buffer last changed
  let lastBufferLength = 0; // Track last buffer length to detect if still growing
  const TIMEOUT_MS = options?.timeout || 150; // Reduced to 150ms - scanners are typically very fast
  const MIN_LENGTH = options?.minLength || 3;
  const MAX_LENGTH = 50; // Maximum reasonable barcode length
  const DEBUG = options?.debug || false;
  const STRIP_PREFIX = options?.stripPrefix ?? true;
  const STRIP_SUFFIX = options?.stripSuffix ?? true;
  const DUPLICATE_THRESHOLD = 2000; // Ignore same code if scanned within 2 seconds
  const KEY_DUPLICATE_THRESHOLD = 50; // Ignore duplicate key events within 50ms
  const ENTER_PROCESSING_DELAY = 350; // Wait 350ms after Enter before processing to catch last digits (increased for slow scanners and long codes)
  const MAX_ENTER_WAIT_TIME = 1000; // Maximum time to wait for additional digits after Enter (increased to catch all digits, especially for 13-14 digit codes)
  const BUFFER_STABLE_TIME = 200; // Time buffer must be stable before processing (increased to ensure all digits captured, especially middle digits)

  // Common scanner prefixes/suffixes to strip
  const PREFIXES = ["STX", "\x02", "GS", "\x1D"];
  const SUFFIXES = ["ETX", "\x03", "CR", "\r", "LF", "\n"];

  const cleanBarcode = (code: string): string => {
    let cleaned = code.trim();
    
    // Remove common prefixes
    if (STRIP_PREFIX) {
      for (const prefix of PREFIXES) {
        if (cleaned.startsWith(prefix)) {
          cleaned = cleaned.substring(prefix.length).trim();
        }
      }
    }
    
    // Remove common suffixes
    if (STRIP_SUFFIX) {
      for (const suffix of SUFFIXES) {
        if (cleaned.endsWith(suffix)) {
          cleaned = cleaned.substring(0, cleaned.length - suffix.length).trim();
        }
      }
    }
    
    // Remove any non-printable characters
    cleaned = cleaned.replace(/[\x00-\x1F\x7F-\x9F]/g, "");
    
    return cleaned;
  };

  // Extract valid barcodes from a potentially duplicated string
  const extractValidBarcodes = (code: string): string[] => {
    const validCodes: string[] = [];
    
    // Common barcode lengths: 8, 12, 13, 14 (EAN/UPC)
    const commonLengths = [8, 12, 13, 14];
    
    // First, try to find repeating patterns (most common issue)
    if (code.length > 20) {
      for (let len = 8; len <= 14; len++) {
        const pattern = code.substring(0, len);
        const repetitions = Math.floor(code.length / len);
        
        // Check if the entire code is just the pattern repeated
        if (pattern.repeat(repetitions) === code.substring(0, pattern.length * repetitions)) {
          if (DEBUG) {
            console.log("[Barcode] Found repeating pattern:", pattern, "repeated", repetitions, "times");
          }
          validCodes.push(pattern);
          return [pattern]; // Return immediately if we found a clear pattern
        }
        
        // Check if code starts with pattern repeated
        if (code.startsWith(pattern.repeat(2)) || code.startsWith(pattern.repeat(3))) {
          validCodes.push(pattern);
          if (DEBUG) {
            console.log("[Barcode] Found pattern at start:", pattern);
          }
        }
      }
    }
    
    // Try to find valid barcode patterns at start or end
    for (const length of commonLengths) {
      if (code.length >= length) {
        // Check start
        const startCandidate = code.substring(0, length);
        if (/^\d+$/.test(startCandidate)) {
          validCodes.push(startCandidate);
        }
        
        // Check end
        const endCandidate = code.substring(code.length - length);
        if (/^\d+$/.test(endCandidate) && endCandidate !== startCandidate) {
          validCodes.push(endCandidate);
        }
      }
    }
    
    // Remove duplicates and return
    const uniqueCodes = [...new Set(validCodes)];
    if (DEBUG && uniqueCodes.length > 0) {
      console.log("[Barcode] Extracted valid codes:", uniqueCodes);
    }
    return uniqueCodes;
  };

  const normalizeBarcode = (code: string): string => {
    // Normalize barcode - remove duplicates if detected
    let normalized = code.trim();
    
    // Remove any non-printable characters first
    normalized = normalized.replace(/[\x00-\x1F\x7F-\x9F]/g, "");
    
    // Don't normalize if code is within valid barcode length range (8-14 digits)
    // Only normalize if code is clearly too long (duplicated) or contains invalid characters
    if (normalized.length <= 14 && /^\d+$/.test(normalized)) {
      // Valid barcode length, return as-is
      return normalized;
    }
    
    // If code is too long, try to extract valid barcode
    if (normalized.length > 20) {
      // Try to find repeating pattern (most common issue)
      for (let length = 8; length <= 14; length++) {
        const pattern = normalized.substring(0, length);
        if (pattern.length === length && /^\d+$/.test(pattern)) {
          const repetitions = Math.floor(normalized.length / length);
          const expectedRepeated = pattern.repeat(repetitions);
          const actualPrefix = normalized.substring(0, pattern.length * repetitions);
          
          // Check if the code is exactly the pattern repeated
          if (expectedRepeated === actualPrefix) {
            if (DEBUG) {
              console.log("[Barcode] Normalized from", normalized, "to", pattern, "(repeating pattern)");
            }
            return pattern;
          }
        }
        
        // Check if code ends with a valid barcode that also appears at start
        if (normalized.length >= length) {
          const endPattern = normalized.substring(normalized.length - length);
          if (endPattern.length === length && /^\d+$/.test(endPattern)) {
            // Check if this pattern appears at the start too (duplicated barcode)
            if (normalized.startsWith(endPattern)) {
              if (DEBUG) {
                console.log("[Barcode] Normalized from", normalized, "to", endPattern, "(start/end match)");
              }
              return endPattern;
            }
          }
        }
      }
      
      // If no pattern found, try to extract first valid-length barcode
      for (let length of [13, 12, 14, 8, 11, 10]) {
        if (normalized.length >= length) {
          const candidate = normalized.substring(0, length);
          if (/^\d+$/.test(candidate)) {
            if (DEBUG) {
              console.log("[Barcode] Extracted first", length, "digits:", candidate);
            }
            return candidate;
          }
        }
      }
    }
    
    return normalized;
  };

  const processBarcode = (code: string, e: KeyboardEvent) => {
    // Normalize barcode before processing
    const normalizedCode = normalizeBarcode(code);
    
    // Only prevent default if we have a valid barcode from scanner
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    
    buffer = "";
    isScanning = false;
    bufferStableTime = 0;
    lastScannedCode = normalizedCode;
    lastScannedTime = Date.now();
    lastKeyProcessed = ""; // Reset after processing
    lastKeyTime = 0; // Reset after processing
    enterKeyTime = 0; // Reset enter key time
    
    if (DEBUG) {
      console.log("[Barcode] ✅ Valid barcode received:", normalizedCode, "Length:", normalizedCode.length, "Original:", code);
      console.log("[Barcode] Calling handler with:", normalizedCode);
    }
    
    handler(normalizedCode);
  };

  // Separate function to process Enter key after delay
  const processEnterKey = (e: KeyboardEvent) => {
    const processTime = Date.now();
    const code = cleanBarcode(buffer);
    
    if (DEBUG) {
      console.log("[Barcode] Processing Enter - Buffer:", buffer, "Cleaned:", code, "Length:", code.length);
    }
    
    // Validate code length
    if (code.length < MIN_LENGTH) {
      buffer = "";
      isScanning = false;
      bufferStableTime = 0;
      if (DEBUG) {
        console.log("[Barcode] Code too short, ignoring. Code:", code, "Length:", code.length);
      }
      return;
    }
    
    // Normalize the code first to handle duplicates
    const normalizedCode = normalizeBarcode(code);
    
    if (normalizedCode.length > MAX_LENGTH) {
      // Code is still too long after normalization - might be corrupted
      // Try to extract valid barcode from it
      const possibleCodes = extractValidBarcodes(normalizedCode);
      if (possibleCodes.length > 0) {
        const validCode = possibleCodes[0]; // Use first valid code
        if (DEBUG) {
          console.log("[Barcode] Code too long, extracted valid code:", validCode, "from:", normalizedCode);
        }
        processBarcode(validCode, e);
      } else {
        if (DEBUG) {
          console.log("[Barcode] Code too long and no valid barcode found:", normalizedCode);
        }
        buffer = "";
        isScanning = false;
        bufferStableTime = 0;
      }
      return;
    }
    
    // Use normalized code for duplicate check and processing
    const finalCode = normalizedCode.length >= MIN_LENGTH ? normalizedCode : code;
    
    // Check for duplicate scans (same code within threshold time)
    if (finalCode === lastScannedCode && (processTime - lastScannedTime) < DUPLICATE_THRESHOLD) {
      if (DEBUG) {
        console.log("[Barcode] Duplicate scan detected, ignoring:", finalCode);
      }
      buffer = "";
      isScanning = false;
      bufferStableTime = 0;
      return;
    }
    
    if (isScanning || finalCode.length >= MIN_LENGTH) {
      processBarcode(finalCode, e);
    } else {
      buffer = "";
      isScanning = false;
      bufferStableTime = 0;
      if (DEBUG) {
        console.log("[Barcode] Not from scanner, letting event proceed");
      }
    }
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const now = Date.now();
    const timeSinceLastKey = now - lastTime;
    
    // Detect if this might be scanner input (very fast typing)
    const isFastInput = timeSinceLastKey < 50;
    
    // Reset buffer if too much time passed (human typing, not scanner)
    if (timeSinceLastKey > TIMEOUT_MS) {
      if (DEBUG && buffer.length > 0) {
        console.log("[Barcode] Buffer reset due to timeout:", buffer, "Time:", timeSinceLastKey);
      }
      buffer = "";
      isScanning = false;
      bufferStableTime = 0;
    } else if (isFastInput && buffer.length === 0) {
      // Start of a potential scan
      isScanning = true;
      bufferStableTime = now;
      if (DEBUG) {
        console.log("[Barcode] Potential scan started");
      }
    }
    
    lastTime = now;

    // Enter or Tab key signals end of barcode (some scanners send Tab)
    if (e.key === "Enter" || e.key === "Tab") {
      const now = Date.now();
      enterKeyTime = now;
      
      // Prevent default immediately to stop Enter from triggering form submission
      e.preventDefault();
      e.stopPropagation();
      
      // Clear any pending Enter processing
      if (pendingEnterProcessing) {
        clearTimeout(pendingEnterProcessing);
        pendingEnterProcessing = null;
      }
      
      // Store current buffer state
      const bufferLengthAtEnter = buffer.length;
      const bufferAtEnter = buffer;
      
      // Check if buffer has been stable (no changes for a while)
      const timeSinceBufferChange = now - bufferStableTime;
      const isBufferStable = timeSinceBufferChange >= BUFFER_STABLE_TIME;
      
      if (DEBUG) {
        console.log("[Barcode] Enter pressed - Buffer:", buffer, "Length:", bufferLengthAtEnter, "Stable:", isBufferStable, "Time since change:", timeSinceBufferChange);
      }
      
      // Always wait a reasonable delay to catch trailing digits, especially for long codes
      // Use longer delay for codes that might not be complete yet
      // For codes with 10+ digits, wait longer as they often have trailing digits arriving late
      const minDelay = bufferLengthAtEnter >= 10 ? ENTER_PROCESSING_DELAY + 150 : ENTER_PROCESSING_DELAY; // Extra delay for longer codes (13-digit codes need more time)
      const delay = isBufferStable && bufferLengthAtEnter >= MIN_LENGTH ? minDelay : ENTER_PROCESSING_DELAY + 150;
      
      // Helper function to check if buffer is still growing
      const checkAndProcess = (attempt: number = 0, maxAttempts: number = 5) => {
        const currentLength = buffer.length;
        const currentBuffer = buffer;
        
        if (DEBUG) {
          console.log(`[Barcode] Check attempt ${attempt + 1}/${maxAttempts}: Buffer length=${currentLength}, was=${bufferLengthAtEnter}`);
        }
        
        // If buffer has grown since last check, wait more
        if (currentLength > bufferLengthAtEnter || currentBuffer !== bufferAtEnter) {
          if (attempt < maxAttempts) {
            if (DEBUG) {
              console.log(`[Barcode] ⚠️ Buffer still growing (${bufferLengthAtEnter}->${currentLength}), waiting more (attempt ${attempt + 1})...`);
            }
            lastBufferLength = currentLength;
            // Wait and check again
            pendingEnterProcessing = setTimeout(() => {
              checkAndProcess(attempt + 1, maxAttempts);
            }, ENTER_PROCESSING_DELAY);
          } else {
            // Max attempts reached, process what we have
            if (DEBUG) {
              console.log(`[Barcode] Max attempts reached, processing buffer with length ${currentLength}`);
            }
            processEnterKey(e);
            pendingEnterProcessing = null;
          }
        } else if (attempt > 0 && currentLength === lastBufferLength) {
          // Buffer hasn't grown since last check, it's stable - process it
          if (DEBUG) {
            console.log(`[Barcode] Buffer stable at length ${currentLength}, processing...`);
          }
          processEnterKey(e);
          pendingEnterProcessing = null;
        } else {
          // First check and buffer hasn't changed, but wait a bit more for safety
          if (attempt === 0) {
            lastBufferLength = currentLength;
            pendingEnterProcessing = setTimeout(() => {
              checkAndProcess(attempt + 1, maxAttempts);
            }, ENTER_PROCESSING_DELAY);
          } else {
            // Buffer is stable
            processEnterKey(e);
            pendingEnterProcessing = null;
          }
        }
      };
      
      pendingEnterProcessing = setTimeout(() => {
        checkAndProcess();
      }, delay);
      
      return;
    }

    // Ignore modifier keys
    if (e.ctrlKey || e.metaKey || e.altKey) {
      return;
    }

    // Accept printable characters
    if (e.key.length === 1) {
      // Accept alphanumeric and common barcode characters
      // Some scanners send special characters, we'll filter them but be more permissive
      if (/^[\w\-_\.\s]+$/.test(e.key) || /^[0-9]+$/.test(e.key)) {
        // Prevent duplicate key events (keydown + keypress both fire for same key)
        const timeSinceLastKeyEvent = now - lastKeyTime;
        if (e.key === lastKeyProcessed && timeSinceLastKeyEvent < KEY_DUPLICATE_THRESHOLD) {
          if (DEBUG) {
            console.log("[Barcode] ⏭️ Skipping duplicate keydown event:", e.key, "Time:", timeSinceLastKeyEvent);
          }
          return; // Skip this duplicate event
        }
        
        // If Enter was just pressed, cancel pending processing and extend delay
        // This handles cases where the last digit(s) arrive after Enter
        if (enterKeyTime > 0 && (now - enterKeyTime) < MAX_ENTER_WAIT_TIME) {
          if (pendingEnterProcessing) {
            clearTimeout(pendingEnterProcessing);
            pendingEnterProcessing = null;
            if (DEBUG) {
              console.log("[Barcode] ⚠️ Digit arrived after Enter (", now - enterKeyTime, "ms), resetting delay. Buffer:", buffer, "Length:", buffer.length);
            }
            
            // Reset and wait again for more digits - extend the wait time
            enterKeyTime = now; // Update enter key time to restart the wait window
            const currentBufferLength = buffer.length;
            
            // Use longer delay to ensure we catch all digits, especially for slow scanners
            pendingEnterProcessing = setTimeout(() => {
              const finalLength = buffer.length;
              if (finalLength > currentBufferLength) {
                // Still receiving digits, wait more
                if (DEBUG) {
                  console.log("[Barcode] Still receiving digits (", currentBufferLength, "->", finalLength, "), waiting more...");
                }
                // Wait again with same delay
                pendingEnterProcessing = setTimeout(() => {
                  // Check one final time
                  const checkLength = buffer.length;
                  if (checkLength > finalLength) {
                    if (DEBUG) {
                      console.log("[Barcode] Still receiving digits (", finalLength, "->", checkLength, "), waiting one more time...");
                    }
                    // Wait once more to ensure all digits are captured
                    pendingEnterProcessing = setTimeout(() => {
                      const lastCheckLength = buffer.length;
                      if (lastCheckLength > checkLength) {
                        if (DEBUG) {
                          console.log("[Barcode] Buffer still growing (", checkLength, "->", lastCheckLength, "), final wait...");
                        }
                        // One more check
                        pendingEnterProcessing = setTimeout(() => {
                          processEnterKey(e);
                          pendingEnterProcessing = null;
                        }, ENTER_PROCESSING_DELAY);
                      } else {
                        processEnterKey(e);
                        pendingEnterProcessing = null;
                      }
                    }, ENTER_PROCESSING_DELAY);
                  } else {
                    processEnterKey(e);
                    pendingEnterProcessing = null;
                  }
                }, ENTER_PROCESSING_DELAY);
              } else {
                processEnterKey(e);
                pendingEnterProcessing = null;
              }
            }, ENTER_PROCESSING_DELAY);
          } else {
            // Enter was pressed but no pending processing - this shouldn't happen, but handle it
            if (DEBUG) {
              console.log("[Barcode] ⚠️ Digit arrived after Enter but no pending processing - resetting enterKeyTime");
            }
            enterKeyTime = now;
          }
        } else if (enterKeyTime > 0) {
          // Too much time passed, reset
          enterKeyTime = 0;
        }
        
        // Verify buffer state before adding
        const bufferBefore = buffer;
        buffer += e.key;
        
        // Verify the character was actually added
        if (buffer.length !== bufferBefore.length + 1 || buffer[buffer.length - 1] !== e.key) {
          if (DEBUG) {
            console.error("[Barcode] ⚠️ Failed to add character to buffer! Key:", e.key, "Buffer before:", bufferBefore, "Buffer after:", buffer);
          }
          // Try to recover - add it manually if it wasn't added
          if (buffer[buffer.length - 1] !== e.key) {
            buffer = bufferBefore + e.key;
          }
        }
        
        lastKeyProcessed = e.key;
        lastKeyTime = now;
        bufferStableTime = now; // Update stable time when buffer changes
        
        if (DEBUG) {
          console.log("[Barcode] Added char:", e.key, "Buffer:", bufferBefore, "->", buffer, "Length:", buffer.length, "Time since last:", timeSinceLastKey);
        }
      } else if (DEBUG) {
        console.log("[Barcode] Ignored special char:", e.key, "Code:", e.key.charCodeAt(0));
      }
    } else if (DEBUG && e.key !== "Enter" && e.key !== "Tab") {
      console.log("[Barcode] Ignored key:", e.key);
    }
  };

  // Also listen to keypress for better compatibility
  // NOTE: We now handle characters in keydown, so keypress is mainly for timing detection
  // We should NOT add to buffer here to avoid duplication UNLESS keydown didn't catch it
  const onKeyPress = (e: KeyboardEvent) => {
    // Some scanners may trigger keypress instead of keydown
    // But we've already handled the character in keydown, so we just update timing here
    if (e.key.length === 1 && (/^[\w\-_\.\s]+$/.test(e.key) || /^[0-9]+$/.test(e.key))) {
      const now = Date.now();
      const timeSinceLastKey = now - lastTime;
      const timeSinceLastKeyEvent = now - lastKeyTime;
      
      // Check if this key was already processed in keydown
      // If last key was processed very recently (within 50ms) and it's the same key, skip
      if (e.key === lastKeyProcessed && timeSinceLastKeyEvent < KEY_DUPLICATE_THRESHOLD) {
        if (DEBUG) {
          console.log("[Barcode] ⏭️ KeyPress: Skipping duplicate key event:", e.key, "Time:", timeSinceLastKeyEvent);
        }
        return; // Skip - already processed in keydown
      }
      
      // Check if buffer already contains this key at the end (another duplicate check)
      if (buffer.length > 0 && buffer[buffer.length - 1] === e.key && timeSinceLastKeyEvent < KEY_DUPLICATE_THRESHOLD * 2) {
        if (DEBUG) {
          console.log("[Barcode] ⏭️ KeyPress: Buffer already ends with this key, skipping:", e.key);
        }
        return;
      }
      
      if (timeSinceLastKey > TIMEOUT_MS) {
        buffer = "";
        isScanning = false;
      } else if (timeSinceLastKey < 50 && buffer.length === 0) {
        isScanning = true;
      }
      
      lastTime = now;
      // Only add to buffer if NOT already added by keydown (fallback for scanners that only send keypress)
      // This is a safety net in case keydown didn't catch it
      if (timeSinceLastKeyEvent >= KEY_DUPLICATE_THRESHOLD || e.key !== lastKeyProcessed) {
        const bufferBefore = buffer;
        buffer += e.key;
        lastKeyProcessed = e.key;
        lastKeyTime = now;
        bufferStableTime = now; // Update stable time
        if (DEBUG) {
          console.log("[Barcode] KeyPress - Added char (fallback):", e.key, "Buffer:", bufferBefore, "->", buffer, "Time:", timeSinceLastKey);
        }
      }
    }
  };

  // Also listen to input events for maximum compatibility
  const onInput = (e: Event) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      // Don't interfere with manual input in focused fields
      // Only process if we're in a scanning session
      if (isScanning && buffer.length > 0) {
        const inputValue = e.target.value;
        if (DEBUG) {
          console.log("[Barcode] Input event detected:", inputValue);
        }
      }
    }
  };

  // Listen to both events for maximum compatibility
  // Use capture phase (true) to intercept events before they reach input fields
  // NOTE: Only add to document to avoid duplicate listeners (window + document = duplication)
  const eventOptions = { capture: true, passive: false };
  
  // Only add to document, not both window and document (prevents duplication)
  document.addEventListener("keydown", onKeyDown, eventOptions);
  document.addEventListener("keypress", onKeyPress, eventOptions);
  document.addEventListener("input", onInput, eventOptions);
  
  if (DEBUG) {
    console.log("[Barcode] Scanner listener attached (capture phase)", {
      timeout: TIMEOUT_MS,
      minLength: MIN_LENGTH,
      stripPrefix: STRIP_PREFIX,
      stripSuffix: STRIP_SUFFIX,
    });
  }
  
  return () => {
    // Clear any pending timeouts
    if (pendingEnterProcessing) {
      clearTimeout(pendingEnterProcessing);
      pendingEnterProcessing = null;
    }
    
    document.removeEventListener("keydown", onKeyDown, eventOptions);
    document.removeEventListener("keypress", onKeyPress, eventOptions);
    document.removeEventListener("input", onInput, eventOptions);
    if (DEBUG) {
      console.log("[Barcode] Scanner listener removed");
    }
  };
}
