#!/bin/bash

# AlignedWithWhat Database Management Script

set -e

COMPOSE_FILE="docker-compose.yml"

function usage() {
    echo "Usage: $0 {start|stop|restart|status|logs|reset|psql|api|test|test-db|migrate}"
    echo ""
    echo "Commands:"
    echo "  start    - Start all services"
    echo "  stop     - Stop all services"
    echo "  restart  - Restart all services"
    echo "  status   - Show service status"
    echo "  logs     - Show logs for all services"
    echo "  reset    - Reset database (WARNING: deletes all data)"
    echo "  psql     - Connect to PostgreSQL database"
    echo "  api      - Open API documentation in browser"
    echo "  test     - Run tests with isolated test database"
    echo "  test-db  - Start only test database (for manual testing)"
    echo "  migrate  - Run database migrations"
    exit 1
}

function start_services() {
    echo "Starting AlignedWithWhat database services..."
    docker compose up -d
    echo ""
    echo "Services started! Access points:"
    echo "  PostgreSQL: localhost:5432"
    echo "  FastAPI: http://localhost:8000"
    echo "  pgAdmin: http://localhost:5050"
    echo ""
    echo "Run '$0 logs' to monitor the startup process"
    echo "Run '$0 api' to open the API documentation"
}

function stop_services() {
    echo "Stopping AlignedWithWhat database services..."
    docker compose down
}

function restart_services() {
    echo "Restarting AlignedWithWhat database services..."
    docker compose restart
}

function show_status() {
    echo "Service Status:"
    docker compose ps
}

function show_logs() {
    if [ "$2" ]; then
        echo "Showing logs for service: $2"
        docker compose logs -f "$2"
    else
        echo "Showing logs for all services (press Ctrl+C to exit):"
        docker compose logs -f
    fi
}

function reset_database() {
    read -p "WARNING: This will delete all data in the database. Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Resetting database..."
        docker compose down -v
        docker compose up -d
        echo "Database reset complete. Data will be re-ingested automatically."
    else
        echo "Reset cancelled."
    fi
}

function connect_psql() {
    echo "Connecting to PostgreSQL database..."
    docker exec -it alignedwithwhat_postgres psql -U postgres -d alignedwithwhat
}

function open_api() {
    echo "Opening API documentation..."
    if command -v xdg-open &> /dev/null; then
        xdg-open http://localhost:8000
    elif command -v open &> /dev/null; then
        open http://localhost:8000
    else
        echo "Please open http://localhost:8000 in your browser"
    fi
}

function run_tests() {
    echo "Starting test database and running tests..."
    
    # Start test database if not running
    docker compose -f docker-compose.test.yml up -d postgres_test
    
    # Wait for test database to be ready
    echo "Waiting for test database to be ready..."
    sleep 5
    
    # Run tests
    if [ "$2" ]; then
        echo "Running specific test: $2"
        docker compose -f docker-compose.test.yml run --rm test_runner pytest "$2" "${@:3}"
    else
        echo "Running all tests..."
        docker compose -f docker-compose.test.yml run --rm test_runner
    fi
    
    # Stop test containers
    docker compose -f docker-compose.test.yml down
}

function run_migrations() {
    echo "Running database migrations..."
    docker exec alignedwithwhat_api ./migrate.sh upgrade prod
}

function start_test_db() {
    echo "Starting test database for manual testing..."
    docker compose -f docker-compose.test.yml up -d postgres_test
    echo ""
    echo "Test database started!"
    echo "  Test PostgreSQL: localhost:5433"
    echo "  Database: alignedwithwhat_test"
    echo "  Username: postgres"
    echo "  Password: postgres123"
    echo ""
    echo "Run '$0 test' to run the full test suite"
    echo "Run 'docker compose -f docker-compose.test.yml down' to stop test services"
}

# Check if docker compose is available
if ! command -v docker &> /dev/null; then
    echo "Error: docker is not installed or not in PATH"
    exit 1
fi

# Check if compose file exists
if [ ! -f "$COMPOSE_FILE" ]; then
    echo "Error: $COMPOSE_FILE not found"
    exit 1
fi

# Parse command line arguments
case "${1:-}" in
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs "$@"
        ;;
    reset)
        reset_database
        ;;
    psql)
        connect_psql
        ;;
    api)
        open_api
        ;;
    test)
        run_tests "$@"
        ;;
    test-db)
        start_test_db
        ;;
    migrate)
        run_migrations
        ;;
    *)
        usage
        ;;
esac
