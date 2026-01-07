#!/usr/bin/env python3
"""
YouTube Outlier Finder for Shred Athletics
Finds viral videos from small channels in the running/fitness niche.

This tool identifies "outlier" videos - content from channels with low subscribers
but disproportionately high view counts. These are goldmines for content ideas.
"""

import os
import json
import csv
from datetime import datetime, timedelta
from typing import Optional
from dataclasses import dataclass, asdict
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# Configuration
API_KEY = os.environ.get('YOUTUBE_API_KEY', '')
MAX_RESULTS_PER_SEARCH = 50
OUTLIER_THRESHOLD = 10  # Views must be 10x the subscriber count to be an outlier


@dataclass
class VideoOutlier:
    """Represents a viral outlier video."""
    title: str
    video_id: str
    video_url: str
    thumbnail_url: str
    channel_name: str
    channel_id: str
    channel_url: str
    subscriber_count: int
    view_count: int
    like_count: int
    comment_count: int
    published_at: str
    duration: str
    outlier_score: float  # views / subscribers ratio
    description: str
    tags: list


# Running/Fitness niche keywords to search
NICHE_KEYWORDS = [
    # Core running terms
    "marathon training tips",
    "half marathon training plan",
    "how to run faster",
    "running for beginners",
    "5k training",
    "10k training plan",
    "running motivation",
    "running form tips",
    "running technique",

    # Specific training concepts
    "easy run pace",
    "tempo run",
    "interval training running",
    "long run tips",
    "marathon race strategy",
    "negative split running",
    "heart rate zone training running",
    "maffetone method",
    "80/20 running",

    # Running problems/solutions
    "running injury prevention",
    "runners knee",
    "shin splints treatment",
    "how to avoid hitting the wall",
    "running in the heat",
    "running in cold weather",
    "treadmill vs outdoor running",

    # Running gear
    "best running shoes",
    "running watch review",
    "running gear essentials",
    "what to wear running",

    # Running nutrition
    "what to eat before a run",
    "running nutrition plan",
    "marathon fueling strategy",
    "running hydration",
    "carb loading for marathon",

    # Running lifestyle
    "morning run routine",
    "running while working full time",
    "busy professional running",
    "running transformation",
    "couch to 5k",
    "running streak",

    # Strength for runners
    "strength training for runners",
    "core workout for runners",
    "leg workout for runners",
    "hip exercises for runners",

    # Race specific
    "first marathon tips",
    "boston marathon qualifying",
    "ultra marathon training",
    "trail running tips",
    "parkrun tips",
]

# Competitor channels to monitor (add channel IDs here)
COMPETITOR_CHANNELS = [
    # Format: ("Channel Name", "Channel ID")
    # Find channel IDs by going to channel page > View Page Source > search for "channelId"
    # Or use: https://www.youtube.com/channel/CHANNEL_ID
]


def get_youtube_client():
    """Initialize YouTube API client."""
    if not API_KEY:
        raise ValueError(
            "YouTube API key not found. Set YOUTUBE_API_KEY environment variable.\n"
            "Get your API key at: https://console.cloud.google.com/apis/credentials"
        )
    return build('youtube', 'v3', developerKey=API_KEY)


def search_videos(youtube, query: str, published_after: str = None, max_results: int = 50) -> list:
    """Search for videos matching a query."""
    try:
        search_params = {
            'q': query,
            'part': 'snippet',
            'type': 'video',
            'maxResults': min(max_results, 50),
            'order': 'viewCount',  # Get most viewed first
            'relevanceLanguage': 'en',
        }

        if published_after:
            search_params['publishedAfter'] = published_after

        response = youtube.search().list(**search_params).execute()
        return response.get('items', [])
    except HttpError as e:
        print(f"Error searching for '{query}': {e}")
        return []


def get_video_details(youtube, video_ids: list) -> dict:
    """Get detailed statistics for videos."""
    if not video_ids:
        return {}

    try:
        response = youtube.videos().list(
            part='statistics,contentDetails,snippet',
            id=','.join(video_ids)
        ).execute()

        return {item['id']: item for item in response.get('items', [])}
    except HttpError as e:
        print(f"Error getting video details: {e}")
        return {}


