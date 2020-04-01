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
    menuVisible: false,

    _init: function() {
        this.createPanelMenu();
    },
    createPanelMenu: function () {
      this.ui = Ui.createStatusPanel({ iconPath: Me.path + '/assets/pm2-logo-light.svg' }, Lang.bind(this, function() {
        if (this.menuVisible) {
          this.updateProcessList();
        }
      }));

      const { container: { menu } } = this.ui;
      const all = Ui.createSubMenu('All');

      all.menu.addMenuItem(Ui.createSimpleMenuItem("Start all", Lang.bind(this, this.comandForAll.bind(this, 'start'))));
      all.menu.addMenuItem(Ui.createSimpleMenuItem("Stop all", Lang.bind(this, this.comandForAll.bind(this, 'stop'))));
      all.menu.addMenuItem(Ui.createSimpleMenuItem("Resurrect", Lang.bind(this, this.comandForAll.bind(this, 'resurrect'))));

      menu.connect('open-state-changed', Lang.bind(this, (menu, isOpen) => { this.menuVisible = isOpen }));
      menu.addMenuItem(Ui.createSeparatorMenuItem());      
      menu.addMenuItem(all);

      Main.panel.addToStatusArea('pm2ProcessManager', this.ui.container);
    },
    updateProcessList: async function () {
      const { section } = this.ui;
      try {
        section.removeAll();
        const processes = await PM2.getProcesses() || [];
        processes.forEach(process => {
          const { name, active } = PM2.getProcessInfo(process);
          section.addMenuItem(Ui.createToggleMenuItem(
            name, 
            active, 
            Lang.bind(this, this.toggleProcess.bind(this, process))
          ));
        });

        if (!processes.length) {
          const item = Ui.createSimpleMenuItem('No PM2 processes.');
          section.addMenuItem(item)
        }
      } catch (e) {
        section.addMenuItem(Ui.createSimpleMenuItem('Error getting data from PM2. See gnome-shell logs.'))
        Lib.log(`Error reading PM2 processes:`);
        Lib.log(e);
      }
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
          resurrect: PM2.resurrect
        }
        await actions[cmd]();
      } catch (e) {
        Lib.log(`Error ${cmd} all PM2 processes:`);
        Lib.log(e);
      }
    },
    destroy: function () {
      this.ui.container.destroy();
    }
});

var processManager;
function enable() {
    processManager = new PM2ProcessManager();
}

function disable() {
  processManager.destroy();
}
