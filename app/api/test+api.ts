console.log("🧪 [Test API] File loaded!");

export async function GET(request: Request) {
  console.log("🧪 [Test API] GET request received!");
  return Response.json(
    {
      status: "success",
      data: {
        message: "API routes are working!",
        timestamp: new Date().toISOString(),
      },
    },
    { status: 200 }
  );
}

export async function POST(request: Request) {
  console.log("🧪 [Test API] POST request received!");
  return Response.json(
    {
      status: "success",
      data: {
        message: "POST API routes are working!",
        timestamp: new Date().toISOString(),
      },
    },
    { status: 200 }
  );
}
