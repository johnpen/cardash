import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { resolveObjectURL } from 'node:buffer'


const CARTESIA_API_URL = "https://api.cartesia.ai/tts/bytes";


//export const dynamic = "force-dynamic";
//wtf

export async function POST(req: NextRequest) {
  const { text } = await req.json();

  if (!text) {
    return new Response(JSON.stringify({ error: "Text is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  
  const apiKey = process.env.CARTESIA_API_KEY;
  if (!apiKey) {
      logger.error("CARTESIA_API_KEY is not set");
      return new Response(JSON.stringify({ error: "TTS service is not configured."}), {
          status: 500,
          headers: { "Content-Type": "application/json" },
      });
  }

  try {
    const response = await fetch(CARTESIA_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cartesia-Version": "2024-05-10",
        "Authorization": "Bearer " + apiKey,
        
      },
      body: JSON.stringify({
        model_id: "sonic-3",
        transcript: text,
        voice:{
          mode:"id",
          "id":"1463a4e1-56a1-4b41-b257-728d56e93605",
        },
        "output_format":{
          container:"mp3",
          encoding:"pcm_f32le",
          sample_rate: 44100,
        }
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      logger.error("Cartesia API error", { status: response.status, body: errorBody });
      return new Response(errorBody, {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }


      const data = await response.blob()


    // Proxy the stream
    const mheaders = new Headers();
    mheaders.set("Content-Type", "application/mpeg");
    mheaders.set('Content-Disposition','attachment; filename="output.mp3"')


    const options = {
      headers: mheaders,
      status:200}
      

    return new Response(data, options)


  } catch (error: any) {
    logger.error("Error calling Cartesia API", { message: error.message });
    return new Response(JSON.stringify({ error: "Failed to fetch TTS stream" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}


