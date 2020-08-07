const Me = imports.misc.extensionUtils.getCurrentExtension();
const Lib = Me.imports.lib.util;

function makePM2Command(cmd, options) {
  const defaults = {
    pm2Path: 'pm2',
  };

  const args = Object.assign(defaults, {...options, cmd });
  return `${args.pm2Path} ${args.cmd}`;
}

async function getProcesses(options) {
  const cmd = makePM2Command('jlist', options);
  const { out: pm2ListJson } = await Lib.runCmdAsync(cmd);
  return JSON.parse(pm2ListJson);
}

function getProcessInfo(process) {
  return {
    name: process.name,
    active: process.pm2_env.status === 'online',
    id: process.pm_id
  };
}

function runProcessCommand(process, cmd, options) {
  const { id } = getProcessInfo(process);
  const shellCmd = makePM2Command(`${cmd} ${id}`, options);
  return Lib.runCmdAsync(shellCmd);
}

function startProcess(process, options) {
  return runProcessCommand(process, 'start', options);
}

function stopProcess(process, options) {
  return runProcessCommand(process, 'stop', options);
}

function runPM2Command(cmd, options) {
  const shellCmd = makePM2Command(cmd, options);
  return Lib.runCmdAsync(shellCmd);
}

var startAll = runPM2Command.bind(null, 'start all');
var stopAll = runPM2Command.bind(null, 'stop all');
var resurrect = runPM2Command.bind(null, 'resurrect');
var save = runPM2Command.bind(null, 'save');

/* 
  exported makePM2Command 
  exported getProcessInfo 
  exported runProcessCommand 
  exported startProcess 
  exported stopProcess 
  exported runPM2Command 
  exported getProcesses 
  exported startAll 
  exported stopAll 
  exported resurrect 
  exported save 
*/