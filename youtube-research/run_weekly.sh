#!/bin/bash
# Weekly YouTube Outlier Report Generator for Shred Athletics
# Run this script weekly via cron or manually

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPORTS_DIR="$SCRIPT_DIR/reports"
LOG_FILE="$SCRIPT_DIR/weekly_run.log"

echo "======================================"
echo "Shred Athletics - Weekly Outlier Scan"
echo "$(date)"
echo "======================================"

# Ensure reports directory exists
mkdir -p "$REPORTS_DIR"

# Activate virtual environment if it exists
if [ -f "$SCRIPT_DIR/venv/bin/activate" ]; then
    source "$SCRIPT_DIR/venv/bin/activate"
fi

# Run the outlier finder
python3 "$SCRIPT_DIR/youtube_outlier_finder.py" \
    --days 7 \
    --min-views 5000 \
    --max-subs 50000 \
    --threshold 5 \
    --output "$REPORTS_DIR" \
    --format all \
    2>&1 | tee -a "$LOG_FILE"

echo ""
echo "Report generated in: $REPORTS_DIR"
echo "Check the markdown file for your weekly content ideas!"
