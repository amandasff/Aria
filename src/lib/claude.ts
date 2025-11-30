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
 * Analyze a practice session using Claude AI
 * Note: Currently analyzes based on session metadata
 * Future: Will include actual audio analysis when API supports it
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

    // Create intelligent analysis based on session metadata
    const prompt = `You are an expert music teacher providing feedback on a practice session.

Session Title: "${sessionTitle}"
Duration: ${Math.floor(duration / 60)} minutes ${duration % 60} seconds

Based on this practice session information, provide constructive feedback in this exact JSON format:

{
  "overallFeedback": "Write 2-3 paragraphs of encouraging, constructive feedback about this practice session. Comment on the duration, likely focus areas based on the title, and provide motivation.",
  "piecesIdentified": [
    {
      "name": "Piece or exercise name based on title",
      "composer": "Composer if identifiable from title",
      "duration": ${duration},
      "timeSpent": "${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}"
    }
  ],
  "timeBreakdown": {
    "warmup": ${Math.floor(duration * 0.2)},
    "technique": ${Math.floor(duration * 0.3)},
    "repertoire": ${Math.floor(duration * 0.5)}
  },
  "suggestions": [
    {
      "issue": "First area for improvement",
      "suggestion": "Specific actionable advice",
      "priority": "high"
    },
    {
      "issue": "Second area for improvement",
      "suggestion": "More specific advice",
      "priority": "medium"
    }
  ],
  "strengths": [
    "Specific thing done well",
    "Another strength",
    "Third strength"
  ],
  "areasForImprovement": [
    "Specific area to work on",
    "Another area for growth",
    "Third area for improvement"
  ],
  "overallScore": 7
}

Provide realistic, encouraging feedback. Score between 6-9. Focus on common practice areas.
Respond with ONLY the JSON object, no markdown formatting or extra text.`

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: prompt,
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
