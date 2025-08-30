import { registerUser } from '@/lib/auth';

export async function POST(request) {
  try {
    const { email, password, name, age, gender } = await request.json();
    
    if (!email || !password || !name || !age || !gender) {
      return Response.json({ error: 'All fields are required (email, password, name, age, gender)' }, { status: 400 });
    }
    
    if (age < 18 || age > 100) {
      return Response.json({ error: 'Age must be between 18 and 100' }, { status: 400 });
    }
    
    if (!['male', 'female', 'other'].includes(gender.toLowerCase())) {
      return Response.json({ error: 'Gender must be male, female, or other' }, { status: 400 });
    }
    
    const user = registerUser(email, password, name, age, gender.toLowerCase());
    return Response.json({ user }, { status: 201 });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}