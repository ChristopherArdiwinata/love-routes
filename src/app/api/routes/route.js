import { saveUserRoute } from '@/lib/auth';

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
    // The return value to be used by the frontend
    // Array of user with their info & match lvl
    // user obj
    let template = {userId:"loremipsum", name: "name", age: "age", email: "email", mathcLevel: "90%"}
    let users = []
    return Response.json(users, { status: 201 });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}