# Claude API Prompts & Integration Guide

This document contains the prompts and integration patterns used for AI analysis in the Music Practice Platform.

## Main Analysis Prompt

The primary prompt used in `src/lib/claude.ts` for analyzing practice sessions:

```typescript
You are an expert music teacher analyzing a student's practice session recording.

Session Title: ${sessionTitle}
Duration: ${Math.floor(duration / 60)} minutes ${duration % 60} seconds

Please analyze this practice session audio and provide detailed feedback in the following JSON format:

{
  "overallFeedback": "A comprehensive overview of the practice session (2-3 paragraphs)",
  "piecesIdentified": [
    {
      "name": "Name of the piece or exercise",
      "composer": "Composer name (if applicable)",
      "duration": estimated_duration_in_seconds,
      "timeSpent": "human readable time (e.g., '5:30')"
    }
  ],
  "timeBreakdown": {
    "warmup": seconds_spent_on_warmup,
    "technique": seconds_spent_on_technique,
    "scales": seconds_spent_on_scales,
    "repertoire": seconds_spent_on_repertoire,
    "sightReading": seconds_spent_on_sight_reading,
    "other": seconds_spent_on_other_activities
  },
  "suggestions": [
    {
      "timestamp": "approximate time in recording (e.g., '2:30')",
      "issue": "Description of the issue",
      "suggestion": "Specific actionable suggestion",
      "priority": "high" | "medium" | "low"
    }
  ],
  "strengths": [
    "List of things the student did well (be specific)"
  ],
  "areasForImprovement": [
    "List of specific areas to work on"
  ],
  "overallScore": a_number_from_1_to_10
}

Focus on:
1. Identifying what pieces, exercises, or scales were practiced
2. Assessing tone quality, rhythm accuracy, and technique
3. Noting any timing issues, wrong notes, or technical problems
4. Providing constructive, encouraging feedback
5. Giving specific, actionable suggestions for improvement

Remember: Be encouraging and constructive. Students need specific feedback to improve.

Respond with ONLY the JSON object, no additional text.
```

## Practice Suggestions Prompt

Used for generating next practice recommendations:

```typescript
As a music teacher, review these recent practice sessions and provide 3-5 specific suggestions for what the student should focus on in their next practice session:

Recent Sessions:
${sessionSummary}

Provide actionable, encouraging suggestions in a brief, bulleted format.
```

## Integration Code Examples

### Basic Analysis Call

```typescript
import { analyzePracticeSession } from '@/lib/claude'

const analysis = await analyzePracticeSession(
  '/path/to/audio.mp3',
  'Bach Prelude Practice',
  1800 // duration in seconds
)
```

### Response Structure

```typescript
interface AnalysisResult {
  overallFeedback: string
  piecesIdentified: PieceIdentified[]
  timeBreakdown: TimeBreakdown
  suggestions: Suggestion[]
  strengths: string[]
  areasForImprovement: string[]
  overallScore: number
}

interface PieceIdentified {
  name: string
  composer?: string
  duration: number
  timeSpent: string
}

interface TimeBreakdown {
  warmup?: number
  technique?: number
  scales?: number
  repertoire?: number
  sightReading?: number
  other?: number
}

interface Suggestion {
  timestamp?: string
  issue: string
  suggestion: string
  priority: 'high' | 'medium' | 'low'
}
```

## Prompt Engineering Tips

### For Better Results

1. **Include Context**
   - Session title helps Claude understand what was practiced
   - Duration helps with time estimates
   - Student level (if available) would help tailor feedback

2. **Request Structured Output**
   - JSON format ensures consistent parsing
   - Specific fields make it easier to display in UI
   - Enumerated priorities help with sorting

3. **Emphasize Constructiveness**
   - Ask for specific, actionable suggestions
   - Request encouraging feedback
   - Balance strengths with improvements

### Common Adjustments

**For Beginner Students:**
```typescript
const prompt = `...
The student is a beginner. Focus on basic technique and be extra encouraging.
...`
```

**For Advanced Students:**
```typescript
const prompt = `...
The student is advanced. Provide detailed technical analysis and advanced suggestions.
...`
```

**For Specific Instruments:**
```typescript
const prompt = `...
This is a ${instrument} practice session. Focus on instrument-specific technique.
...`
```

## Cost Optimization

### Reducing API Costs

1. **Cache Results**
   - Store analysis in database (already implemented)
   - Don't re-analyze unless requested

2. **Limit Audio Length**
   ```typescript
   const MAX_DURATION = 3600 // 1 hour max
   if (duration > MAX_DURATION) {
     throw new Error('Session too long for analysis')
   }
   ```

3. **Compress Audio**
   ```typescript
   // Use lower quality for analysis
   const compressedAudio = await compressAudio(audioBuffer, {
     bitrate: '64k',
     sampleRate: 22050
   })
   ```

