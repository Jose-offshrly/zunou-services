/**
 * Rule-based transcript cleanup
 * Removes duplicates, merges incomplete sentences, and filters noise
 */

import { readFile, writeFile } from 'fs/promises'

interface TranscriptLine {
  timestamp: string
  speaker: string
  text: string
  originalLine: string
}

class TranscriptCleaner {
  
  /**
   * Parse transcript line: [2025-11-21T03:33:06.182Z] Speaker Name: text here
   */
  private parseTranscriptLine(line: string): TranscriptLine | null {
    const match = line.match(/\[([\d\-T:.Z]+)\]\s+([^:]+):\s+(.+)/)
    if (!match) return null
    
    return {
      timestamp: match[1],
      speaker: match[2].trim(),
      text: match[3].trim(),
      originalLine: line
    }
  }
  
  /**
   * Calculate similarity between two strings (0-1)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const words1 = str1.toLowerCase().split(/\s+/)
    const words2 = str2.toLowerCase().split(/\s+/)
    
    // Count common words
    const common = words1.filter(word => words2.includes(word)).length
    const total = Math.max(words1.length, words2.length)
    
    return total > 0 ? common / total : 0
  }
  
  /**
   * Check if text is likely noise/hallucination
   */
  private isNoise(text: string): boolean {
    // Very short utterances (< 3 chars)
    if (text.length < 3) return true
    
    // Common hallucinations
    const noisePatterns = [
      /^(um|uh|hmm|mm|ah|eh)$/i,
      /^(yeah|yes|no|okay|ok)$/i, // Only if standalone
      /^thank you$/i, // Common hallucination
      /^you$/i,
      /^i$/i,
      /^the$/i,
      /^and$/i,
    ]
    
    return noisePatterns.some(pattern => pattern.test(text.trim()))
  }
  
  /**
   * Check if sentence seems incomplete
   */
  private isIncomplete(text: string): boolean {
    // Ends with preposition, conjunction, or mid-word
    const incompleteEndings = /\b(the|a|an|and|but|or|so|if|when|while|for|to|at|in|on|with|about)$/i
    
    // Very short (< 5 words) and doesn't end with punctuation
    const words = text.split(/\s+/)
    const hasEnding = /[.!?]$/.test(text)
    
    return (words.length < 5 && !hasEnding) || incompleteEndings.test(text)
  }
  
  /**
   * Merge consecutive entries from same speaker if they form a complete thought
   */
  private mergeConsecutiveEntries(entries: TranscriptLine[]): TranscriptLine[] {
    const merged: TranscriptLine[] = []
    let currentEntry: TranscriptLine | null = null
    
    for (const entry of entries) {
      if (!currentEntry) {
        currentEntry = { ...entry }
        continue
      }
      
      // Same speaker and within 3 seconds?
      const timeDiff = new Date(entry.timestamp).getTime() - new Date(currentEntry.timestamp).getTime()
      const sameSpeaker = currentEntry.speaker === entry.speaker
      const closeInTime = timeDiff < 3000 // 3 seconds
      
      if (sameSpeaker && closeInTime) {
        // Check if we should merge
        const similarity = this.calculateSimilarity(currentEntry.text, entry.text)
        
        if (similarity > 0.8) {
          // Very similar - likely duplicate, keep longer version
          if (entry.text.length > currentEntry.text.length) {
            currentEntry = { ...entry }
          }
        } else if (this.isIncomplete(currentEntry.text)) {
          // Previous entry incomplete, merge with next
          currentEntry.text = `${currentEntry.text} ${entry.text}`
          currentEntry.timestamp = entry.timestamp // Use latest timestamp
        } else {
          // Both complete, save current and start new
          merged.push(currentEntry)
          currentEntry = { ...entry }
        }
      } else {
        // Different speaker or too far apart
        merged.push(currentEntry)
        currentEntry = { ...entry }
      }
    }
    
    // Don't forget the last entry
    if (currentEntry) {
      merged.push(currentEntry)
    }
    
    return merged
  }
  
  /**
   * Find common prefix between two texts (word-based)
   */
  private findCommonPrefix(text1: string, text2: string): { common: string, remaining: string } {
    const words1 = text1.toLowerCase().split(/\s+/)
    const words2 = text2.toLowerCase().split(/\s+/)
    
    let commonLength = 0
    for (let i = 0; i < Math.min(words1.length, words2.length); i++) {
      if (words1[i] === words2[i]) {
        commonLength++
      } else {
        break
      }
    }
    
    // Get the original case version of common part from text2 (longer version)
    const words2Original = text2.split(/\s+/)
    const common = words2Original.slice(0, commonLength).join(' ')
    const remaining = words2Original.slice(commonLength).join(' ')
    
    return { common, remaining }
  }
  
