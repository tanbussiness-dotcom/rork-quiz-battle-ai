console.log("🧪 [Test API] File loaded!");

export async function GET(request: Request) {
  console.log("🧪 [Test API] GET request received!");
  return new Response(
    JSON.stringify({ 
      success: true, 
      message: "API routes are working!",
      timestamp: new Date().toISOString()
    }),
    { 
      status: 200, 
      headers: { "Content-Type": "application/json" } 
    }
  );
}

export async function POST(request: Request) {
  console.log("🧪 [Test API] POST request received!");
  return new Response(
    JSON.stringify({ 
      success: true, 
      message: "POST API routes are working!",
      timestamp: new Date().toISOString()
    }),
    { 
      status: 200, 
      headers: { "Content-Type": "application/json" } 
    }
  );
}
