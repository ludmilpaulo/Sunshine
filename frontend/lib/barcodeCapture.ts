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
  const TIMEOUT_MS = options?.timeout || 300; // Increased timeout for slower scanners (was 200ms)
  const MIN_LENGTH = options?.minLength || 3;
  const MAX_LENGTH = 50; // Maximum reasonable barcode length
  const DEBUG = options?.debug || false;
  const STRIP_PREFIX = options?.stripPrefix ?? true;
  const STRIP_SUFFIX = options?.stripSuffix ?? true;
  const DUPLICATE_THRESHOLD = 2000; // Ignore same code if scanned within 2 seconds
  const KEY_DUPLICATE_THRESHOLD = 50; // Ignore duplicate key events within 50ms
  const ENTER_PROCESSING_DELAY = 100; // Wait 100ms after Enter before processing to catch last digit (increased from 50ms)
  const MAX_ENTER_WAIT_TIME = 200; // Maximum time to wait for additional digits after Enter

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
    
    // If code is too long, try to extract valid barcode
    if (normalized.length > 20) {
      // Try to find repeating pattern
      for (let length = 8; length <= 14; length++) {
        const pattern = normalized.substring(0, length);
        if (pattern.length === length && /^\d+$/.test(pattern)) {
          const repetitions = Math.floor(normalized.length / length);
          if (pattern.repeat(repetitions) === normalized.substring(0, pattern.length * repetitions)) {
            if (DEBUG) {
              console.log("[Barcode] Normalized from", normalized, "to", pattern);
            }
            return pattern;
          }
        }
        // Check if code ends with a valid barcode that also appears at start
        const endPattern = normalized.substring(normalized.length - length);
        if (endPattern.length === length && /^\d+$/.test(endPattern) && normalized.startsWith(endPattern)) {
          if (DEBUG) {
            console.log("[Barcode] Normalized from", normalized, "to", endPattern);
          }
          return endPattern;
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
    lastScannedCode = normalizedCode;
    lastScannedTime = Date.now();
    lastKeyProcessed = ""; // Reset after processing
    lastKeyTime = 0; // Reset after processing
    
    if (DEBUG) {
      console.log("[Barcode] ✅ Valid barcode received:", normalizedCode, "Length:", normalizedCode.length, "Original:", code);
      console.log("[Barcode] Calling handler with:", normalizedCode);
    }
    
    handler(normalizedCode);
  };

  // Separate function to process Enter key after delay
  const processEnterKey = (e: KeyboardEvent) => {
    const code = cleanBarcode(buffer);
    const processTime = Date.now();
    
    if (DEBUG) {
      console.log("[Barcode] Processing Enter - Buffer:", buffer, "Cleaned:", code, "Length:", code.length);
    }
    
    // Validate code length
    if (code.length < MIN_LENGTH) {
      buffer = "";
      isScanning = false;
      if (DEBUG) {
        console.log("[Barcode] Code too short, ignoring. Code:", code, "Length:", code.length);
      }
      return;
    }
    
    if (code.length > MAX_LENGTH) {
      // Code is too long - might be duplicated or corrupted
      // Try to extract valid barcode from it
      const possibleCodes = extractValidBarcodes(code);
      if (possibleCodes.length > 0) {
        const validCode = possibleCodes[0]; // Use first valid code
        if (DEBUG) {
          console.log("[Barcode] Code too long, extracted valid code:", validCode, "from:", code);
        }
        processBarcode(validCode, e);
      } else {
        if (DEBUG) {
          console.log("[Barcode] Code too long and no valid barcode found:", code);
        }
        buffer = "";
        isScanning = false;
      }
      return;
    }
    
    // Check for duplicate scans (same code within threshold time)
    if (code === lastScannedCode && (processTime - lastScannedTime) < DUPLICATE_THRESHOLD) {
      if (DEBUG) {
        console.log("[Barcode] Duplicate scan detected, ignoring:", code);
      }
      buffer = "";
      isScanning = false;
      return;
    }
    
    if (isScanning || code.length >= MIN_LENGTH) {
      processBarcode(code, e);
    } else {
      buffer = "";
      isScanning = false;
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
    } else if (isFastInput && buffer.length === 0) {
      // Start of a potential scan
      isScanning = true;
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
      
      // Store current buffer length to detect if more digits arrive
      const bufferLengthAtEnter = buffer.length;
      
      // Delay processing to ensure we capture the last digit before Enter
      // Some scanners send Enter very quickly after the last digit
      // Use a longer delay and check if buffer grew during that time
      pendingEnterProcessing = setTimeout(() => {
        const finalBufferLength = buffer.length;
        
        // If buffer grew after Enter was pressed, wait a bit more
        if (finalBufferLength > bufferLengthAtEnter) {
          if (DEBUG) {
            console.log("[Barcode] ⚠️ Buffer grew after Enter (", bufferLengthAtEnter, "->", finalBufferLength, "), waiting more...");
          }
          // Wait additional time for more digits
          pendingEnterProcessing = setTimeout(() => {
            processEnterKey(e);
            pendingEnterProcessing = null;
          }, ENTER_PROCESSING_DELAY);
          return;
        }
        
        processEnterKey(e);
        pendingEnterProcessing = null;
      }, ENTER_PROCESSING_DELAY);
      
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
        // This handles cases where the last digit arrives after Enter
        if (enterKeyTime > 0 && (now - enterKeyTime) < MAX_ENTER_WAIT_TIME) {
          if (pendingEnterProcessing) {
            clearTimeout(pendingEnterProcessing);
            pendingEnterProcessing = null;
            if (DEBUG) {
              console.log("[Barcode] ⚠️ Digit arrived after Enter (", now - enterKeyTime, "ms), resetting delay. Buffer:", buffer);
            }
            
            // Reset and wait again for more digits
            enterKeyTime = now;
            const currentBufferLength = buffer.length;
            
            pendingEnterProcessing = setTimeout(() => {
              const finalLength = buffer.length;
              if (finalLength > currentBufferLength) {
                // Still receiving digits, wait more
                if (DEBUG) {
                  console.log("[Barcode] Still receiving digits (", currentBufferLength, "->", finalLength, "), waiting more...");
                }
                pendingEnterProcessing = setTimeout(() => {
                  processEnterKey(e);
                  pendingEnterProcessing = null;
                }, ENTER_PROCESSING_DELAY);
              } else {
                processEnterKey(e);
                pendingEnterProcessing = null;
              }
            }, ENTER_PROCESSING_DELAY);
          }
        } else if (enterKeyTime > 0) {
          // Too much time passed, reset
          enterKeyTime = 0;
        }
        
        buffer += e.key;
        lastKeyProcessed = e.key;
        lastKeyTime = now;
        
        if (DEBUG) {
          console.log("[Barcode] Added char:", e.key, "Buffer:", buffer, "Time since last:", timeSinceLastKey);
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
  // We should NOT add to buffer here to avoid duplication
  const onKeyPress = (e: KeyboardEvent) => {
    // Some scanners may trigger keypress instead of keydown
    // But we've already handled the character in keydown, so we just update timing here
    if (e.key.length === 1 && (/^[\w\-_\.\s]+$/.test(e.key) || /^[0-9]+$/.test(e.key))) {
      const now = Date.now();
      const timeSinceLastKey = now - lastTime;
      
      // Prevent duplicate processing - if we just processed this key in keydown, skip
      const timeSinceLastKeyEvent = now - lastKeyTime;
      if (e.key === lastKeyProcessed && timeSinceLastKeyEvent < KEY_DUPLICATE_THRESHOLD) {
        if (DEBUG) {
          console.log("[Barcode] ⏭️ KeyPress: Skipping duplicate key event:", e.key);
        }
        return; // Skip - already processed in keydown
      }
      
      if (timeSinceLastKey > TIMEOUT_MS) {
        buffer = "";
        isScanning = false;
      } else if (timeSinceLastKey < 50 && buffer.length === 0) {
        isScanning = true;
      }
      
      lastTime = now;
      // Only add to buffer if NOT already added by keydown (fallback for scanners that only send keypress)
      if (timeSinceLastKeyEvent >= KEY_DUPLICATE_THRESHOLD || e.key !== lastKeyProcessed) {
        buffer += e.key;
        lastKeyProcessed = e.key;
        lastKeyTime = now;
        if (DEBUG) {
          console.log("[Barcode] KeyPress - Added char (fallback):", e.key, "Buffer:", buffer, "Time:", timeSinceLastKey);
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
