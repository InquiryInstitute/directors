#!/bin/bash
set -e

# Script to set up DNS for directors.inquiry.institute using AWS Route53
# Requires AWS CLI and appropriate credentials

command -v aws >/dev/null 2>&1 || { echo "❌ AWS CLI not found. Install with: brew install awscli"; exit 1; }

DOMAIN="directors.inquiry.institute"
PARENT_DOMAIN="inquiry.institute"

echo "🌐 Setting up DNS for $DOMAIN..."

# Get GitHub Pages IP addresses (these are static)
GITHUB_PAGES_IPS=(
  "185.199.108.153"
  "185.199.109.153"
  "185.199.110.153"
  "185.199.111.153"
)

# Find the hosted zone for the parent domain
echo "🔍 Finding hosted zone for $PARENT_DOMAIN..."
ZONE_ID=$(aws route53 list-hosted-zones --query "HostedZones[?Name=='${PARENT_DOMAIN}.'].[Id]" --output text | cut -d'/' -f3)

if [ -z "$ZONE_ID" ]; then
  echo "❌ Could not find hosted zone for $PARENT_DOMAIN"
  echo "Please create the hosted zone first or check your AWS credentials"
  exit 1
fi

echo "✅ Found hosted zone: $ZONE_ID"

# Create CNAME record for GitHub Pages
echo "📝 Creating CNAME record..."
CHANGE_BATCH=$(cat <<EOF
{
  "Changes": [{
    "Action": "UPSERT",
    "ResourceRecordSet": {
      "Name": "$DOMAIN",
      "Type": "CNAME",
      "TTL": 300,
      "ResourceRecords": [{"Value": "inquiryinstitute.github.io"}]
    }
  }]
}
EOF
)

aws route53 change-resource-record-sets \
  --hosted-zone-id "$ZONE_ID" \
  --change-batch "$CHANGE_BATCH"

echo "✅ DNS record created!"
echo ""
echo "Note: DNS propagation may take a few minutes to several hours."
echo "You can check status with: aws route53 get-change --id <change-id>"
