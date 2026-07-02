export async function GET() {
  return Response.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: {
      nodeEnv: process.env.NODE_ENV,
      hasPort: Boolean(process.env.PORT),
      port: process.env.PORT || '3000',
    }
  });
}
