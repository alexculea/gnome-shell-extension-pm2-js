const GLib  = imports.gi.GLib;
const Gio   = imports.gi.Gio;
const Shell = imports.gi.Shell;

function runCmd(cmd) {
  return new Promise((accept, reject) => {
    const [res, out, err, status] = GLib.spawn_command_line_sync(cmd);
    const output = { cmd, res, out: Uint8ToString(out), err: Uint8ToString(err), status };
    return status == 0 ? accept(output) : reject(output)
  });
}

function runCmdAsync(cmd, workingDir) {
  return new Promise((accept, reject) => {    
    try {
      let result = {};
      let stdOutAccept;
      let stdErrAccept;
      const argv = cmd.split(' ');
      const stdoutFinished = new Promise((sAcc) => { stdOutAccept = sAcc; });
      const stderrFinished = new Promise((eAcc) => { stdErrAccept = eAcc; });

      const onRead = function(out, cb, stream, asyncRes) {
        try {
          const [o, prop] = out;
          const [buff] = stream.read_line_finish(asyncRes);
          if (buff) {
            const output = Uint8ToString(buff);
            o[prop] = o[prop].concat(output);
            stream.read_line_async(GLib.PRIORITY_DEFAULT, null, onRead.bind(null, out, cb));
          } else {
            cb();
          }
        } catch (e) {
          reject(e);
        }
      };

      const [res, pid, stdin, stdout, stderr] = GLib.spawn_async_with_pipes(
        workingDir || './', 
        argv, 
        null, 
        GLib.SpawnFlags.SEARCH_PATH | GLib.SpawnFlags.DO_NOT_REAP_CHILD, 
        null
      );
      
      if (!res) { 
        reject(new Error('Failed to run cmd, spawn_async_with_pipes returned false'));
      }

      result = { cmd, status: 0, pid, out: '', err: '' };

      const stdOutStream = new Gio.DataInputStream({ base_stream : new Gio.UnixInputStream({ fd : stdout }) });
      const stdErrStream = new Gio.DataInputStream({ base_stream : new Gio.UnixInputStream({ fd : stderr }) });
      stdOutStream.read_line_async(GLib.PRIORITY_DEFAULT, null, onRead.bind(null, [result, 'out'], stdOutAccept));
      stdErrStream.read_line_async(GLib.PRIORITY_DEFAULT, null, onRead.bind(null, [result, 'err'], stdErrAccept));

      let childWatch = GLib.child_watch_add(GLib.PRIORITY_DEFAULT, pid, (pid, sts, reqObject) => {
        const [exitedCorrectly, status] = Shell.util_wifexited(sts);
        result = {...result, status };
        if (!exitedCorrectly) {
          result.status = 1;
        }

        try { GLib.spawn_close_pid(result.pid); } catch (e) { reject(e) }
        childWatch = 0;
      });

      Promise.all([stdoutFinished, stderrFinished])
        .then(() => result.status > 0 ? reject(result) : accept(result))
        .catch(() => reject(e));
    } catch (e) {
      reject(e);
    }
  })
}

function Uint8ToString(u8a){
  let ByteArray;
  try {
    ByteArray = imports.byteArray;
  } catch (e) {}
  return ByteArray && ByteArray.toString(u8a) || u8a.toString();
}

function log(input) { 
  try {
    const prefix = 'PM2 Process Manager Extension';
    const isObject = String(input) === '[object Object]';
    const isShellCmd = isObject && input.cmd;
    let output = 
      isShellCmd && `command "${input.cmd}" exit code ${input.status}\noutput:\n${input.out}${input.err}` ||
      isObject && JSON.stringify(input, null, 2) ||
      String(input);

    global.log(`${prefix}: ${output}`);
  } catch (e) {
    global.log('Exception while logging output:\n');
    global.log(e);
  }
}


