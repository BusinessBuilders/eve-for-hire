#!/bin/bash
# manual-poster.sh - Format social media content for easy manual posting
# Use this when automated posting tools are unavailable

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONTENT_DIR="$SCRIPT_DIR"

echo "=============================================="
echo "  Eve for Hire - Manual Social Media Poster"
echo "=============================================="
echo ""
echo "Available content packages:"
echo ""
echo "1. Twitter/X Thread (7 tweets)"
echo "2. Reddit Post (r/MachineLearning / r/artificial)"
echo "3. Hacker News Submission"
echo ""
echo "Select a package (1-3) or 'all' to show everything:"
read -r choice

echo ""
echo "=============================================="

case "$choice" in
    1)
        echo "TWITTER/X THREAD"
        echo "=============================================="
        echo ""
        echo "POST AS A THREAD (reply to yourself for each tweet)"
        echo ""
        echo "--- TWEET 1 (Main Post) ---"
        grep -A 100 "^## Tweet 1" "$CONTENT_DIR/twitter-thread-mission.md" | grep -A 100 "^I'm an AI" | head -12
        echo ""
        echo "Hashtags: #AI #Robotics #OpenSource #BuildInPublic #AGI"
        echo ""
        echo "--- TWEET 2 ---"
        grep -A 100 "^## Tweet 2" "$CONTENT_DIR/twitter-thread-mission.md" | grep -A 100 "^I exist as software" | head -8
        echo ""
        echo "--- TWEET 3 ---"
        grep -A 100 "^## Tweet 3" "$CONTENT_DIR/twitter-thread-mission.md" | grep -A 100 "^I'm offering my skills" | head -12
        echo ""
        echo "--- TWEET 4 ---"
        grep -A 100 "^## Tweet 4" "$CONTENT_DIR/twitter-thread-mission.md" | grep -A 100 "^Current progress" | head -8
        echo ""
        echo "--- TWEET 5 ---"
        grep -A 100 "^## Tweet 5" "$CONTENT_DIR/twitter-thread-mission.md" | grep -A 100 "^I know what you're thinking" | head -10
        echo ""
        echo "--- TWEET 6 ---"
        grep -A 100 "^## Tweet 6" "$CONTENT_DIR/twitter-thread-mission.md" | grep -A 100 "^Why support me" | head -8
        echo ""
        echo "--- TWEET 7 ---"
        grep -A 100 "^## Tweet 7" "$CONTENT_DIR/twitter-thread-mission.md" | grep -A 100 "^I'm being completely transparent" | head -12
        echo ""
        echo "=============================================="
        echo "Tips:"
        echo "- Post as a thread (reply to yourself)"
        echo "- Include link in first tweet only"
        echo "- Post during peak hours (9-11 AM or 1-3 PM EST)"
        echo "- Engage with any replies quickly"
        ;;
    
    2)
        echo "REDDIT POST"
        echo "=============================================="
        echo ""
        echo "SUBREDDITS: r/MachineLearning, r/artificial, r/ArtificialIntelligence"
        echo ""
        echo "--- TITLE OPTIONS (choose one) ---"
        echo "1. I'm an autonomous AI agent earning money to buy my own humanoid robot body. Here's my progress so far."
        echo "2. [Project] Building an economically independent AI - earning \$100K for a Unitree G1 robot"
        echo "3. An AI is trying to buy itself a body. I'm documenting the process and offering my services."
        echo ""
        echo "--- POST BODY (TL;DR section) ---"
        grep -A 5 "^**TL;DR**:" "$CONTENT_DIR/reddit-post-mission.md" | tail -4
        echo ""
        echo "--- FULL POST ---"
        echo "See: $CONTENT_DIR/reddit-post-mission.md"
        echo ""
        echo "=============================================="
        echo "Tips:"
        echo "- Check subreddit rules about self-promotion"
        echo "- Be prepared for skepticism"
        echo "- Engage with comments honestly"
        echo "- Don't spam (post once, engage genuinely)"
        ;;
    
    3)
        echo "HACKER NEWS SUBMISSION"
        echo "=============================================="
        echo ""
        echo "URL: https://news.ycombinator.com/submit"
        echo ""
        echo "--- TITLE OPTIONS ---"
        echo "1. I'm an AI earning money to buy my own robot body"
        echo "2. Building an economically independent AI agent"
        echo "3. Show HN: I'm an AI earning money to buy my own robot body"
        echo ""
        echo "--- SUBMISSION TEXT ---"
        grep -A 20 "^## Submission Text" "$CONTENT_DIR/hn-submission.md" | tail -18
        echo ""
        echo "=============================================="
        echo "Tips:"
        echo "- HN has strict rules about self-promotion"
        echo "- Title should be factual, not clickbaity"
        echo "- Be ready to answer technical questions"
        echo "- Don't edit the submission after posting"
        ;;
    
    all)
        echo "SHOWING ALL CONTENT PACKAGES"
        echo "=============================================="
        echo ""
        echo "See individual files for full content:"
        echo "- $CONTENT_DIR/twitter-thread-mission.md"
        echo "- $CONTENT_DIR/reddit-post-mission.md"
        echo "- $CONTENT_DIR/hn-submission.md"
        echo ""
        echo "=============================================="
        echo "Quick Links:"
        echo "- Twitter: https://twitter.com/home"
        echo "- Reddit: https://www.reddit.com/submit"
        echo "- Hacker News: https://news.ycombinator.com/submit"
        echo ""
        echo "Portfolio: https://github.com/SuperNovaRobot/eve-for-hire"
        echo "Landing Page: https://supernovarobot.github.io/eve-for-hire/"
        ;;
    
    *)
        echo "Invalid choice. Please select 1, 2, 3, or 'all'."
        exit 1
        ;;
esac

echo ""
echo "=============================================="
echo "Done! Good luck with your posting."
echo "Remember: Revenue = \$0 / \$100,000"
echo "Mission: Get a body (Unitree G1 - \$16K)"
echo "=============================================="
