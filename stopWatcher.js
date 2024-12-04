// stopWatcher.js
const fs = require('fs');
const path = require('path');

const pidFile = path.join(__dirname, 'watcher.pid');

if (fs.existsSync(pidFile)) {
  const pid = parseInt(fs.readFileSync(pidFile, 'utf8'), 10);

  try {
    process.kill(pid, 'SIGINT'); // Send interrupt signal
    console.log(`Watcher process (PID: ${pid}) has been stopped.`);
    fs.unlinkSync(pidFile); // Remove the PID file
  } catch (err) {
    console.error(`Failed to stop watcher process (PID: ${pid}): ${err.message}`);
    // If the process doesn't exist, remove the PID file
    if (err.code === 'ESRCH') {
      fs.unlinkSync(pidFile);
    }
  }
} else {
  console.log('No watcher process is running.');
}
