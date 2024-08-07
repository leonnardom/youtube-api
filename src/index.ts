import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 3000;
const YOUTUBE_API_KEYS = [
  process.env.YOUTUBE_API_KEY1,
  process.env.YOUTUBE_API_KEY2,
  process.env.YOUTUBE_API_KEY3,
  process.env.YOUTUBE_API_KEY4,
];

let currentApiKeyIndex = 0;

const app = express();
app.use(bodyParser.json());

interface Comment {
  comment: string;
  author: string;
  date: string;
}

interface VideoInfo {
  title: string;
  views: number;
  likes: number;
  comments: number;
  link: string;
  commentsArray: Comment[];
}

function getCurrentApiKey() {
  return YOUTUBE_API_KEYS[currentApiKeyIndex];
}

function rotateApiKey() {
  currentApiKeyIndex = (currentApiKeyIndex + 1) % YOUTUBE_API_KEYS.length;
}

async function makeApiRequest(url: string, params: any) {
  let attempts = 0;
  while (attempts < YOUTUBE_API_KEYS.length) {
    try {
      params.key = getCurrentApiKey();
      const response = await axios.get(url, { params });

      return response;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        if (error.response && error.response.status === 403) {
          console.error(
            `\x1b[34m[API Limit]\x1b[0m`,
            `API key limit reached. Rotating API key.`
          );

          rotateApiKey();

          attempts++;
        } else {
          throw error;
        }
      } else {
        throw new Error("An unknown error occurred.");
      }
    }
  }
  throw new Error("All API keys have reached their limits.");
}

async function getYouTubeChannelInfo(
  channelId: string
): Promise<{ videos: VideoInfo[]; subscribers: number }> {
  try {
    let nextPageToken = "";
    let videoIds: string[] = [];

    const channelDetailsResponse = await makeApiRequest(
      `https://www.googleapis.com/youtube/v3/channels`,
      {
        id: channelId,
        part: "statistics",
      }
    );

    const subscribers = parseInt(
      channelDetailsResponse.data.items[0].statistics.subscriberCount
    );

    do {
      const response = await makeApiRequest(
        `https://www.googleapis.com/youtube/v3/search`,
        {
          channelId: channelId,
          part: "snippet,id",
          order: "date",
          maxResults: 50,
          pageToken: nextPageToken,
        }
      );

      const items = response.data.items;
      videoIds = videoIds.concat(items.map((item: any) => item.id.videoId));

      nextPageToken = response.data.nextPageToken;
    } while (nextPageToken);

    const videoData: VideoInfo[] = [];

    for (let i = 0; i < videoIds.length; i += 50) {
      const idsChunk = videoIds.slice(i, i + 50).join(",");

      const videoResponse = await makeApiRequest(
        `https://www.googleapis.com/youtube/v3/videos`,
        {
          id: idsChunk,
          part: "snippet,statistics",
        }
      );

      const items = videoResponse.data.items;

      for (const video of items) {
        const commentsArray: Comment[] = [];
        let nextCommentPageToken = "";

        do {
          const commentsResponse = await makeApiRequest(
            `https://www.googleapis.com/youtube/v3/commentThreads`,
            {
              videoId: video.id,
              part: "snippet",
              maxResults: 100,
              pageToken: nextCommentPageToken,
            }
          );

          const commentsItems = commentsResponse.data.items;
          commentsItems.forEach((item: any) => {
            commentsArray.push({
              comment: item.snippet.topLevelComment.snippet.textOriginal,
              author: item.snippet.topLevelComment.snippet.authorDisplayName,
              date: item.snippet.topLevelComment.snippet.publishedAt,
            });
          });

          nextCommentPageToken = commentsResponse.data.nextPageToken;
        } while (nextCommentPageToken);

        videoData.push({
          title: video.snippet.title,
          views: parseInt(video.statistics.viewCount),
          likes: parseInt(video.statistics.likeCount),
          comments: parseInt(video.statistics.commentCount),
          link: `https://www.youtube.com/watch?v=${video.id}`,
          commentsArray,
        });
      }
    }

    return { videos: videoData, subscribers };
  } catch (error: unknown) {
    console.error("Error in getYouTubeChannelInfo:", error);

    return { videos: [], subscribers: 0 };
  }
}

app.post("/getInformation", async (req: Request, res: Response) => {
  const { channelId } = req.body;

  console.log(`\x1b[34m[NEW POST]\x1b[0m`, `New Post using ID: ${channelId}`);

  try {
    const { videos, subscribers } = await getYouTubeChannelInfo(channelId);

    const totalViews = videos.reduce((acc, video) => acc + video.views, 0);
    const totalLikes = videos.reduce((acc, video) => acc + video.likes, 0);
    const totalComments = videos.reduce(
      (acc, video) => acc + video.comments,
      0
    );

    res.json({
      success: true,
      data: {
        totalViews,
        totalLikes,
        totalComments,
        subscribers,
        videos,
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ success: false, message: error.message });
    } else {
      res
        .status(500)
        .json({ success: false, message: "Unknown error occurred." });
    }
  }
});

app.listen(PORT, () =>
  console.log(`\x1b[34m[PORT]\x1b[0m`, `Server is running on port ${PORT}`)
);