4. **Batch Processing**
   ```typescript
   // Analyze multiple sessions in one call
   const analyses = await Promise.all(
     sessions.map(s => analyzePracticeSession(s.audio, s.title, s.duration))
   )
   ```

## Error Handling

### Fallback Response

```typescript
try {
  const analysis = await analyzePracticeSession(...)
  return analysis
} catch (error) {
  console.error('Claude API error:', error)

  // Return fallback
  return {
    overallFeedback: `Unable to analyze automatically. Duration: ${formatDuration(duration)}. Please review manually.`,
    piecesIdentified: [],
    timeBreakdown: {},
    suggestions: [],
    strengths: ['Completed a practice session'],
    areasForImprovement: ['Analysis unavailable'],
    overallScore: 5
  }
}
```

### Rate Limiting

```typescript
import { RateLimiter } from 'limiter'

const limiter = new RateLimiter({
  tokensPerInterval: 10,
  interval: 'minute'
})

async function analyzeWithRateLimit(sessionId: string) {
  await limiter.removeTokens(1)
  return await analyzePracticeSession(...)
}
```

## Advanced Features

### Multi-Part Analysis

For very long sessions, analyze in chunks:

```typescript
async function analyzeLongSession(audioPath: string, duration: number) {
  const CHUNK_SIZE = 600 // 10 minutes
  const chunks = splitAudio(audioPath, CHUNK_SIZE)

  const analyses = await Promise.all(
    chunks.map(chunk => analyzePracticeSession(chunk.path, chunk.title, chunk.duration))
  )

  return mergeAnalyses(analyses)
}
```

### Custom Analysis Types

```typescript
// Quick feedback (cheaper, faster)
async function getQuickFeedback(audioPath: string) {
  const prompt = `Brief 2-3 sentence feedback on this practice session:`
  // Use Claude with shorter max_tokens
}

// Detailed analysis (more expensive)
async function getDetailedAnalysis(audioPath: string) {
  const prompt = `Comprehensive analysis with measure-by-measure feedback:`
  // Use longer max_tokens and extended prompt
}
```

### Progress Tracking

```typescript
async function compareWithPrevious(
  currentSession: Session,
  previousSessions: Session[]
) {
  const prompt = `
Compare this practice session with previous sessions and note:
1. Improvements since last time
2. Persistent issues
3. Progress trajectory

Current Session: ${currentSession.title}
Previous Sessions: ${previousSessions.map(s => s.title).join(', ')}
`

  return await claude.messages.create({...})
}
```

## Testing Prompts

### Test with Sample Audio

```typescript
// Test analysis with known audio
const testAudio = './test/samples/beginner-scales.mp3'
const result = await analyzePracticeSession(testAudio, 'Test Scales', 180)

console.log('Analysis result:', JSON.stringify(result, null, 2))
```

### Prompt Validation

```typescript
// Ensure JSON response is valid
try {
  const parsed = JSON.parse(responseText)
  validateAnalysisSchema(parsed)
} catch (error) {
  console.error('Invalid response format:', error)
  // Fall back to text parsing or default response
}
```

## API Configuration

### Model Selection

```typescript
// Current: Fast and cost-effective
model: 'claude-3-5-sonnet-20241022'

// Alternative: More detailed (more expensive)
model: 'claude-opus-3-5-20241022'

// Alternative: Cheaper (less detailed)
model: 'claude-3-haiku-20240307'
```

### Token Limits

```typescript
{
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 4096, // Adjust based on detail needed
  temperature: 0.7, // Lower for more consistent output
}
```

## Monitoring & Analytics

### Track API Usage

```typescript
import { trackAnalytics } from './analytics'

async function analyzePracticeSession(...) {
  const startTime = Date.now()

  try {
    const result = await anthropic.messages.create({...})

    trackAnalytics({
      event: 'analysis_success',
      duration: Date.now() - startTime,
      inputTokens: result.usage.input_tokens,
      outputTokens: result.usage.output_tokens,
      cost: calculateCost(result.usage)
    })

    return parseAnalysis(result)
  } catch (error) {
    trackAnalytics({
      event: 'analysis_error',
      error: error.message
    })
    throw error
  }
}
```

## Future Enhancements

1. **Instrument-Specific Models**
   - Train on piano-specific feedback
   - Guitar-specific technique analysis
   - Violin intonation feedback

2. **Personalized Feedback**
   - Learn student's level over time
   - Adapt suggestions based on progress
   - Remember previous feedback

3. **Real-Time Analysis**
   - Stream audio during practice
   - Provide live feedback
   - Instant error detection

4. **Multi-Modal Analysis**
   - Combine audio + video
   - Analyze posture and technique
   - Visual notation feedback

---

For more information on the Claude API, visit:
- [Anthropic Documentation](https://docs.anthropic.com/)
- [Claude API Reference](https://docs.anthropic.com/claude/reference/)
- [Best Practices](https://docs.anthropic.com/claude/docs/best-practices)
