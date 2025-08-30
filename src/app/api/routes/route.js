import { saveUserRoute } from '@/lib/auth';
import { findMatchesForRoute, initializeSystemFromFiles, getSystemStatus } from '@/lib/backend.js';

export async function POST(request) {
  try {
    // Ensure system is initialized
    const status = getSystemStatus();
    if (!status.initialized) {
      await initializeSystemFromFiles();
    }

    const { userId, startPoint, destination, travelMode, timestamp } = await request.json();

    if (!userId || !startPoint || !destination) {
      return Response.json({ error: 'userId, startPoint, and destination are required' }, { status: 400 });
    }

    const routeData = {
      userId,
      startPoint,
      destination,
      travelMode: travelMode || 'WALKING',
      timestamp: timestamp || new Date().toISOString()
    };

    saveUserRoute(routeData);

    // Find matches using the backend
    try {
      const matches = findMatchesForRoute(userId, startPoint, destination, 0.3, 10);

      // Return the matches array
      return Response.json({
        success: true,
        matches: matches,
        totalMatches: matches.length,
        message: `Found ${matches.length} potential matches for your route`
      }, { status: 201 });

    } catch (matchError) {
      console.error('Error finding matches:', matchError);

      return Response.json({
        success: true,
        matches: [],
        totalMatches: 0,
        message: 'Route saved but no matches found',
        error: matchError.message
      }, { status: 201 });
    }
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
