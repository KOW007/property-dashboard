import { HttpsProxyAgent } from 'https-proxy-agent';
import fetch from 'node-fetch';

export async function GET() {
  const proxyAgent = new HttpsProxyAgent(process.env.FIXIE_URL);
  
  const response = await fetch('https://api.ipify.org?format=json', {
    agent: proxyAgent
  });

  const data = await response.json();
  return Response.json({ ip: data.ip });
}