  /**
   * Remove duplicates and near-duplicates
   * Handles progressive updates with speaker attribution changes
   */
  private removeDuplicates(entries: TranscriptLine[]): TranscriptLine[] {
    const cleaned: TranscriptLine[] = []
    const skipIndices = new Set<number>()
    
    for (let i = 0; i < entries.length; i++) {
      if (skipIndices.has(i)) continue
      
      const current = entries[i]
      
      // Look back at recent entries (within 15 seconds) for duplicates
      let foundDuplicate = false
      
      for (let j = cleaned.length - 1; j >= Math.max(0, cleaned.length - 5); j--) {
        const previous = cleaned[j]
        const timeDiff = new Date(current.timestamp).getTime() - new Date(previous.timestamp).getTime()
        
        // Only check entries within 15 seconds
        if (timeDiff > 15000) break
        
        const similarity = this.calculateSimilarity(current.text, previous.text)
        
        // High similarity = likely progressive update or duplicate
        if (similarity > 0.7 && timeDiff < 15000) {
          // Check if this is same speaker or different speaker
          if (current.speaker === previous.speaker) {
            // Same speaker - simple case, keep longer version
            if (current.text.length > previous.text.length) {
              cleaned[j] = current // Replace with longer version
            }
            foundDuplicate = true
            break
          } else {
            // Different speaker - likely speaker detection lag
            // KEEP FIRST SPEAKER'S ATTRIBUTION
            
            // Check if current has significant additional content
            const { common, remaining } = this.findCommonPrefix(previous.text, current.text)
            const remainingWords = remaining.trim().split(/\s+/).filter(w => w.length > 0)
            
            if (remainingWords.length > 8) {
              // Significant new content (> 8 words)
              // Update previous entry with complete text, keep first speaker
              cleaned[j] = {
                ...previous,
                text: current.text.startsWith(common) ? current.text : previous.text + ' ' + current.text
              }
              foundDuplicate = true
              
              // Note: We're NOT creating a separate entry for the new content
              // because it's all part of the same speaker's thought
              // AI cleanup will handle splitting if needed
            } else {
              // Just a duplicate with wrong speaker attribution
              // Update previous with longer text, keep first speaker
              if (current.text.length > previous.text.length) {
                cleaned[j] = {
                  timestamp: previous.timestamp,
                  speaker: previous.speaker, // Keep first speaker!
                  text: current.text,
                  originalLine: previous.originalLine
                }
              }
              foundDuplicate = true
            }
            break
          }
        }
      }
      
      // Check if this is a substring of the next entry (partial update)
      if (!foundDuplicate && i < entries.length - 1) {
        const next = entries[i + 1]
        const timeDiff = new Date(next.timestamp).getTime() - new Date(current.timestamp).getTime()
        
        if (timeDiff < 3000) {
          // Check if current is contained in next
          const similarity = this.calculateSimilarity(current.text, next.text)
          if (similarity > 0.8 && next.text.length > current.text.length) {
            // Current is likely a partial of next, skip it
            foundDuplicate = true
            skipIndices.add(i)
          }
        }
      }
      
      if (!foundDuplicate) {
        cleaned.push(current)
      }
    }
    
    return cleaned
  }
  
  /**
   * Filter out noise and hallucinations
   */
  private filterNoise(entries: TranscriptLine[]): TranscriptLine[] {
    return entries.filter(entry => !this.isNoise(entry.text))
  }
  
  /**
   * Format cleaned entries back to transcript format
   */
  private formatTranscript(entries: TranscriptLine[]): string {
    return entries
      .map(entry => `[${entry.timestamp}] ${entry.speaker}: ${entry.text}`)
      .join('\n') + '\n'
  }
  
  /**
   * Main cleanup function
   */
  async cleanTranscript(inputPath: string, outputPath?: string): Promise<string> {
    try {
      console.log(`🧹 Starting transcript cleanup: ${inputPath}`)
      
      // Read original transcript
      const content = await readFile(inputPath, 'utf-8')
      const lines = content.split('\n').filter(line => line.trim())
      
      console.log(`📊 Original transcript: ${lines.length} lines`)
      
      // Parse all lines
      const entries = lines
        .map(line => this.parseTranscriptLine(line))
        .filter((entry): entry is TranscriptLine => entry !== null)
      
      console.log(`📊 Parsed entries: ${entries.length}`)
      
      // Step 1: Remove noise
      let cleaned = this.filterNoise(entries)
      console.log(`✨ After noise filtering: ${cleaned.length} lines`)
      
      // Step 2: Remove duplicates
      cleaned = this.removeDuplicates(cleaned)
      console.log(`✨ After duplicate removal: ${cleaned.length} lines`)
      
      // Step 3: Merge consecutive incomplete entries
      cleaned = this.mergeConsecutiveEntries(cleaned)
      console.log(`✨ After merging: ${cleaned.length} lines`)
      
      // Format output
      const cleanedContent = this.formatTranscript(cleaned)
      
      // Save to output file
      const savePath = outputPath || inputPath.replace('.log', '_cleaned.log')
      await writeFile(savePath, cleanedContent, 'utf-8')
      
      console.log(`✅ Cleaned transcript saved: ${savePath}`)
      console.log(`📉 Reduction: ${lines.length} → ${cleaned.length} lines (${Math.round((1 - cleaned.length / lines.length) * 100)}% reduction)`)
      
      return savePath
      
    } catch (error) {
      console.error('❌ Error cleaning transcript:', error)
      throw error
    }
  }
  
  /**
   * Get cleanup statistics
   */
  async getCleanupStats(originalPath: string, cleanedPath: string): Promise<any> {
    const original = await readFile(originalPath, 'utf-8')
    const cleaned = await readFile(cleanedPath, 'utf-8')
    
    const originalLines = original.split('\n').filter(l => l.trim()).length
    const cleanedLines = cleaned.split('\n').filter(l => l.trim()).length
    
    return {
      originalLines,
      cleanedLines,
      linesRemoved: originalLines - cleanedLines,
      reductionPercent: Math.round((1 - cleanedLines / originalLines) * 100)
    }
  }
}

// Export singleton
export const transcriptCleaner = new TranscriptCleaner()

