# Internet Radio

A Next.js-based internet radio application that lets you stream radio stations from around the world, powered by the Radio Browser API.

Repository: [github.com/PierrunoYT/internet-radio-player](https://github.com/PierrunoYT/internet-radio-player)

## Features

- Stream radio stations from a global directory
- Search and filter stations by country and tags
- Add stations to favorites
- Dark/light mode support
- Responsive design for desktop and mobile

## Prerequisites

Before you begin, ensure you have installed:

- Node.js 18.17 or later
- SQLite3
- npm, yarn, pnpm, or bun

### Platform-Specific Setup

#### Windows
1. Install Node.js from [nodejs.org](https://nodejs.org/)
2. Install SQLite3:
   ```powershell
   winget install SQLite
   # or download from https://sqlite.org/download.html
   ```

#### macOS
```bash
# Using Homebrew
brew install node
brew install sqlite3
```

#### Linux (Ubuntu/Debian)
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install SQLite3
sudo apt-get install sqlite3
```

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/PierrunoYT/internet-radio-player.git
   cd internet-radio-player
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   # or
   bun install
   ```

3. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   # or
   bun dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Project Structure

```
internet-radio/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── stations/
│   │   │       └── route.ts      # Radio Browser API integration
│   │   ├── layout.tsx            # Root layout with fonts and styles
│   │   ├── page.tsx              # Homepage component
│   │   └── globals.css           # Global styles
│   ├── components/
│   │   └── RadioPlayer.tsx       # Main radio player component
│   └── lib/
│       └── db.ts                 # Database configuration and queries
├── public/
│   └── ...                       # Static assets
├── radio.db                      # SQLite database file
├── next.config.mjs               # Next.js configuration
├── tailwind.config.ts           # Tailwind CSS configuration
├── postcss.config.mjs           # PostCSS configuration
├── tsconfig.json                # TypeScript configuration
├── package.json                 # Project dependencies and scripts
└── LICENSE                      # MIT License file
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

PierrunoYT (2024-2025)
