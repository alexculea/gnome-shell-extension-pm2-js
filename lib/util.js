const GLib  = imports.gi.GLib;
const Gio   = imports.gi.Gio;

function runCmd(cmd) {
  return new Promise((accept, reject) => {
    const [res, out, err, status] = GLib.spawn_command_line_sync(cmd);
    const output = { cmd, res, out: Uint8ToString(out), err: Uint8ToString(err), status };
    return status == 0 ? accept(output) : reject(output);
  });
}

function runCmdAsync(cmd) {
  return new Promise((acceptCmd, rejectCmd) => {    
    try {
      // TODO: command output could be simplified by combining 
      // stderr with std out as seen here:
      // https://lazka.github.io/pgi-docs/Gio-2.0/flags.html#Gio.SubprocessFlags.STDERR_MERGE
      // using flag STDERR_MERGE
      let result = { cmd, status: 1, pid: null, out: '', err: '' };
      
      // share promises accept callbacks with the context
      // they will be called from the callbacks that interact with the GIO
      let stdOutAccept;
      let stdErrAccept;
      let processExitedAccept;
      let processExitedReject;
      const stdoutFinished = new Promise(acceptCb => { stdOutAccept = acceptCb; });
      const stderrFinished = new Promise(acceptCb => { stdErrAccept = acceptCb; });
      const processExited = new Promise((acceptCb, rejectCb) => { processExitedAccept = acceptCb; processExitedReject = rejectCb;  });

      const onRead = function(out, cb, stream, asyncRes) {
        try {
          const [o, prop] = out;
          const [buff] = stream.read_line_finish(asyncRes);
          if (buff) {
            // TODO: Can be simplified by using the steam UTF8 read line api as seen in
            // accepted answer from 
            // https://stackoverflow.com/questions/59939821/running-an-asynchronous-function-in-a-gnome-extension
            const output = Uint8ToString(buff);
            o[prop] = o[prop].concat(output);
            stream.read_line_async(GLib.PRIORITY_DEFAULT, null, onRead.bind(null, out, cb));
          } else {
            cb();
          }
        } catch (e) {
          rejectCmd(e);
        }
      };

      const onExit = (proc, gAsyncResult) => {
        try {
          proc.wait_check_finish(gAsyncResult);
          if (!process.get_if_exited()) return;
          result.status = process.get_exit_status();
          result.status === 0 ? acceptCmd(result) : rejectCmd(result);
          processExitedAccept();
        } catch (e) {
          processExitedReject(new Error('An error was received in the exit handler for running external commands.'));
        }
      };

      const process = new Gio.Subprocess({
        argv: cmd.split(' '),
        flags: 
          Gio.SubprocessFlags.STDOUT_PIPE | 
          Gio.SubprocessFlags.STDERR_PIPE,
      });

      process.init(null);
      result.pid = process.get_identifier();

      if (!process) { 
        rejectCmd(new Error('Failed to run cmd, Gio.Subprocess returned a falsy process'));
      }

      const stdout = new Gio.DataInputStream({ base_stream: process.get_stdout_pipe() });
      const stderr = new Gio.DataInputStream({ base_stream: process.get_stderr_pipe() });
      stdout.read_line_async(GLib.PRIORITY_DEFAULT, null, onRead.bind(null, [result, 'out'], stdOutAccept));
      stderr.read_line_async(GLib.PRIORITY_DEFAULT, null, onRead.bind(null, [result, 'err'], stdErrAccept));
      process.wait_check_async(null, onExit);

      Promise.all([processExited, stdoutFinished, stderrFinished])
        .then(() => result.status > 0 ? rejectCmd(result) : acceptCmd(result))
        .catch((e) => rejectCmd(e));
    } catch (e) {
      rejectCmd(e);
    }
  });
}

function Uint8ToString(u8a){
  let ByteArray;
  try {
    ByteArray = imports.byteArray;
  } catch (e) { /**/ }
  return ByteArray && ByteArray.toString(u8a) || u8a.toString();
}

var g_lastTime = new Date().getTime();

function log(input) {
  const msecPassedSinceLastLog = Date.now() - g_lastTime;
  g_lastTime = Date.now();
  const prefix = `PM2 Process Manager Extension (+${msecPassedSinceLastLog} msec)`;

  try {
    const isObject = String(input) === '[object Object]';
    const isShellCmd = isObject && input.cmd;
    let output = 
      isShellCmd && `command "${input.cmd}" exit code ${input.status}\noutput:\n${input.out}${input.err}` ||
      isObject && JSON.stringify(input, null, 2) ||
      String(input);

    global.log(`${prefix}: ${output}\n`);
  } catch (e) {
    global.log(`${prefix}: Exception while logging output:\n`);
    global.log(e);
  }
}

/* 
  exported runCmd
  exported runCmdAsync
  exported log
*/
