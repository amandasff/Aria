import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs/promises'
import path from 'path'

// Initialize with explicit API key check
if (!process.env.ANTHROPIC_API_KEY) {
  console.warn('ANTHROPIC_API_KEY not found in environment variables')
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface PieceIdentified {
  name: string
  composer?: string
  duration: number // in seconds
  timeSpent: string // human-readable format
}

export interface TimeBreakdown {
  warmup?: number
  technique?: number
  scales?: number
  repertoire?: number
  sightReading?: number
  other?: number
}

export interface Suggestion {
  timestamp?: string
  issue: string
  suggestion: string
  priority: 'high' | 'medium' | 'low'
}

export interface AnalysisResult {
  overallFeedback: string
  piecesIdentified: PieceIdentified[]
  timeBreakdown: TimeBreakdown
  suggestions: Suggestion[]
  strengths: string[]
  areasForImprovement: string[]
  overallScore: number
}

/**
 * Analyze a practice session using Claude AI with actual audio analysis
 */
export async function analyzePracticeSession(
  audioFilePath: string,
  sessionTitle: string,
  duration: number
): Promise<AnalysisResult> {
  try {
    // Check if API key is available
    if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'sk-ant-api03-REPLACE_WITH_YOUR_KEY') {
      console.log('Using fallback analysis - no valid API key')
      return generateFallbackAnalysis(sessionTitle, duration)
    }

    // Read and encode audio file
    let audioData: string | null = null
    let audioMimeType = 'audio/mpeg'
    
    try {
      const audioBuffer = await fs.readFile(audioFilePath)
      audioData = audioBuffer.toString('base64')
      
      // Determine MIME type from file extension
      const ext = path.extname(audioFilePath).toLowerCase()
      if (ext === '.mp3') audioMimeType = 'audio/mpeg'
      else if (ext === '.wav') audioMimeType = 'audio/wav'
      else if (ext === '.webm') audioMimeType = 'audio/webm'
      else if (ext === '.m4a') audioMimeType = 'audio/mp4'
      else if (ext === '.ogg') audioMimeType = 'audio/ogg'
      else audioMimeType = 'audio/webm' // default (browsers typically record as webm)
    } catch (fileError) {
      console.warn('Could not read audio file, falling back to metadata-only analysis:', fileError)
      // Continue with metadata-only analysis if file can't be read
    }

    // Create comprehensive analysis prompt
    const prompt = `You are an expert music teacher analyzing a student's practice session recording.

Session Title: "${sessionTitle}"
Duration: ${Math.floor(duration / 60)} minutes ${duration % 60} seconds

${audioData ? 'I am providing you with the actual audio recording of this practice session. Please listen carefully and analyze:' : 'Please provide feedback based on the session information:'}

${audioData ? `
ANALYZE THE AUDIO FOR:
1. **Musical Content**: Identify what pieces, exercises, scales, or repertoire were practiced. Name specific pieces if recognizable.
2. **Pitch Accuracy**: Note any wrong notes, intonation issues, or pitch problems.
3. **Rhythm & Timing**: Assess rhythmic accuracy, tempo consistency, and timing issues.
4. **Technique**: Evaluate tone quality, articulation, dynamics, phrasing, and technical execution.
5. **Musicality**: Comment on expression, musical interpretation, and overall musicality.
6. **Practice Patterns**: Identify what the student focused on (warmup, scales, technique, repertoire, etc.) and estimate time spent on each.
7. **Specific Issues**: Note any specific problems with timestamps (e.g., "At 2:30, there's a rhythm issue in the left hand").
8. **Strengths**: Identify what the student did well - be specific about good technique, musical moments, or improvements.
9. **Areas for Improvement**: Provide specific, actionable feedback on what needs work.

Be detailed and specific. If you hear wrong notes, mention them. If timing is off, describe where and how. If technique needs work, explain what specifically.
` : `
Based on the session information, provide constructive feedback.`}

Provide your analysis in this exact JSON format:

{
  "overallFeedback": "${audioData ? 'Write 2-3 detailed paragraphs analyzing the practice session. Reference specific moments in the recording, note pitch accuracy, rhythm, technique, and musicality. Be specific about what you heard.' : 'Write 2-3 paragraphs of encouraging, constructive feedback about this practice session. Comment on the duration, likely focus areas based on the title, and provide motivation.'}",
  "piecesIdentified": [
    {
      "name": "${audioData ? 'Name of the actual piece/exercise you heard in the recording' : 'Piece or exercise name based on title'}",
      "composer": "${audioData ? 'Composer if you can identify it from the music' : 'Composer if identifiable from title'}",
      "duration": ${duration},
      "timeSpent": "${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}"
    }
  ],
  "timeBreakdown": {
    "warmup": ${audioData ? Math.floor(duration * 0.15) : Math.floor(duration * 0.2)},
    "technique": ${audioData ? Math.floor(duration * 0.25) : Math.floor(duration * 0.3)},
    "scales": ${audioData ? Math.floor(duration * 0.2) : 0},
    "repertoire": ${audioData ? Math.floor(duration * 0.4) : Math.floor(duration * 0.5)},
    "sightReading": 0,
    "other": 0
  },
  "suggestions": [
    {
      ${audioData ? '"timestamp": "2:30",' : ''}
      "issue": "${audioData ? 'Specific issue you heard (e.g., Wrong note at measure 5, Rhythm issue in left hand, Intonation problem)' : 'First area for improvement'}",
      "suggestion": "${audioData ? 'Specific actionable advice based on what you heard' : 'Specific actionable advice'}",
      "priority": "high"
    },
    {
      ${audioData ? '"timestamp": "4:15",' : ''}
      "issue": "${audioData ? 'Another specific issue you identified' : 'Second area for improvement'}",
      "suggestion": "${audioData ? 'More specific advice based on the audio' : 'More specific advice'}",
      "priority": "medium"
    }
  ],
  "strengths": [
    "${audioData ? 'Specific thing you heard that was done well (e.g., Good tone quality, Accurate rhythm in scales, Nice phrasing)' : 'Specific thing done well'}",
    "${audioData ? 'Another strength you identified from listening' : 'Another strength'}",
    "${audioData ? 'Third strength from the recording' : 'Third strength'}"
  ],
  "areasForImprovement": [
    "${audioData ? 'Specific area you heard that needs work (e.g., Intonation in higher register, Left hand coordination, Dynamics)' : 'Specific area to work on'}",
    "${audioData ? 'Another area you identified from the audio' : 'Another area for growth'}",
    "${audioData ? 'Third area for improvement based on what you heard' : 'Third area for improvement'}"
  ],
  "overallScore": ${audioData ? 7 : 7}
}

${audioData ? 'Be specific and reference what you actually heard in the recording. If you identified wrong notes, mention them. If timing was off, describe where. Score based on actual performance quality.' : 'Provide realistic, encouraging feedback. Score between 6-9.'}
Respond with ONLY the JSON object, no markdown formatting or extra text.`

    // Prepare message content
    const messageContent: any[] = [
      {
        type: 'text',
        text: prompt,
      },
    ]

    // Add audio if available
    if (audioData) {
      messageContent.push({
        type: 'audio',
        source: {
          type: 'base64',
          media_type: audioMimeType,
          data: audioData,
        },
      })
    }

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: messageContent,
        },
      ],
    })

    // Extract the response
    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

    // Parse JSON response - handle markdown code blocks
    let jsonText = responseText.trim()

    // Remove markdown code blocks if present
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    }

    // Find JSON object
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('Failed to parse JSON from Claude response:', responseText)
      return generateFallbackAnalysis(sessionTitle, duration)
    }

    const analysis: AnalysisResult = JSON.parse(jsonMatch[0])

    // Validate and return
    return {
      overallFeedback: analysis.overallFeedback || 'Great practice session!',
      piecesIdentified: analysis.piecesIdentified || [],
      timeBreakdown: analysis.timeBreakdown || {},
      suggestions: analysis.suggestions || [],
      strengths: analysis.strengths || ['Completed practice session'],
      areasForImprovement: analysis.areasForImprovement || [],
      overallScore: analysis.overallScore || 7,
    }
  } catch (error: any) {
    console.error('Error analyzing practice session:', error.message)

    // Return intelligent fallback
    return generateFallbackAnalysis(sessionTitle, duration)
  }
}

