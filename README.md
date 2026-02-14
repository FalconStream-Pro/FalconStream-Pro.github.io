# FalconStream-Pro.github.io

# M3U Stream Player

A modern, web-based M3U playlist player built with Next.js for streaming live content directly in your browser.

## ⚠️ Legal Disclaimer

**IMPORTANT**: By using this application, you acknowledge and agree that:

- You are solely responsible for the content you access through this player
- You own or have the legal right to stream any content accessed via uploaded M3U files
- The developers and maintainers of this application assume NO LIABILITY for any content streamed through this player
- You are responsible for ensuring your use complies with all applicable copyright laws and regulations
- This application is a media player tool only and does not host, provide, or endorse any streaming content
- Any misuse of this application for accessing unauthorized content is strictly prohibited

**By proceeding to use this application, you accept full legal responsibility for your actions.**

## 🎯 Project Overview

This M3U Stream Player allows users to upload M3U playlist files or select from pre-configured playlists to watch live streams directly in their web browser. Built with Next.js and optimized for static export to GitHub Pages.

## 🚀 Must-Have Features

### Core Functionality
- **M3U File Upload**: Drag-and-drop or file picker interface for uploading M3U/M3U8 playlist files
- **M3U File Parsing**: Robust parser that handles standard M3U and extended M3U (M3U8) formats
- **Video Player Integration**: HTML5 video player with HLS.js support for streaming
- **Channel List Display**: Clean, scrollable list of all channels parsed from the M3U file
- **Channel Selection**: Click to switch between different streams
- **Legal Consent Modal**: Mandatory user agreement before accessing any content
- **Responsive Design**: Mobile-friendly interface that works on all devices
- **GitHub Pages Deployment**: Proper Next.js static export configuration for GitHub Pages hosting

### User Interface
- **Channel Search/Filter**: Search bar to quickly find channels by name
- **Current Stream Info**: Display currently playing channel name and metadata
- **Loading States**: Visual feedback during file parsing and stream loading
- **Error Handling**: User-friendly error messages for failed streams or invalid files
- **Playback Controls**: Standard video controls (play, pause, volume, fullscreen)

### Technical Requirements
- **Static Site Generation**: Next.js configured for static export (no server-side features)
- **Client-Side Processing**: All M3U parsing and playlist management in browser
- **Local Storage**: Save user preferences and recently played channels
- **Cross-Browser Compatibility**: Support for Chrome, Firefox, Safari, and Edge

## ✨ Nice-to-Have Features

### Enhanced User Experience
- **Favorites System**: Bookmark favorite channels for quick access
- **Recently Played**: Track and display recently watched channels
- **Category Organization**: Group channels by categories (if available in M3U metadata)
- **EPG (Electronic Program Guide) Support**: Display program information if EPG data is available
- **Picture-in-Picture Mode**: Allow watching while browsing other tabs
- **Keyboard Shortcuts**: Quick navigation using keyboard (space for play/pause, arrow keys for channel switching)
- **Theme Customization**: Dark/light mode toggle
- **Multiple Playlist Management**: Save and switch between multiple M3U files

### Advanced Playback Features
- **Quality Selection**: Manual stream quality switching (if multiple sources available)
- **Subtitle Support**: Load and display subtitles if provided
- **Volume Memory**: Remember user's volume preference
- **Autoplay Options**: Continue to next channel or replay current stream
- **Stream Health Indicator**: Show connection quality and buffering status

### Social & Sharing
- **Share Channel**: Generate shareable links to specific channels (with timestamp)
- **Export Favorites**: Export favorite channels as a new M3U file
- **Playlist Import from URL**: Fetch M3U files from remote URLs

### Technical Enhancements
- **Service Worker**: Offline capability and faster loading
- **Stream Caching**: Cache stream metadata for faster switching
- **Analytics Dashboard**: View watch time statistics (privacy-focused, no external tracking)
- **Multi-Language Support**: Internationalization for UI text
- **Accessibility Features**: Screen reader support, ARIA labels, keyboard navigation
- **Stream Recording**: Allow downloading streams (where legally permitted)

## 🛠️ Technology Stack

- **Framework**: Next.js 14+ (with App Router)
- **Streaming**: HLS.js for HTTP Live Streaming support
- **Video Player**: Video.js or Plyr.js for enhanced player UI
- **Styling**: Tailwind CSS for responsive design
- **State Management**: React Context API or Zustand
- **File Parsing**: Custom M3U parser or m3u8-parser library
- **Storage**: LocalStorage API for persistence
- **Deployment**: GitHub Pages (static export)

## 📋 Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn/pnpm
- Git for version control
- GitHub account for hosting

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/m3u-stream-player.git

# Navigate to project directory
cd m3u-stream-player

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Export static site for GitHub Pages
npm run export
```

### GitHub Pages Deployment

1. **Configure next.config.js** for static export:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: process.env.NODE_ENV === 'production' ? '/m3u-stream-player' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/m3u-stream-player/' : '',
}

module.exports = nextConfig
```

2. **Create GitHub Actions workflow** (`.github/workflows/deploy.yml`):

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        run: npm run build
        
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./out
```

3. **Enable GitHub Pages** in repository settings:
   - Go to Settings > Pages
   - Source: Deploy from a branch
   - Branch: `gh-pages` / `root`

## 📁 Project Structure

```
m3u-stream-player/
├── app/
│   ├── layout.js              # Root layout with consent modal
│   ├── page.js                # Main player page
│   └── components/
│       ├── UploadZone.js      # M3U file upload component
│       ├── VideoPlayer.js     # Video streaming component
│       ├── ChannelList.js     # Channel selection sidebar
│       ├── ConsentModal.js    # Legal disclaimer modal
│       └── SearchBar.js       # Channel search/filter
├── lib/
│   ├── m3uParser.js           # M3U file parsing logic
│   └── storage.js             # LocalStorage utilities
├── public/
│   └── sample-playlists/      # Pre-configured M3U files (optional)
├── styles/
│   └── globals.css            # Global styles
├── next.config.js             # Next.js configuration for static export
├── package.json
└── README.md
```

## 🎨 Design Considerations

- **Consent First**: Show legal disclaimer before any functionality is accessible
- **Clean Interface**: Minimize clutter, focus on video player and channel list
- **Performance**: Lazy load channel list for large playlists (1000+ channels)
- **Security**: Sanitize all user inputs and M3U file content
- **Privacy**: No data sent to external servers, all processing client-side

## 📝 M3U Format Support

The player should support:
- Standard M3U format
- Extended M3U (M3U8) with metadata
- EXTINF tags for channel information
- Group titles for categorization
- TVG attributes (tvg-logo, tvg-name, tvg-id)

Example M3U format:
```
#EXTM3U
#EXTINF:-1 tvg-id="channel1" tvg-name="Channel Name" tvg-logo="logo.png" group-title="News",Channel Name
http://example.com/stream.m3u8
```

## 🔒 Security & Privacy

- All M3U processing happens client-side
- No user data collected or transmitted
- No external analytics or tracking
- LocalStorage used only for user preferences
- Content Security Policy headers recommended

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please read CONTRIBUTING.md for guidelines.

## ⚖️ Legal Notice

This application is provided "as is" without warranty of any kind. Users are responsible for ensuring their use complies with all applicable laws and regulations. The developers assume no liability for misuse of this application.

## 📞 Support

For issues, questions, or feature requests, please open an issue on GitHub.

---

**Remember**: Only use content you have the legal right to access. Respect copyright laws and content creators.


For m3u files refer this repository - https://github.com/Free-TV/IPTV
