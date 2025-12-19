# Directors - Inquiry Institute Board of Directors

This repository represents the Board of Directors for the Inquiry Institute, showcasing the directors from each college and the heretic position.

## Quick Setup

Run the automated setup script:

```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

This will:
- Link your Supabase project
- Run database migrations
- Set up GitHub repository
- Enable GitHub Pages
- Configure GitHub Secrets

## Manual Setup

### Prerequisites

Install required CLIs:
```bash
# Supabase CLI
npm install -g supabase

# GitHub CLI
brew install gh  # macOS
# or visit: https://cli.github.com/

# AWS CLI (for DNS setup)
brew install awscli  # macOS
# or visit: https://aws.amazon.com/cli/
```

### Supabase Setup

The project is already configured for Supabase project: `xougqdomkoisrxdnagcj`

**Quick setup:**
```bash
chmod +x scripts/init-supabase.sh
./scripts/init-supabase.sh
```

This will:
- Link to the Supabase project
- Run all database migrations
- Set up the schema

**Manual setup:**
```bash
# Link to project (may prompt for database password)
supabase link --project-ref xougqdomkoisrxdnagcj

# Run migrations
supabase db push
```

**Get credentials:**
```bash
supabase status
```

Or from the dashboard: https://supabase.com/dashboard/project/xougqdomkoisrxdnagcj/settings/api

3. **Set up authentication**:
   - Enable Email authentication in Supabase Dashboard > Authentication > Providers
   - Create the custodian user:
     ```bash
     supabase auth users create custodian@inquiry.institute --password 'your-secure-password'
     ```
   - Or create users via the Supabase Dashboard

4. **Get credentials**:
   ```bash
   supabase status
   ```
   Or get them from: https://app.supabase.com/project/_/settings/api

### Member Classes

The system supports different member classes:
- **custodian**: Full access (custodian@inquiry.institute)
- **member**: Can participate in board chat and voting
- **observer**: Read-only access (future implementation)

Members are automatically created when they first authenticate. The custodian should be created manually or via migration.

### GitHub Setup

1. **Create repository** (if not exists):
   ```bash
   gh repo create InquiryInstitute/directors --public --source=. --remote=origin --push
   ```

2. **Enable GitHub Pages**:
   ```bash
   gh api repos/InquiryInstitute/directors/pages \
     --method POST \
     --field source='{"branch":"main","path":"/root"}'
   ```

3. **Set GitHub Secrets** (for CI/CD):
   ```bash
   gh secret set SUPABASE_URL --body "your-supabase-url" --repo InquiryInstitute/directors
   gh secret set SUPABASE_ANON_KEY --body "your-supabase-anon-key" --repo InquiryInstitute/directors
   gh secret set SUPABASE_PROJECT_REF --body "your-project-ref" --repo InquiryInstitute/directors
   gh secret set SUPABASE_ACCESS_TOKEN --body "your-access-token" --repo InquiryInstitute/directors
   ```

### DNS Setup (AWS Route53)

Set up DNS for the custom domain:

```bash
chmod +x scripts/setup-dns.sh
./scripts/setup-dns.sh
```

Or manually:
1. Create a CNAME record in Route53 pointing `directors.inquiry.institute` to `inquiryinstitute.github.io`
2. Wait for DNS propagation

### Local Development

1. **Configure Supabase** (create `config.local.js`):
   ```javascript
   window.SUPABASE_URL = 'your-supabase-url';
   window.SUPABASE_ANON_KEY = 'your-supabase-anon-key';
   ```

2. **Serve locally**:
   ```bash
   npm run dev
   # or
   python3 -m http.server 8000
   ```

3. Open http://localhost:8000

## Structure

- `index.html` - Main page displaying the board of directors
- `board.html` - Board chat and voting interface (requires authentication)
- `styles.css` - Styling for the main site
- `board.css` - Styling for the board interface
- `script.js` - JavaScript for fetching and displaying data from Supabase
- `board.js` - JavaScript for board chat and voting functionality
- `config.js` - Configuration file (override with config.local.js)
- `supabase/` - Database migrations and schema
  - `migrations/` - SQL migration files (run in order)
  - `config.toml` - Supabase CLI configuration
- `scripts/` - Setup and utility scripts
  - `setup.sh` - Main setup script
  - `setup-supabase.sh` - Supabase-specific setup
  - `setup-dns.sh` - DNS configuration (AWS Route53)
  - `build.sh` - Production build script
- `.github/workflows/` - GitHub Actions workflows
- `CNAME` - Custom domain configuration for GitHub Pages

## Board Chat & Voting

Access the board chat at `/board.html`. Features:

- **Authentication**: Members must log in to access
- **Real-time Chat**: Live board proceedings with all members
- **Director Principles**: System message and guidelines panel outlining director responsibilities:
  - **Institute First**: Prioritize what's best for the Inquiry Institute
  - **College Representation**: Represent college interests and views (can convene faculty meetings)
  - **Platform Adherence**: Adhere to platform statements that guide decision-making
  - **Decision Hierarchy**: Institute → College → College Views → Personal Platform
- **On/Off the Record Toggle**: Toggle button to mark messages as off the record (not formally recorded)
- **Issue Tracking**: Create and track issues for board discussion
- **Enhanced Voting System**: 
  - Directors can vote on issues (Yes/No/Abstain)
  - Vote weighting for special circumstances
  - Vote notes and detailed rationale
  - Comprehensive vote summaries with weighted totals
- **Action Items Tracking**: 
  - Create action items linked to issues
  - Assign to directors or members
  - Set due dates and track status (open, in_progress, completed, cancelled)
  - Overdue indicators and status management
- **Member Classes**: Different access levels (custodian, member, observer)

### Off the Record Feature

The board chat includes an "Off the Record" toggle that allows members to mark messages as informal or not part of the official proceedings. When enabled:
- Messages are still saved to the database but marked with an "Off the Record" badge
- Messages appear with a yellow background to distinguish them
- The toggle resets after each message is sent

## Member Management

Access member management at `/members.html` (custodian only). Features:

- **Add Members**: Create new member accounts
- **Update Member Classes**: Change member access levels
- **View All Members**: See all registered members
- **Sign Up**: New users can create accounts (auto-assigned as 'member')

## Pages

- `/index.html` - Public board of directors display
- `/board.html` - Board chat and voting (requires authentication)
- `/members.html` - Member management (custodian only)

## CI/CD

The repository includes GitHub Actions workflows:
- **deploy.yml**: Automatically deploys to GitHub Pages on push to main
- **setup-supabase.yml**: Runs database migrations when migration files change

## Environment Variables

For local development, create `config.local.js`:
```javascript
window.SUPABASE_URL = 'https://your-project.supabase.co';
window.SUPABASE_ANON_KEY = 'your-anon-key';
```

For production, these are set as GitHub Secrets and injected during deployment.
