const GLib = imports.gi.GLib;

function runCmd(command) {
  return new Promise((accept, reject) => {
    const [res, out, err, status] = GLib.spawn_command_line_sync(command);
    const strOutput = Uint8ToString(out);
    const output = { command, res, out: strOutput, err, status };
    return status == 0 ? accept(output) : reject(output)
  });
}

function Uint8ToString(u8a){
  var CHUNK_SZ = 0x8000;
  var c = [];
  for (var i=0; i < u8a.length; i+=CHUNK_SZ) {
    c.push(String.fromCharCode.apply(null, u8a.subarray(i, i+CHUNK_SZ)));
  }
  return c.join("");
}

function log(input) { 
  const prefix = 'PM2 Process Manager Extension';
  const output = String(input) === '[object Object]' 
    ? JSON.stringify(input, null, 2)
    : input;

  global.log(`${prefix}: ${output}`);
}

function State() {
  var _state = {};
  return (key, value) => {
    if (value) {
      _state = Object.assign(_state, { [key]: value })
    }

    return _state[key];
  }
}