def get_channel_details(youtube, channel_ids: list) -> dict:
    """Get subscriber counts for channels."""
    if not channel_ids:
        return {}

    # Remove duplicates while preserving order
    unique_ids = list(dict.fromkeys(channel_ids))

    try:
        # API allows max 50 channels per request
        all_channels = {}
        for i in range(0, len(unique_ids), 50):
            batch = unique_ids[i:i+50]
            response = youtube.channels().list(
                part='statistics,snippet',
                id=','.join(batch)
            ).execute()

            for item in response.get('items', []):
                all_channels[item['id']] = item

        return all_channels
    except HttpError as e:
        print(f"Error getting channel details: {e}")
        return {}


def calculate_outlier_score(views: int, subscribers: int) -> float:
    """Calculate how much of an outlier a video is.

    Score = views / subscribers
    Higher score = more viral relative to channel size
    """
    if subscribers <= 0:
        return views  # Treat 0 subscribers as maximum outlier potential
    return views / subscribers


def find_outliers(
    youtube,
    keywords: list = None,
    days_back: int = 30,
    min_views: int = 10000,
    max_subscribers: int = 100000,
    outlier_threshold: float = 10.0
) -> list[VideoOutlier]:
    """
    Find viral outlier videos in the running niche.

    Args:
        youtube: YouTube API client
        keywords: List of search terms (defaults to NICHE_KEYWORDS)
        days_back: How many days back to search
        min_views: Minimum view count to consider
        max_subscribers: Maximum subscriber count (we want small channels)
        outlier_threshold: Minimum views/subscribers ratio

    Returns:
        List of VideoOutlier objects sorted by outlier_score
    """
    if keywords is None:
        keywords = NICHE_KEYWORDS

    published_after = (datetime.utcnow() - timedelta(days=days_back)).isoformat() + 'Z'

    all_videos = {}  # video_id -> search result

    print(f"Searching {len(keywords)} keywords for outliers...")
    print(f"Looking for videos from the last {days_back} days")
    print(f"Min views: {min_views:,} | Max subscribers: {max_subscribers:,}")
    print(f"Outlier threshold: {outlier_threshold}x\n")

    # Search all keywords
    for i, keyword in enumerate(keywords, 1):
        print(f"[{i}/{len(keywords)}] Searching: {keyword}")
        results = search_videos(youtube, keyword, published_after)

        for item in results:
            video_id = item['id']['videoId']
            if video_id not in all_videos:
                all_videos[video_id] = item

    print(f"\nFound {len(all_videos)} unique videos. Getting details...")

    # Get video statistics
    video_ids = list(all_videos.keys())
    video_details = get_video_details(youtube, video_ids)

    # Get channel statistics
    channel_ids = [all_videos[vid]['snippet']['channelId'] for vid in video_ids if vid in video_details]
    channel_details = get_channel_details(youtube, list(set(channel_ids)))

    print(f"Analyzing {len(video_details)} videos from {len(channel_details)} channels...\n")

    # Find outliers
    outliers = []

    for video_id, search_item in all_videos.items():
        if video_id not in video_details:
            continue

        video = video_details[video_id]
        channel_id = search_item['snippet']['channelId']

        if channel_id not in channel_details:
            continue

        channel = channel_details[channel_id]

        # Get statistics
        stats = video.get('statistics', {})
        channel_stats = channel.get('statistics', {})

        view_count = int(stats.get('viewCount', 0))
        subscriber_count = int(channel_stats.get('subscriberCount', 0))

        # Apply filters
        if view_count < min_views:
            continue
        if subscriber_count > max_subscribers:
            continue

        # Calculate outlier score
        outlier_score = calculate_outlier_score(view_count, subscriber_count)

        if outlier_score < outlier_threshold:
            continue

        # This is an outlier! Create the object
        snippet = video.get('snippet', {})
        thumbnails = snippet.get('thumbnails', {})

        # Get best thumbnail
        thumbnail_url = (
            thumbnails.get('maxres', {}).get('url') or
            thumbnails.get('high', {}).get('url') or
            thumbnails.get('medium', {}).get('url') or
            thumbnails.get('default', {}).get('url', '')
        )

        outlier = VideoOutlier(
            title=snippet.get('title', ''),
            video_id=video_id,
            video_url=f"https://youtube.com/watch?v={video_id}",
            thumbnail_url=thumbnail_url,
            channel_name=snippet.get('channelTitle', ''),
            channel_id=channel_id,
            channel_url=f"https://youtube.com/channel/{channel_id}",
            subscriber_count=subscriber_count,
            view_count=view_count,
            like_count=int(stats.get('likeCount', 0)),
            comment_count=int(stats.get('commentCount', 0)),
            published_at=snippet.get('publishedAt', ''),
            duration=video.get('contentDetails', {}).get('duration', ''),
            outlier_score=round(outlier_score, 2),
            description=snippet.get('description', '')[:500],
            tags=snippet.get('tags', [])[:10]
        )

        outliers.append(outlier)

    # Sort by outlier score (most viral first)
    outliers.sort(key=lambda x: x.outlier_score, reverse=True)

    return outliers


