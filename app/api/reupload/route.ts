// app/api/reupload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { spawn } from 'child_process';
import { createReadStream, existsSync, mkdirSync, unlinkSync } from 'fs';
import path from 'path';
import os from 'os';
import { randomUUID } from 'crypto';

export const maxDuration = 300; // adjust for your hosting (Vercel Pro etc. needed for long jobs)
const YT_DLP_PATH = process.env.YT_DLP_PATH || 'yt-dlp';
function downloadVideo(url: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(YT_DLP_PATH, [
        '-f', 'bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/best',
        '--merge-output-format', 'mp4',
        '-o', outputPath,
        '--no-playlist',
        url,
      ]);

    let stderr = '';
    proc.stderr.on('data', (d) => (stderr += d.toString()));

    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`yt-dlp failed (code ${code}): ${stderr}`));
    });

    proc.on('error', reject);
  });
}

function getOAuthClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET,
    process.env.YOUTUBE_REDIRECT_URI
  );
  oauth2Client.setCredentials({
    refresh_token: process.env.YOUTUBE_REFRESH_TOKEN,
  });
  return oauth2Client;
}

async function uploadToYouTube(
  filePath: string,
  metadata: { title: string; description?: string; tags?: string[] }
) {
  const auth = getOAuthClient();
  const youtube = google.youtube({ version: 'v3', auth });

  const res = await youtube.videos.insert({
    part: ['snippet', 'status'],
    requestBody: {
      snippet: {
        title: metadata.title,
        description: metadata.description || '',
        tags: metadata.tags || [],
      },
      status: {
        privacyStatus: 'private', // change to 'public' or 'unlisted' once tested
      },
    },
    media: {
      body: createReadStream(filePath),
    },
  });

  return res.data;
}

export async function POST(req: NextRequest) {
  try {
    const { sourceUrl, title, description, tags } = await req.json();

    if (!sourceUrl || !title) {
      return NextResponse.json(
        { error: 'sourceUrl and title are required' },
        { status: 400 }
      );
    }

    // Basic sanity check that this is a YouTube URL
    const isYouTube = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//.test(
      sourceUrl
    );
    if (!isYouTube) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
    }

    const tmpDir = path.join(os.tmpdir(), 'yt-reupload');
    if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true });

    const filename = `${randomUUID()}.mp4`;
    const filePath = path.join(tmpDir, filename);

    // 1. Download
    await downloadVideo(sourceUrl, filePath);

    // 2. Upload
    const result = await uploadToYouTube(filePath, {
      title,
      description,
      tags,
    });

    // 3. Cleanup
    unlinkSync(filePath);

    return NextResponse.json({
      success: true,
      youtubeVideoId: result.id,
      youtubeUrl: `https://youtube.com/watch?v=${result.id}`,
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}