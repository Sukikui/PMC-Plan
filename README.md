# PMC Plan 🗺️

> **[Play-MC.fr](https://play-mc.fr) navigation application and server directory**

PMC Plan is a sophisticated web application that provides optimal route calculation between locations in the Play-MC.fr Minecraft server, supporting both Overworld and Nether dimensions with intelligent portal-based transportation optimization.

[![CI Status](https://github.com/Sukikui/PMC-Plan/actions/workflows/ci.yml/badge.svg)](https://github.com/Sukikui/PMC-Plan/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-15.5-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black)](https://vercel.com/)

## 🌟 Features

### 🚀 **Intelligent Route Planning**
- **Multi-dimensional routing**: Calculates optimal paths between Overworld and Nether dimensions
- **Portal optimization**: Compares direct routes vs portal-based transportation
- **Advanced algorithms**: Euclidean distance calculation with Nether network pathfinding
- **Theoretical portal support**: Handles non-existent portal coordinates for planning purposes

### 🏗️ **Comprehensive Location Management**
- **Places**: Categorized locations with tags, descriptions, and ownership tracking
- **Portals**: Linked portal system between Overworld and Nether dimensions
- **Search & filtering**: Advanced tag-based filtering with AND/OR logic
- **Community contributions**: Automated GitHub issue-to-PR workflow for adding locations

### 🎨 **Modern UI/UX**
- **Responsive design**: Mobile-first approach with sliding panel interface
- **Dynamic theming**: Light/dark mode with state-based background colors
- **Real-time updates**: Position synchronization with Minecraft client integration
- **Beta access system**: Password-protected access with unlock mechanism

### 🌐 **Nether Network System**
- **Custom addressing**: Unique coordinate system for Nether transportation axes
- **8:1 conversion**: Accurate Minecraft Overworld-to-Nether coordinate transformation
- **Network optimization**: Intelligent routing through predefined Nether highways

## 🏗️ **Technology Stack**

### Frontend
- **[Next.js 15.5](https://nextjs.org/)** - React framework with App Router
- **[React 19.1](https://reactjs.org/)** - UI component library
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe development
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first styling with dark mode

### Backend
- **[Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)** - Serverless functions
- **[Zod](https://zod.dev/)** - Runtime type validation
- **File-based storage** - JSON data architecture for optimal performance

### Development & CI/CD
- **[Jest](https://jestjs.io/)** - Testing framework with 70% coverage threshold
- **[ESLint](https://eslint.org/)** - Code quality and formatting
- **[GitHub Actions](https://github.com/features/actions)** - Automated CI/CD pipeline
- **[Vercel](https://vercel.com/)** - Deployment and hosting platform

## 🚀 **Quick Start**

### Prerequisites
- **Node.js** 18.x or 20.x
- **npm** or **yarn**

### Installation

```bash
# Clone the repository
git clone https://github.com/Sukikui/PMC-Plan.git
cd PMC-Plan

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`

### Environment Setup

Create a `.env.local` file for environment-specific configuration:
```bash
# Beta access password (default: "beta" if not set)
NEXT_PUBLIC_BETA_PASSWORD=your_password_here

# Disable beta lock screen entirely (set to "true" to disable)
NEXT_PUBLIC_DISABLE_BETA_LOCK=false
```

A template file `.env.local.example` is provided with all available configuration options.

## 📖 **API Documentation**

PMC Plan provides a comprehensive REST API for route calculation and data management:

### Core Endpoints

- **`GET /api/route`** - Intelligent route calculation with multi-dimensional optimization
- **`GET /api/nether-address`** - Overworld to Nether coordinate conversion
- **`GET /api/nearest-portals`** - Distance-based portal discovery
- **`GET /api/linked-portal`** - Inter-dimensional portal linking

### Data Management

- **`GET /api/places`** - Places collection and individual place lookup
- **`GET /api/portals`** - Portal collection with merge functionality

### Utility Endpoints

- **`GET /api/places/[id]`** - Individual place data retrieval
- **`GET /api/portals/[id]`** - Individual portal data retrieval

For detailed API documentation, parameters, response schemas, and examples, see **[BACKEND_API.md](./BACKEND_API.md)**.

## 🗂️ **Project Structure**

```
PMC-Plan/
├── app/                    # Next.js App Router
│   ├── api/               # API endpoints
│   │   ├── route/         # Route calculation service
│   │   ├── places/        # Places management
│   │   ├── portals/       # Portal management
│   │   └── utils/         # Shared utilities
│   ├── layout.tsx         # Root layout with theming
│   └── page.tsx          # Main application entry
├── components/           # React components
│   ├── DestinationPanel.tsx  # Location selection UI
│   ├── PositionPanel.tsx     # Position input controls
│   ├── TravelPlan.tsx        # Route display component
│   └── icons/                # Custom icon components
├── lib/                  # Utility libraries
│   ├── theme-colors.ts   # Centralized color system
│   ├── ui-utils.ts       # UI helper functions
│   └── world-utils.ts    # Minecraft world utilities
├── public/data/          # Data storage
│   ├── places/           # Location JSON files
│   ├── portals/          # Portal JSON files
│   └── nether_axes.json  # Nether network configuration
├── tests/                # Test suite
│   ├── api.test.ts       # API unit tests
│   └── integration.test.ts # Integration tests
└── .github/              # CI/CD & community templates
    ├── workflows/        # GitHub Actions
    ├── scripts/          # Validation scripts
    ├── schemas/          # JSON validation schemas
    └── ISSUE_TEMPLATE/   # Community contribution forms
```

## 🤝 **Contributing**

PMC Plan uses an innovative community-driven contribution system. Anyone can add new places or portals through GitHub issues!

### Adding a New Place

1. **[Create a new Place issue](https://github.com/Sukikui/PMC-Plan/issues/new?assignees=&labels=place&template=add-place.yml&title=%F0%9F%8F%A0+Ajouter+un+nouveau+lieu+%3A+)**
2. Fill out the comprehensive form with:
   - Place ID (unique identifier)
   - Display name and coordinates
   - World type (Overworld/Nether)
   - Tags for categorization
   - Owner information (optional)
   - Discord server link (optional)
   - Image upload (optional)

3. **Automated processing**:
   - Validates data against JSON schema
   - Downloads and processes uploaded images
   - Creates a pull request automatically
   - Provides feedback in French

### Adding a New Portal

1. **[Create a new Portal issue](https://github.com/Sukikui/PMC-Plan/issues/new?assignees=&labels=portal&template=add-portal.yml&title=%F0%9F%8C%80+Ajouter+un+nouveau+portail+%3A+)**
2. Provide portal coordinates and world information
3. Automated validation and PR creation follows

### Development Contributing

```bash
# Fork and clone the repository
git clone https://github.com/yourusername/PMC-Plan.git

# Create a feature branch
git checkout -b feature/your-feature-name

# Make your changes and test
npm test
npm run lint

# Submit a pull request
```

## 🧪 **Testing**

PMC Plan maintains comprehensive test coverage:

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run API integration tests
npm run test:integration

# Lint code
npm run lint
```

### Test Categories
- **Unit Tests**: Individual API endpoint validation
- **Integration Tests**: Full route calculation scenarios
- **Schema Validation**: JSON data integrity checks
- **CI Testing**: Automated testing on Node.js 18.x and 20.x

## 🔧 **Configuration**

### Nether Network Configuration

The Nether transportation system is configured in `public/data/nether_axes.json`:

```json
{
  "axes": [
    {
      "id": "nord",
      "levels": [
        { "id": "nord_4_gauche", "address": "Nord 4 gauche", "z": -500 },
        { "id": "nord_4_droite", "address": "Nord 4 droite", "z": -400 }
      ]
    }
  ]
}
```

### Theme Configuration

Centralized theming system in `lib/theme-colors.ts` supports:
- Light/dark mode theming
- State-based background colors
- Semantic color tokens
- Accessibility-compliant contrast ratios

## 📊 **Performance & Analytics**

- **Serverless Architecture**: Optimized for Vercel deployment
- **Lazy Loading**: Components and data loaded on-demand  
- **Caching Strategy**: Static data with ISR (Incremental Static Regeneration)
- **Bundle Optimization**: Tree-shaking and code splitting
- **Lighthouse Score**: Optimized for performance, accessibility, and SEO

## 🔐 **Security & Privacy**

- **Input Validation**: All API inputs validated with Zod schemas
- **CORS Configuration**: Controlled API access for Minecraft mod integration
- **Beta Access**: Optional password protection for early access
- **No Tracking**: Privacy-focused with no external analytics
- **GitHub Integration**: Secure automated workflows with token-based authentication

## 🌐 **Deployment**

PMC Plan is deployed on [Vercel](https://vercel.com/) with manual deployment configuration:

```bash
# Deploy to production
vercel --prod

# Preview deployment
vercel
```

### Environment Variables
- `NEXT_PUBLIC_BETA_PASSWORD`: Beta access password (default: "beta")
- `NEXT_PUBLIC_DISABLE_BETA_LOCK`: Disable beta lock screen ("true" to disable)

## 📈 **Roadmap**

- [ ] **Real-time multiplayer**: Live position sharing between players
- [ ] **Mod integration**: Direct Minecraft client synchronization
- [ ] **Advanced analytics**: Route usage statistics and optimization insights
- [ ] **Mobile app**: React Native companion application  
- [ ] **3D visualization**: Interactive 3D map rendering
- [ ] **Multi-server support**: Extension beyond Play-MC.fr

## 📜 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 **Acknowledgments**

- **[Play-MC.fr](https://play-mc.fr)** - The French Minecraft server community
- **Contributors** - Community members who have added places and portals
- **Next.js Team** - For the excellent React framework
- **Vercel** - For seamless deployment and hosting

## 📞 **Support**

- **Issues**: [GitHub Issues](https://github.com/Sukikui/PMC-Plan/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Sukikui/PMC-Plan/discussions)  
- **Server**: [Play-MC.fr Discord](https://discord.play-mc.fr)

---

**Built with ❤️ for the French Minecraft community by [Suki](https://github.com/Sukikui)**

*PMC Plan makes Minecraft navigation intelligent, collaborative, and effortless.*