def generate_report(outliers: list[VideoOutlier], output_dir: str = '.') -> str:
    """Generate a markdown report of outlier videos."""

    now = datetime.now()
    report_date = now.strftime('%Y-%m-%d')
    report_filename = f"outlier_report_{report_date}.md"
    report_path = os.path.join(output_dir, report_filename)

    report_lines = [
        f"# YouTube Outlier Report - {now.strftime('%B %d, %Y')}",
        f"## Shred Athletics Content Research",
        "",
        f"**Generated:** {now.strftime('%Y-%m-%d %H:%M')}",
        f"**Total Outliers Found:** {len(outliers)}",
        "",
        "---",
        "",
        "## Top Viral Outliers",
        "",
        "These videos significantly outperformed their channel size. Study their titles, thumbnails, and hooks.",
        "",
    ]

    for i, video in enumerate(outliers[:20], 1):  # Top 20
        report_lines.extend([
            f"### {i}. {video.title}",
            "",
            f"**Outlier Score:** {video.outlier_score}x (views/subscribers)",
            "",
            f"| Metric | Value |",
            f"|--------|-------|",
            f"| Views | {video.view_count:,} |",
            f"| Subscribers | {video.subscriber_count:,} |",
            f"| Likes | {video.like_count:,} |",
            f"| Comments | {video.comment_count:,} |",
            f"| Published | {video.published_at[:10]} |",
            "",
            f"**Channel:** [{video.channel_name}]({video.channel_url})",
            "",
            f"**Video Link:** [{video.title}]({video.video_url})",
            "",
            f"**Thumbnail:** ![]({video.thumbnail_url})",
            "",
            "**Why This Works (Analyze):**",
            "- [ ] Hook in first 3 seconds",
            "- [ ] Clickbait-worthy title",
            "- [ ] Thumbnail style",
            "- [ ] Content structure",
            "",
            "**Your Version Idea:**",
            "> _Write your adaptation here_",
            "",
            "---",
            "",
        ])

    # Add summary section
    report_lines.extend([
        "## Quick Reference - All Outliers",
        "",
        "| # | Title | Views | Subs | Score | Link |",
        "|---|-------|-------|------|-------|------|",
    ])

    for i, video in enumerate(outliers, 1):
        short_title = video.title[:50] + "..." if len(video.title) > 50 else video.title
        report_lines.append(
            f"| {i} | {short_title} | {video.view_count:,} | {video.subscriber_count:,} | {video.outlier_score}x | [Watch]({video.video_url}) |"
        )

    report_lines.extend([
        "",
        "---",
        "",
        "## Content Ideas Based on Trends",
        "",
        "Based on the outliers above, here are potential video ideas for Shred Athletics:",
        "",
        "1. _Idea 1_",
        "2. _Idea 2_",
        "3. _Idea 3_",
        "",
        "---",
        "",
        "*Generated by YouTube Outlier Finder for Shred Athletics*",
    ])

    report_content = '\n'.join(report_lines)

    with open(report_path, 'w', encoding='utf-8') as f:
        f.write(report_content)

    return report_path


