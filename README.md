YouTube Channel API
===================

This project is an API for YouTube channels, developed with Node.js and TypeScript, using Axios for API requests and Puppeteer for browser automation. The API collects information about videos and interactions from YouTube channels.

Features
--------

*   **Channel Information Collection:** Retrieves the total counts of views, likes, comments, and subscribers for a YouTube channel.
*   **Video Details:** Extracts information about posted videos, including views, likes, comments, and content.
*   **Comment Extraction:** Collects comments for each video, including the comment text, author, and date.
*   **API Key Rotation:** Automatically rotates between multiple YouTube API keys to avoid exceeding rate limits.

Requirements
------------

*   Node.js (v14 or higher)
*   TypeScript
*   `axios` (for API requests)
*   `dotenv` (for managing environment variables)
*   `PORT` environment variable (optional)
*   Multiple YouTube API keys stored in the `.env` file

Installation
------------

Clone the repository and install the dependencies:

    git clone https://github.com/yourusername/youtube-api.git
    cd youtube-api
    npm install

Running the Project
-------------------

To run the project directly in TypeScript, use the following command:

    npx ts-node src/index.ts

For a development environment with automatic reloading, install `ts-node-dev` and run:

    npm run dev

Available Scripts
-----------------

*   `start`: Runs the TypeScript code using `ts-node`.
*   `dev`: Runs the TypeScript code with `ts-node-dev` for development.

API Usage
---------

Send a POST request to the `/getInformation` endpoint with a JSON body containing the YouTube channel ID you want to collect information from:

    {
      "channelId": "channel_id"
    }

### Example Request

    POST http://localhost:3000/getInformation
    Content-Type: application/json
    
    {
      "channelId": "channel_id"
    }

### Example Response

```json
    {
      "success": true,
      "data": {
        "totalViews": 10000,
        "totalLikes": 500,
        "totalComments": 100,
        "subscribers": 2000,
        "videos": [
          {
            "title": "Video Title 1",
            "views": 1000,
            "likes": 50,
            "comments": 10,
            "link": "https://www.youtube.com/watch?v=video_id_1",
            "commentsArray": [
              {
                "comment": "Great video!",
                "author": "User1",
                "date": "2023-01-01T00:00:00Z"
              }
            ]
          },
          {
            "title": "Video Title 2",
            "views": 2000,
            "likes": 100,
            "comments": 20,
            "link": "https://www.youtube.com/watch?v=video_id_2",
            "commentsArray": [
              {
                "comment": "Very informative.",
                "author": "User2",
                "date": "2023-01-02T00:00:00Z"
              }
            ]
          }
        ]
      }
    }
```

Contributing
------------

Contributions are welcome! If you wish to contribute to this project, please fork the repository and submit a pull request with your changes.

License
-------

This project is licensed under the [MIT License](LICENSE).