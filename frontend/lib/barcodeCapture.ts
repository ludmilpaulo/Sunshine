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
  let lastKeyProcessed = ""; // Track last key processed to prevent duplicate events
  let lastKeyTime = 0; // Track time of last key to prevent duplicate events
  const TIMEOUT_MS = options?.timeout || 300; // Increased timeout for slower scanners
  const MIN_LENGTH = options?.minLength || 3;
  const MAX_LENGTH = 50; // Maximum reasonable barcode length
  const DEBUG = options?.debug !== undefined ? options.debug : true; // Enable debug by default for troubleshooting
  const STRIP_PREFIX = options?.stripPrefix ?? true;
  const STRIP_SUFFIX = options?.stripSuffix ?? true;
  const DUPLICATE_THRESHOLD = 2000; // Ignore same code if scanned within 2 seconds
  const SCANNER_SPEED_THRESHOLD = 100; // Max time between keys for scanner (ms)
  const DUPLICATE_KEY_THRESHOLD = 10; // Ignore duplicate key events within 10ms (keydown + keypress)

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
    
    // Remove any non-printable characters (more aggressive)
    cleaned = cleaned.replace(/[\x00-\x1F\x7F-\x9F]/g, "");
    
    // Remove any remaining non-alphanumeric characters except common barcode chars
    cleaned = cleaned.replace(/[^\w\-_\.]/g, "");
    
    // Remove leading/trailing dots, dashes, underscores
    cleaned = cleaned.replace(/^[.\-_]+|[.\-_]+$/g, "");
    
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
    
    // Remove all whitespace
    normalized = normalized.replace(/\s+/g, '');
    
    // FIRST: Remove consecutive duplicate characters (e.g., "5555" -> "5", "4444" -> "4")
    // This handles cases where the scanner sends each character multiple times
    let deduplicated = "";
    let lastChar = "";
    for (let i = 0; i < normalized.length; i++) {
      const char = normalized[i];
      // Only add if it's different from the last character
      if (char !== lastChar) {
        deduplicated += char;
        lastChar = char;
      }
    }
    
    if (DEBUG && deduplicated !== normalized) {
      console.log("[Barcode] 🔄 Removed consecutive duplicates:", normalized, "->", deduplicated);
    }
    normalized = deduplicated;
    
    // If code is too long, try to extract valid barcode (handle duplication)
    if (normalized.length > 20) {
      // Try to find repeating pattern
      for (let length = 8; length <= 14; length++) {
        const pattern = normalized.substring(0, length);
        if (pattern.length === length && /^\d+$/.test(pattern)) {
          const repetitions = Math.floor(normalized.length / length);
          const expectedDuplicated = pattern.repeat(repetitions);
          const actualCode = normalized.substring(0, pattern.length * repetitions);
          
          // Check if the code is just this pattern repeated
          if (expectedDuplicated === actualCode) {
            if (DEBUG) {
              console.log("[Barcode] Normalized from", normalized, "to", pattern, "(duplicated pattern detected)");
            }
            return pattern;
          }
          
          // Check if code starts with pattern repeated 2 or 3 times
          if (normalized.startsWith(pattern.repeat(2)) || normalized.startsWith(pattern.repeat(3))) {
            if (DEBUG) {
              console.log("[Barcode] Normalized from", normalized, "to", pattern, "(pattern repeated at start)");
            }
            return pattern;
          }
        }
        
        // Check if code ends with a valid barcode that also appears at start
        const endPattern = normalized.substring(normalized.length - length);
        if (endPattern.length === length && /^\d+$/.test(endPattern)) {
          // Check if this pattern appears multiple times at the start
          if (normalized.startsWith(endPattern.repeat(2)) || normalized.startsWith(endPattern.repeat(3))) {
            if (DEBUG) {
              console.log("[Barcode] Normalized from", normalized, "to", endPattern, "(pattern at start and end)");
            }
            return endPattern;
          }
        }
      }
      
      // If no pattern found, try to extract first valid length (8, 12, 13, 14 digits)
      for (let length of [13, 12, 14, 8]) {
        if (normalized.length >= length) {
          const candidate = normalized.substring(0, length);
          if (/^\d+$/.test(candidate)) {
            if (DEBUG) {
              console.log("[Barcode] Extracted first", length, "digits from", normalized, "->", candidate);
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
    
    // Check if we're in an input field - if so, only process if it's clearly a scanner (fast input)
    const target = e.target as HTMLElement;
    const isInputField = target && (
      target.tagName === "INPUT" || 
      target.tagName === "TEXTAREA" ||
      target.isContentEditable
    );
    
    // If in input field and not fast input, don't interfere
    if (isInputField && !isScanning) {
      buffer = "";
      return;
    }
    
    // Only prevent default if we have a valid barcode from scanner
    if (isScanning || normalizedCode.length >= MIN_LENGTH) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      
      // Clear input field if we intercepted scanner input
      if (isInputField && target instanceof HTMLInputElement) {
        target.value = "";
      }
    }
    
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

  const onKeyDown = (e: KeyboardEvent) => {
    // Don't interfere if user is typing in an input field (unless it's very fast - scanner)
    const target = e.target as HTMLElement;
    const isInputField = target && (
      target.tagName === "INPUT" || 
      target.tagName === "TEXTAREA" ||
      target.isContentEditable
    );
    
    const now = Date.now();
    const timeSinceLastKey = now - lastTime;
    
    // Detect if this might be scanner input (very fast typing)
    // Scanners typically send keys within 50ms, humans type slower
    const isFastInput = timeSinceLastKey < SCANNER_SPEED_THRESHOLD;
    
    // If user is typing in input field slowly, don't interfere
    if (isInputField && !isFastInput && timeSinceLastKey > 150) {
      if (DEBUG) {
        console.log("[Barcode] Slow input detected, ignoring. Time:", timeSinceLastKey);
      }
      buffer = "";
      isScanning = false;
      return;
    }
    
    // Reset buffer if too much time passed (human typing, not scanner)
    if (timeSinceLastKey > TIMEOUT_MS) {
      if (DEBUG && buffer.length > 0) {
        console.log("[Barcode] Buffer reset due to timeout:", buffer, "Time:", timeSinceLastKey);
      }
      buffer = "";
      isScanning = false;
    } else if (isFastInput) {
      // Start or continue a potential scan
      if (buffer.length === 0) {
        isScanning = true;
        if (DEBUG) {
          console.log("[Barcode] Potential scan started");
        }
      } else {
        // Continue scanning if still fast
        isScanning = true;
      }
    }
    
    lastTime = now;

    // Enter or Tab key signals end of barcode (some scanners send Tab)
    if (e.key === "Enter" || e.key === "Tab") {
      // Log RAW buffer before any processing
      if (DEBUG) {
        console.log("[Barcode] 🔴 RAW BUFFER (before cleaning):", buffer, "Length:", buffer.length);
        console.log("[Barcode] RAW buffer char codes:", Array.from(buffer).map(c => c.charCodeAt(0)).join(','));
      }
      
      const code = cleanBarcode(buffer);
      
      // Log after cleaning
      if (DEBUG) {
        console.log("[Barcode] 🟡 CLEANED CODE (after cleanBarcode):", code, "Length:", code.length);
      }
      
      const now = Date.now();
      
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
      
      // Normalize the code before processing
      const normalizedCode = normalizeBarcode(code);
      
      // Log normalization result
      if (DEBUG) {
        if (code !== normalizedCode) {
          console.log("[Barcode] 🟢 NORMALIZED CODE (after normalizeBarcode):", normalizedCode, "from:", code);
        } else {
          console.log("[Barcode] 🟢 CODE (no normalization needed):", normalizedCode);
        }
      }
      
      // Process if it's from scanner or meets minimum length
      if (isScanning || normalizedCode.length >= MIN_LENGTH) {
        // Use normalized code for duplicate check
        if (normalizedCode === lastScannedCode && (now - lastScannedTime) < DUPLICATE_THRESHOLD) {
          if (DEBUG) {
            console.log("[Barcode] Duplicate normalized code detected, ignoring:", normalizedCode);
          }
          buffer = "";
          isScanning = false;
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        
        // Log final code being sent to handler
        if (DEBUG) {
          console.log("[Barcode] ✅ FINAL CODE being sent to handler:", normalizedCode);
          console.log("[Barcode] 📊 Summary - Raw buffer:", buffer, "Cleaned:", code, "Normalized:", normalizedCode);
        }
        
        processBarcode(normalizedCode, e);
      } else {
        buffer = "";
        isScanning = false;
        if (DEBUG) {
          console.log("[Barcode] Not from scanner, letting event proceed. Code:", code, "Normalized:", normalizedCode, "Length:", normalizedCode.length);
        }
      }
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
      // Most barcodes are numeric, but some may contain letters
      if (/^[0-9a-zA-Z\-_\.]$/.test(e.key)) {
        // Prevent duplicate key events (keydown + keypress both fire)
        const timeSinceLastKeyEvent = now - lastKeyTime;
        if (e.key === lastKeyProcessed && timeSinceLastKeyEvent < DUPLICATE_KEY_THRESHOLD) {
          if (DEBUG) {
            console.log("[Barcode] ⏭️ Skipping duplicate key event:", e.key, "Time since last:", timeSinceLastKeyEvent);
          }
          return; // Skip this duplicate event
        }
        
        buffer += e.key;
        lastKeyProcessed = e.key;
        lastKeyTime = now;
        
        if (DEBUG) {
          console.log("[Barcode] ➕ Added char:", e.key, "CharCode:", e.key.charCodeAt(0), "Buffer:", buffer, "Time since last:", timeSinceLastKey, "IsScanning:", isScanning);
        }
      } else if (DEBUG) {
        console.log("[Barcode] ⚠️ Ignored special char:", e.key, "Code:", e.key.charCodeAt(0));
      }
    } else if (DEBUG && e.key !== "Enter" && e.key !== "Tab") {
      console.log("[Barcode] ⚠️ Ignored key:", e.key);
    }
  };

  // Also listen to keypress for better compatibility
  // NOTE: We now handle characters in keydown, so keypress is mainly for timing detection
  const onKeyPress = (e: KeyboardEvent) => {
    // Some scanners may trigger keypress instead of keydown
    // But we've already handled the character in keydown, so we just update timing here
    if (e.key.length === 1 && /^[0-9a-zA-Z\-_\.]$/.test(e.key)) {
      const now = Date.now();
      const timeSinceLastKey = now - lastTime;
      
      // Prevent duplicate processing - if we just processed this key in keydown, skip
      const timeSinceLastKeyEvent = now - lastKeyTime;
      if (e.key === lastKeyProcessed && timeSinceLastKeyEvent < DUPLICATE_KEY_THRESHOLD) {
        if (DEBUG) {
          console.log("[Barcode] ⏭️ KeyPress: Skipping duplicate key event:", e.key);
        }
        return; // Skip - already processed in keydown
      }
      
      if (timeSinceLastKey > TIMEOUT_MS) {
        buffer = "";
        isScanning = false;
      } else if (timeSinceLastKey < SCANNER_SPEED_THRESHOLD) {
        isScanning = true;
      }
      
      lastTime = now;
      // Only add to buffer if not already added by keydown
      if (timeSinceLastKeyEvent >= DUPLICATE_KEY_THRESHOLD || e.key !== lastKeyProcessed) {
        buffer += e.key;
        lastKeyProcessed = e.key;
        lastKeyTime = now;
        if (DEBUG) {
          console.log("[Barcode] KeyPress - Added char:", e.key, "Buffer:", buffer, "Time:", timeSinceLastKey, "IsScanning:", isScanning);
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
  const eventOptions = { capture: true, passive: false };
  
  window.addEventListener("keydown", onKeyDown, eventOptions);
  window.addEventListener("keypress", onKeyPress, eventOptions);
  
  // Also add to document for better coverage
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
    window.removeEventListener("keydown", onKeyDown, eventOptions);
    window.removeEventListener("keypress", onKeyPress, eventOptions);
    document.removeEventListener("keydown", onKeyDown, eventOptions);
    document.removeEventListener("keypress", onKeyPress, eventOptions);
    document.removeEventListener("input", onInput, eventOptions);
    if (DEBUG) {
      console.log("[Barcode] Scanner listener removed");
    }
  };
}