/**
 * Generate a fallback analysis when API is unavailable
 */
function generateFallbackAnalysis(sessionTitle: string, duration: number): AnalysisResult {
  const minutes = Math.floor(duration / 60)

  return {
    overallFeedback: `Great work completing this ${minutes}-minute practice session on "${sessionTitle}"! Consistent practice is the key to improvement. Keep up the dedication and focus on maintaining good technique throughout your practice time.`,
    piecesIdentified: [
      {
        name: sessionTitle,
        duration: duration,
        timeSpent: `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`,
      },
    ],
    timeBreakdown: {
      warmup: Math.floor(duration * 0.15),
      technique: Math.floor(duration * 0.35),
      repertoire: Math.floor(duration * 0.5),
    },
    suggestions: [
      {
        issue: 'Practice consistency',
        suggestion: 'Try to maintain regular daily practice sessions for best results.',
        priority: 'high',
      },
      {
        issue: 'Technique focus',
        suggestion: 'Spend time on scales and technical exercises to build fundamentals.',
        priority: 'medium',
      },
    ],
    strengths: [
      'Completed a full practice session',
      'Dedicated time to skill development',
      'Building consistent practice habits',
    ],
    areasForImprovement: [
      'Continue working on technical fundamentals',
      'Focus on accuracy over speed',
      'Record more sessions for detailed feedback',
    ],
    overallScore: 7,
  }
}

/**
 * Get practice suggestions based on recent history
 */
export async function getPracticeSuggestions(
  recentSessions: Array<{ title: string; duration: number; analysis?: any }>
): Promise<string> {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return 'Keep up the great work! Continue practicing regularly and focus on your technique.'
    }

    const sessionSummary = recentSessions
      .map((s, i) => `${i + 1}. ${s.title} (${Math.floor(s.duration / 60)}min)`)
      .join('\n')

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: `As a music teacher, review these recent practice sessions and provide 3-5 specific suggestions:

${sessionSummary}

Provide brief, actionable, encouraging suggestions.`,
        },
      ],
    })

    return message.content[0].type === 'text' ? message.content[0].text : 'Keep practicing consistently!'
  } catch (error) {
    return 'Continue with your regular practice routine. Consistency is key!'
  }
}
