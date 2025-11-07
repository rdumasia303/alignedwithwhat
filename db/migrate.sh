#!/bin/bash

# Alembic Migration Management Script
# Handles migrations for different environments

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

function usage() {
    echo "Usage: $0 {init|migrate|upgrade|downgrade|current|history|revision} [environment] [options]"
    echo ""
    echo "Commands:"
    echo "  init      - Initialize Alembic (first time setup)"
    echo "  migrate   - Create new migration (same as revision --autogenerate)"
    echo "  upgrade   - Upgrade to head or specific revision"
    echo "  downgrade - Downgrade to specific revision"
    echo "  current   - Show current revision"
    echo "  history   - Show migration history"
    echo "  revision  - Create new revision (manual)"
    echo ""
    echo "Environments:"
    echo "  prod      - Production database (default)"
    echo "  test      - Test database"
    echo "  local     - Local development database"
    echo ""
    echo "Examples:"
    echo "  $0 upgrade prod          # Upgrade production to head"
    echo "  $0 migrate test          # Create migration for test DB"
    echo "  $0 current local         # Show current revision in local DB"
    echo "  $0 revision 'Add new field' # Create manual revision"
    exit 1
}

# Determine environment and config file
ENVIRONMENT=${2:-prod}
case $ENVIRONMENT in
    prod|production)
        CONFIG_FILE="alembic.prod.ini"
        echo "🏭 Using production configuration"
        ;;
    test)
        CONFIG_FILE="alembic.test.ini" 
        echo "🧪 Using test configuration"
        ;;
    local|dev|development)
        CONFIG_FILE="alembic.ini"
        echo "💻 Using local development configuration"
        ;;
    *)
        echo "❌ Unknown environment: $ENVIRONMENT"
        echo "Valid environments: prod, test, local"
        exit 1
        ;;
esac

# Check if config file exists
if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ Configuration file not found: $CONFIG_FILE"
    exit 1
fi

COMMAND=$1
case $COMMAND in
    init)
        echo "🏗️  Initializing Alembic..."
        alembic -c "$CONFIG_FILE" init alembic
        ;;
    migrate)
        MESSAGE=${3:-"Auto-generated migration"}
        echo "📝 Creating new migration: $MESSAGE"
        alembic -c "$CONFIG_FILE" revision --autogenerate -m "$MESSAGE"
        ;;
    upgrade)
        REVISION=${3:-head}
        echo "⬆️  Upgrading database to: $REVISION"
        alembic -c "$CONFIG_FILE" upgrade "$REVISION"
        ;;
    downgrade)
        if [ -z "$3" ]; then
            echo "❌ Downgrade requires a revision"
            echo "Usage: $0 downgrade $ENVIRONMENT <revision>"
            exit 1
        fi
        REVISION=$3
        echo "⬇️  Downgrading database to: $REVISION"
        alembic -c "$CONFIG_FILE" downgrade "$REVISION"
        ;;
    current)
        echo "📍 Current database revision:"
        alembic -c "$CONFIG_FILE" current
        ;;
    history)
        echo "📚 Migration history:"
        alembic -c "$CONFIG_FILE" history
        ;;
    revision)
        if [ -z "$3" ]; then
            echo "❌ Revision requires a message"
            echo "Usage: $0 revision $ENVIRONMENT '<message>'"
            exit 1
        fi
        MESSAGE=$3
        echo "📝 Creating manual revision: $MESSAGE"
        alembic -c "$CONFIG_FILE" revision -m "$MESSAGE"
        ;;
    *)
        echo "❌ Unknown command: $COMMAND"
        usage
        ;;
esac

echo "✅ Operation completed successfully"
