import { saveUserRoute } from '@/lib/auth';
import { findMatchesForRoute, initializeSystemFromFiles, getSystemStatus } from '@/lib/backend.js';

export async function POST(request) {
  try {
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

    // Initialize the matching system if not already done
    const systemStatus = getSystemStatus();
    if (!systemStatus.initialized) {
      const initSuccess = await initializeSystemFromFiles();
      if (!initSuccess) {
        return Response.json({
          error: 'Failed to initialize matching system. Please ensure sydney_network_data.json and users.json are available.'
        }, { status: 500 });
      }
    }

    // Find matches using the backend matching system
    // startPoint = start station, destination = end station for user1
    const matches = findMatchesForRoute(userId, startPoint, destination, 0.3, 10);

    // Convert matches to the format expected by frontend
    const users = matches.map(match => ({
      userId: match.userId,
      name: match.name,
      age: match.age,
      email: match.email,
      matchLevel: match.matchLevel,
      routeOverlap: match.routeOverlap,
      interestOverlap: match.interestOverlap,
      startStation: match.startStation,
      endStation: match.endStation,
      userPath: match.userPath,
      requestorPath: match.requestorPath
    }));

    return Response.json(users, { status: 201 });

  } catch (error) {
    console.error('Error in route matching:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
