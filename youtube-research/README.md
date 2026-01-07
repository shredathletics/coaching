# YouTube Outlier Finder for Shred Athletics

Find viral videos from small channels to model your content after. This tool identifies "outlier" videos - content from channels with few subscribers but disproportionately high view counts.

## The Strategy

**Goal:** Scale Shred Athletics to 100K+ subscribers in one year by posting weekly content modeled after proven viral videos.

**The Outlier Method:**
1. Find videos with high views but low subscriber counts
2. These videos "went viral" relative to the channel's size
3. Copy the winning formula: title, thumbnail style, hook, structure
4. Apply it to your running/fitness niche
5. Film, edit, post weekly

## Quick Start

### 1. Get a YouTube API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new project (or select existing)
3. Enable **YouTube Data API v3**
4. Create an API key (Credentials > Create Credentials > API Key)
5. Copy your API key

### 2. Set Up the Tool

```bash
cd youtube-research

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set your API key
export YOUTUBE_API_KEY='your-api-key-here'
```

### 3. Run Your First Scan

```bash
python youtube_outlier_finder.py --days 30 --min-views 10000 --max-subs 50000
```

## Output

The tool generates three files in the `reports/` folder:

1. **Markdown Report** (`outlier_report_YYYY-MM-DD.md`)
   - Detailed breakdown of top 20 outliers
   - Thumbnail images
   - Analysis checklist for each video
   - Space for your content ideas

2. **CSV Export** (`outliers_YYYY-MM-DD.csv`)
   - Spreadsheet-friendly format
   - Easy to sort and filter

3. **JSON Export** (`outliers_YYYY-MM-DD.json`)
   - For programmatic use
   - Integration with other tools

## Command Line Options

```
Options:
  --days INT        How many days back to search (default: 30)
  --min-views INT   Minimum view count (default: 10,000)
  --max-subs INT    Maximum subscriber count (default: 100,000)
  --threshold FLOAT Minimum outlier score - views/subs ratio (default: 10)
  --output DIR      Output directory for reports (default: ./reports)
  --format FORMAT   Output format: md, csv, json, or all (default: all)
```

### Example Searches

**Weekly scan (recommended):**
```bash
python youtube_outlier_finder.py --days 7 --min-views 5000 --threshold 5
```

**Find mega-viral content:**
```bash
python youtube_outlier_finder.py --days 90 --min-views 100000 --threshold 50
```

**Emerging creators only:**
```bash
python youtube_outlier_finder.py --max-subs 10000 --threshold 20
```

## Automated Weekly Reports

### Option 1: GitHub Actions (Recommended)

The workflow is already set up in `.github/workflows/weekly-youtube-research.yml`.

**Setup:**
1. Go to your GitHub repo > Settings > Secrets and variables > Actions
2. Add a new secret: `YOUTUBE_API_KEY` with your API key
3. The workflow runs every Monday at 9 AM UTC
4. Reports are committed to the repo and an Issue is created with top picks

**Manual trigger:** Go to Actions > Weekly YouTube Outlier Research > Run workflow

### Option 2: Local Cron Job

```bash
# Make the script executable
chmod +x run_weekly.sh

# Add to crontab (runs every Monday at 9 AM)
crontab -e

# Add this line:
0 9 * * 1 cd /path/to/youtube-research && ./run_weekly.sh
```

### Option 3: Run Manually

Just run the script whenever you're planning your weekly content:
```bash
./run_weekly.sh
```

## Understanding Outlier Scores

The **outlier score** = views / subscribers

| Score | Meaning |
|-------|---------|
| 5x | Video got 5x more views than the channel has subscribers |
| 10x | Video got 10x more views - solid outlier |
| 50x | Video got 50x more views - mega viral |
| 100x+ | Exceptional virality - study this closely |

**Example:**
- Channel with 5,000 subscribers
- Video with 250,000 views
- Outlier score = 50x

This video clearly struck a chord. The title, thumbnail, and content structure are worth modeling.

## Niche Keywords

The tool searches 40+ running/fitness keywords including:

**Training:**
- Marathon training tips
- Half marathon training plan
- 5k/10k training
- Tempo runs, intervals, easy runs

**Problems/Solutions:**
- Running injury prevention
- Runners knee, shin splints
- Running in heat/cold

**Lifestyle:**
- Running while working full time
- Morning run routine
- Running transformation

**Gear & Nutrition:**
- Best running shoes
- What to eat before a run
- Marathon fueling

You can customize keywords in `youtube_outlier_finder.py` by editing the `NICHE_KEYWORDS` list.

## Weekly Workflow

1. **Monday:** Run the outlier finder
2. **Tuesday:** Review report, pick 1-2 videos to model
3. **Wednesday:** Script your version (adapt title/hook to your style)
4. **Thursday-Friday:** Film the video
5. **Saturday:** Edit and finalize
6. **Sunday:** Post to YouTube

## Tips for 100K Subscribers

1. **Model, don't copy** - Take the concept and make it your own
2. **Study the hook** - First 3 seconds determine if people watch
3. **Thumbnail is 50% of success** - Recreate the thumbnail style
4. **Title patterns work** - "I did X for 30 days", "The truth about X"
5. **Consistency beats perfection** - Weekly posting builds the algorithm
6. **Engage with comments** - Reply to boost engagement
7. **Cross-promote** - Share clips on TikTok/Instagram Reels

## API Quota

YouTube Data API has a daily quota of 10,000 units.

Approximate costs:
- Search: 100 units per request
- Video details: 1 unit per video
- Channel details: 1 unit per channel

A typical scan uses ~2,000-5,000 units. You can run 2-5 scans per day.

## Troubleshooting

**"API key not found"**
```bash
export YOUTUBE_API_KEY='your-key-here'
```

**"Quota exceeded"**
- Wait until midnight Pacific Time (quota resets)
- Or create additional API keys in different projects

**No outliers found**
- Lower the `--min-views` threshold
- Lower the `--threshold` value
- Increase `--max-subs` to include larger channels
- Increase `--days` to search further back

## Files Structure

```
youtube-research/
├── youtube_outlier_finder.py  # Main script
├── requirements.txt           # Python dependencies
├── run_weekly.sh             # Weekly automation script
├── README.md                 # This file
└── reports/                  # Generated reports
    ├── outlier_report_2025-01-07.md
    ├── outliers_2025-01-07.csv
    └── outliers_2025-01-07.json
```

---

**Built for Shred Athletics** - Helping busy professionals achieve their running goals.

Questions? Open an issue or reach out via the [website](https://shredathletics.com).
