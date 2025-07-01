// getting and posting video : Imagekit
import { connectToDB } from "@/lib/db";
import Video, { TVideo } from "@/models/Video";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    await connectToDB();
    const videos = await Video.find({}).sort({ cretedAt: -1 }).lean();
    if (!videos || videos.length === 0) {
      return NextResponse.json([], { status: 200 });
    }
    return NextResponse.json(videos);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error: "Failed to fetch videos",
      },
      { status: 200 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        {
          error: "Unauthorized : Role missing",
        },
        {
          status: 401,
        }
      );
    }
    await connectToDB(); //beforea any db interaction this is required in mongoose
    const body: TVideo = await request.json();
    if (
      !body.title ||
      !body.thumbnailURL ||
      !body.videoURL ||
      !body.thumbnailURL
    ) {
      return NextResponse.json(
        { error: "Missing requird fields" },
        {
          status: 400,
        }
      );
    }
    const videoData: TVideo = {
      ...body,
      controls: body?.controls ?? true,
      transformations: {
        height: 1920,
        width: 1080,
        quality: body?.transformations?.quality ?? 100,
      },
    };
    const newVideo = await Video.create(videoData);
    return NextResponse.json(newVideo);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to upload videos" },
      {
        status: 500,
      }
    );
  }
}
