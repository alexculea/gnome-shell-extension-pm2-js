// TODO: Refactor with ES6 class instead of Lang
// TODO: Plan what to do about that JSON.parse in PM2 lib (it's sync and seems to be getting big inputs)
const Lang = imports.lang;
const Main = imports.ui.main;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const Lib = Me.imports.lib.util;
const Ui = Me.imports.lib.ui;
const PM2 = Me.imports.lib.pm2;

const PM2ProcessManager = new Lang.Class({
  Name: 'PM2ProcessManager',
  ui: {},

  // promise holding the initial process retrieval call from pm2
  // gets set to null when no execution is in progress
  initCmdPromise: null, 

  processes: [],

  _init: function() {
    this.createPanelMenu();
  },
  createPanelMenu: function () {
    this.ui = Ui.createStatusPanel({ iconPath: Me.path + '/assets/pm2-logo-light.svg' }, Lang.bind(this, function() {
      this.updateProcessList();
      return true;
    }));

    const { container: { menu }, section } = this.ui;
    section.addMenuItem(Ui.createSimpleMenuItem('Loading...'));
    menu.addMenuItem(Ui.createSeparatorMenuItem());
      
    const all = Ui.createSubMenu('All');
    const allMenuEntries = [
      { label: 'Start all', cb: this.comandForAll.bind(this, 'start') },
      { label: 'Stop all', cb: this.comandForAll.bind(this, 'stop') },
      { label: 'Resurrect', cb: this.comandForAll.bind(this, 'resurrect') },
      { label: 'Save', cb: this.comandForAll.bind(this, 'save') },
    ];

    allMenuEntries.forEach(item => all.menu.addMenuItem(
      Ui.createSimpleMenuItem(item.label, Lang.bind(this, item.cb))
    ));
      
    menu.addMenuItem(all);

    Main.panel.addToStatusArea('pm2ProcessManager', this.ui.container);
  },
  updateProcessList: async function () {
    const { section } = this.ui;
    try {
      const processes = await (this.initCmdPromise ? this.initCmdPromise : PM2.getProcesses());
      this.initCmdPromise = null;
      section.removeAll();
      processes.forEach(process => {
        const { name, active } = PM2.getProcessInfo(process);
        section.addMenuItem(Ui.createToggleMenuItem(
          name, 
          active, 
          Lang.bind(this, this.toggleProcess.bind(this, process))
        ));
      });

      if (!processes.length) {
        const item = Ui.createSimpleMenuItem('No PM2 processes. If you previously saved, resurrect your PM2.');
        section.addMenuItem(item);
      }

    } catch (e) {
      section.addMenuItem(Ui.createSimpleMenuItem('Error getting data from PM2. See gnome-shell logs.'));
      Lib.log('Error reading PM2 processes:');
      Lib.log(e);
    }
    return true;
  },
  toggleProcess: async function (process, menuItem, toggled) {
    try {
      if (toggled) {
        await PM2.startProcess(process);
      } else {
        await PM2.stopProcess(process);
      }
      menuItem.setToggleState(!toggled);
    } catch (e) {
      Lib.log(`Error ${toggled ? 'stopping' : 'starting'} PM2 processes:`);
      Lib.log(e);
    }
  },
  comandForAll: async function (cmd) {
    try {
      const actions = {
        start: PM2.startAll,
        stop: PM2.stopAll,
        resurrect: PM2.resurrect,
        save: PM2.save,
      };
      await actions[cmd]();
    } catch (e) {
      Lib.log(`Error running ${cmd} for all PM2 processes:`);
      Lib.log(e);
    }
  },
  destroy: function () {
    this.ui.container.destroy();
  }
});

/* exported enable */
var processManager;
function enable() {
  processManager = new PM2ProcessManager();
}

/* exported disable */
function disable() {
  processManager.destroy();
}
