# Supabase Setup

## Using Supabase CLI (Recommended)

### Quick Setup

```bash
chmod +x ../scripts/setup-supabase.sh
../scripts/setup-supabase.sh
```

### Manual Setup

1. **Install Supabase CLI**: `npm install -g supabase`

2. **Link to your project**:
   ```bash
   # Get project ref from Supabase dashboard URL
   # Get access token from: https://app.supabase.com/account/tokens
   supabase link --project-ref your-project-ref
   ```

3. **Run migrations**:
   ```bash
   supabase db push
   ```

4. **Set up authentication**:
   - Enable Email provider in Supabase Dashboard > Authentication > Providers
   - Create users:
     ```bash
     supabase auth users create custodian@inquiry.institute --password 'secure-password'
     ```

## Migration Files

Migrations are run in order:
1. `001_initial_schema.sql` - Colleges and board_of_directors tables
2. `002_initial_data.sql` - Initial board members data
3. `003_chat_and_voting.sql` - Chat messages, issues, and votes tables
4. `004_auth_setup.sql` - Authentication helpers and views
5. `005_members.sql` - Members table and member-based access control
6. `006_auto_create_members.sql` - Auto-create member records on signup

## Schema

### colleges
- `id` (UUID, Primary Key)
- `code` (VARCHAR, Unique) - College code (e.g., 'AINS', 'ARTS')
- `name` (VARCHAR) - Full college name
- `description` (TEXT) - College description
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### board_of_directors
- `id` (UUID, Primary Key)
- `college_id` (UUID, Foreign Key to colleges) - NULL for heretic position
- `position_type` (VARCHAR) - Either 'college' or 'heretic'
- `director_name` (VARCHAR) - Name of the director
- `rationale` (TEXT) - Rationale for the director
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### members
- `id` (UUID, Primary Key)
- `email` (VARCHAR, Unique) - Member email (matches auth.users)
- `name` (VARCHAR) - Member display name
- `member_class` (VARCHAR) - 'custodian', 'member', or 'observer'
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### chat_messages
- `id` (UUID, Primary Key)
- `user_email` (VARCHAR) - Email of the sender
- `user_name` (VARCHAR) - Display name of the sender
- `member_id` (UUID, Foreign Key to members)
- `message` (TEXT) - Message content
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### issues
- `id` (UUID, Primary Key)
- `title` (VARCHAR) - Issue title
- `description` (TEXT) - Issue description
- `created_by` (VARCHAR) - Email of creator
- `status` (VARCHAR) - 'open', 'closed', or 'resolved'
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)
- `closed_at` (TIMESTAMP)

### votes
- `id` (UUID, Primary Key)
- `issue_id` (UUID, Foreign Key to issues)
- `director_name` (VARCHAR) - Name of the director voting
- `vote_type` (VARCHAR) - 'yes', 'no', or 'abstain'
- `rationale` (TEXT) - Optional rationale for the vote
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)
- Unique constraint on (issue_id, director_name)

## Row Level Security (RLS)

All tables have RLS enabled:
- **Public tables** (colleges, board_of_directors): Read-only for everyone
- **Member tables** (chat_messages, issues, votes): Only accessible to authenticated members
- **Members table**: Public read, but users can only see their own record

## Functions

- `is_member()` - Check if current user is a member
- `get_member_class()` - Get the member class of current user
- `is_custodian()` - Check if current user is the custodian
- `ensure_member_exists()` - Auto-create member record for current user
- `get_issue_vote_summary(issue_uuid)` - Get vote summary for an issue

## Environment Variables

Create a `.env` file (not committed) with:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_PROJECT_REF=your-project-ref
SUPABASE_ACCESS_TOKEN=your-access-token
```

For production, set these as GitHub Secrets.

## Local Development

To run Supabase locally:
```bash
supabase start
```

This will start local Supabase services. Get connection details with:
```bash
supabase status
```
