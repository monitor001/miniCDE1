const { execSync } = require('child_process');
const fs = require('fs');

const DOCKER_COMPOSE_FILE = 'docker-compose.dev.yml';

function runCommand(command, description) {
  console.log(`\n🔄 ${description}...`);
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: 'inherit' });
    console.log(`✅ ${description} completed successfully`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    return false;
  }
}

function showStatus() {
  console.log('\n📊 Docker Environment Status:');
  try {
    const output = execSync(`docker-compose -f ${DOCKER_COMPOSE_FILE} ps`, { encoding: 'utf8' });
    console.log(output);
  } catch (error) {
    console.error('❌ Failed to get status:', error.message);
  }
}

function showLogs(service = null) {
  console.log('\n📋 Docker Logs:');
  try {
    const command = service 
      ? `docker-compose -f ${DOCKER_COMPOSE_FILE} logs ${service} --tail=20`
      : `docker-compose -f ${DOCKER_COMPOSE_FILE} logs --tail=10`;
    const output = execSync(command, { encoding: 'utf8' });
    console.log(output);
  } catch (error) {
    console.error('❌ Failed to get logs:', error.message);
  }
}

function main() {
  const command = process.argv[2];
  const service = process.argv[3];

  console.log('🐳 MiniCDE Docker Environment Manager\n');

  switch (command) {
    case 'start':
      runCommand(`docker-compose -f ${DOCKER_COMPOSE_FILE} up -d`, 'Starting Docker environment');
      showStatus();
      break;

    case 'stop':
      runCommand(`docker-compose -f ${DOCKER_COMPOSE_FILE} down`, 'Stopping Docker environment');
      break;

    case 'restart':
      runCommand(`docker-compose -f ${DOCKER_COMPOSE_FILE} down`, 'Stopping Docker environment');
      runCommand(`docker-compose -f ${DOCKER_COMPOSE_FILE} up -d`, 'Starting Docker environment');
      showStatus();
      break;

    case 'build':
      runCommand(`docker-compose -f ${DOCKER_COMPOSE_FILE} build --no-cache`, 'Building Docker images');
      break;

    case 'rebuild':
      runCommand(`docker-compose -f ${DOCKER_COMPOSE_FILE} down`, 'Stopping Docker environment');
      runCommand(`docker-compose -f ${DOCKER_COMPOSE_FILE} build --no-cache`, 'Building Docker images');
      runCommand(`docker-compose -f ${DOCKER_COMPOSE_FILE} up -d`, 'Starting Docker environment');
      showStatus();
      break;

    case 'status':
      showStatus();
      break;

    case 'logs':
      showLogs(service);
      break;

    case 'test':
      console.log('🧪 Running system tests...');
      if (fs.existsSync('./test-docker-local.js')) {
        runCommand('node test-docker-local.js', 'Running system tests');
      } else {
        console.log('❌ Test file not found: test-docker-local.js');
      }
      break;

    case 'clean':
      console.log('🧹 Cleaning up Docker environment...');
      runCommand(`docker-compose -f ${DOCKER_COMPOSE_FILE} down -v`, 'Removing containers and volumes');
      runCommand('docker system prune -f', 'Cleaning up Docker system');
      break;

    case 'help':
    default:
      console.log('📖 Available commands:');
      console.log('  start     - Start the Docker environment');
      console.log('  stop      - Stop the Docker environment');
      console.log('  restart   - Restart the Docker environment');
      console.log('  build     - Build Docker images');
      console.log('  rebuild   - Rebuild and restart everything');
      console.log('  status    - Show container status');
      console.log('  logs      - Show logs (optionally specify service)');
      console.log('  test      - Run system tests');
      console.log('  clean     - Clean up Docker environment');
      console.log('  help      - Show this help message');
      console.log('\n📋 Services:');
      console.log('  postgres  - PostgreSQL database');
      console.log('  redis     - Redis cache');
      console.log('  backend   - Backend API');
      console.log('  frontend  - Frontend application');
      console.log('\n💡 Examples:');
      console.log('  node docker-manager.js start');
      console.log('  node docker-manager.js logs backend');
      console.log('  node docker-manager.js test');
      break;
  }
}

main(); 