def export_to_csv(outliers: list[VideoOutlier], output_dir: str = '.') -> str:
    """Export outliers to CSV for spreadsheet analysis."""

    now = datetime.now()
    csv_filename = f"outliers_{now.strftime('%Y-%m-%d')}.csv"
    csv_path = os.path.join(output_dir, csv_filename)

    with open(csv_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)

        # Header
        writer.writerow([
            'Rank', 'Title', 'Video URL', 'Thumbnail URL',
            'Channel', 'Subscribers', 'Views', 'Likes', 'Comments',
            'Outlier Score', 'Published', 'Tags'
        ])

        # Data
        for i, video in enumerate(outliers, 1):
            writer.writerow([
                i,
                video.title,
                video.video_url,
                video.thumbnail_url,
                video.channel_name,
                video.subscriber_count,
                video.view_count,
                video.like_count,
                video.comment_count,
                video.outlier_score,
                video.published_at[:10],
                ', '.join(video.tags[:5])
            ])

    return csv_path


def export_to_json(outliers: list[VideoOutlier], output_dir: str = '.') -> str:
    """Export outliers to JSON for programmatic use."""

    now = datetime.now()
    json_filename = f"outliers_{now.strftime('%Y-%m-%d')}.json"
    json_path = os.path.join(output_dir, json_filename)

    data = {
        'generated_at': now.isoformat(),
        'total_outliers': len(outliers),
        'outliers': [asdict(v) for v in outliers]
    }

    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    return json_path


def main():
    """Main entry point."""
    import argparse

    parser = argparse.ArgumentParser(
        description='Find viral YouTube outliers in the running/fitness niche'
    )
    parser.add_argument(
        '--days', type=int, default=30,
        help='How many days back to search (default: 30)'
    )
    parser.add_argument(
        '--min-views', type=int, default=10000,
        help='Minimum view count (default: 10,000)'
    )
    parser.add_argument(
        '--max-subs', type=int, default=100000,
        help='Maximum subscriber count (default: 100,000)'
    )
    parser.add_argument(
        '--threshold', type=float, default=10.0,
        help='Minimum outlier score (views/subs ratio, default: 10)'
    )
    parser.add_argument(
        '--output', type=str, default='./reports',
        help='Output directory for reports'
    )
    parser.add_argument(
        '--format', type=str, choices=['md', 'csv', 'json', 'all'], default='all',
        help='Output format (default: all)'
    )

    args = parser.parse_args()

    # Create output directory
    os.makedirs(args.output, exist_ok=True)

    # Initialize API
    print("=" * 60)
    print("YOUTUBE OUTLIER FINDER - Shred Athletics")
    print("=" * 60)
    print()

    try:
        youtube = get_youtube_client()
    except ValueError as e:
        print(f"ERROR: {e}")
        print("\nTo get started:")
        print("1. Go to https://console.cloud.google.com/apis/credentials")
        print("2. Create a new API key")
        print("3. Enable the YouTube Data API v3")
        print("4. Set the environment variable:")
        print("   export YOUTUBE_API_KEY='your-api-key-here'")
        return

    # Find outliers
    outliers = find_outliers(
        youtube,
        days_back=args.days,
        min_views=args.min_views,
        max_subscribers=args.max_subs,
        outlier_threshold=args.threshold
    )

    if not outliers:
        print("No outliers found matching your criteria.")
        print("Try adjusting --min-views, --max-subs, or --threshold")
        return

    print(f"\n{'=' * 60}")
    print(f"FOUND {len(outliers)} OUTLIER VIDEOS!")
    print(f"{'=' * 60}\n")

    # Generate reports
    if args.format in ['md', 'all']:
        md_path = generate_report(outliers, args.output)
        print(f"Markdown report: {md_path}")

    if args.format in ['csv', 'all']:
        csv_path = export_to_csv(outliers, args.output)
        print(f"CSV export: {csv_path}")

    if args.format in ['json', 'all']:
        json_path = export_to_json(outliers, args.output)
        print(f"JSON export: {json_path}")

    # Print top 5 summary
    print(f"\n{'=' * 60}")
    print("TOP 5 OUTLIERS TO MODEL:")
    print(f"{'=' * 60}\n")

    for i, video in enumerate(outliers[:5], 1):
        print(f"{i}. [{video.outlier_score}x] {video.title}")
        print(f"   Views: {video.view_count:,} | Subs: {video.subscriber_count:,}")
        print(f"   Channel: {video.channel_name}")
        print(f"   Link: {video.video_url}")
        print()


if __name__ == '__main__':
    main()
