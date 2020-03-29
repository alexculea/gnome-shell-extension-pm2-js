// TODO: Refactor with ES6 class instead of Lang
// TODO: Investigate and possibly remove menu.open() in show()
// TODO: Update README.md for publishing
// TODO: Plan what to do about that JSON.parse in PM2 lib (it's sync and seems to be getting big inputs)
// TODO: Plan Roadmap for 1.1 with
// - don't close menu as soon as toggle is clicked, instead change toggle after command completed and then close the menu
// - fix clicking the button while the menu is visible makes the menu recreate
// 1.2:
// - add show logs button for each entry, open the user default terminal instead of hardcoding
// - convert shell command running to async (maybe even include it in 1.0?)
// - show loading indicator if startup takes more than 0.5s
const Lang = imports.lang;
const Main = imports.ui.main;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const Lib = Me.imports.lib.util;
const Ui = Me.imports.lib.ui;
const PM2 = Me.imports.lib.pm2;

const PM2ProcessManager = new Lang.Class({
    Name: 'PM2ProcessManager',
    ui: {},

    _init: function() {
        this.createPanelMenu();
    },
    createPanelMenu: function() {
      this.ui = Ui.createStatusPanel({ iconPath: Me.path + '/assets/pm2-logo-light.svg' }, Lang.bind(this, function() {
        this.show();
      }));

      Main.panel.addToStatusArea('pm2ProcessManager', this.ui.container);
    },
    show: async function() {
      const { container } = this.ui;
      const { menu } = container;
      try {
        menu.removeAll();
        const processes = await PM2.getProcesses() || [];
        for (const process of processes) {
          const { name, active } = PM2.getProcessInfo(process);
          menu.addMenuItem(
            Ui.createToggleMenuItem(
              name, 
              active, 
              Lang.bind(this, this.toggleProcess.bind(this, process))
            )
          );
        }

        if (!processes.length) {
          menu.addMenuItem(Ui.createSimpleMenuItem('No PM2 processes.'))  
        }

        menu.addMenuItem(Ui.createSeparatorMenuItem());

        const all = Ui.createSubMenu('All');
        all.menu.addMenuItem(Ui.createSimpleMenuItem("Start all", Lang.bind(this, this.comandForAll.bind(this, 'start'))));
        all.menu.addMenuItem(Ui.createSimpleMenuItem("Stop all", Lang.bind(this, this.comandForAll.bind(this, 'stop'))));
        all.menu.addMenuItem(Ui.createSimpleMenuItem("Resurrect", Lang.bind(this, this.comandForAll.bind(this, 'resurrect'))));
        menu.addMenuItem(all);
        menu.open();
        return true;
      } catch (e) {
        menu.addMenuItem(Ui.createSimpleMenuItem('Error getting data from PM2. See gnome-shell logs.'))
        Lib.log(`Error reading PM2 processes:`);
        Lib.log(e);
      }
    },
    toggleProcess: async function(process, menuItem, toggled) {
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
    comandForAll: async function(cmd) {
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
    destroy: function() {
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
