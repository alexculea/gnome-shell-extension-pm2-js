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
        Lib.log('Click received');
        if (this.menuVisible) {
          Lib.log('opening menu');
          this.ui.container.menu.open();
          this.updateProcessList();
        }
        return true;
      }));

      const { container: { menu }, section } = this.ui;
      section.addMenuItem(Ui.createSimpleMenuItem("Loading..."));
      menu.addMenuItem(Ui.createSeparatorMenuItem());
      
      const all = Ui.createSubMenu('All');
      all.menu.addMenuItem(Ui.createSimpleMenuItem("Start all", Lang.bind(this, this.comandForAll.bind(this, 'start'))));
      all.menu.addMenuItem(Ui.createSimpleMenuItem("Stop all", Lang.bind(this, this.comandForAll.bind(this, 'stop'))));
      all.menu.addMenuItem(Ui.createSimpleMenuItem("Resurrect", Lang.bind(this, this.comandForAll.bind(this, 'resurrect'))));
      all.menu.addMenuItem(Ui.createSimpleMenuItem("Save", Lang.bind(this, this.comandForAll.bind(this, 'save'))));
      menu.connect('open-state-changed', Lang.bind(this, (menu, isOpen) => this.menuVisible = isOpen ));
      menu.addMenuItem(all);

      Main.panel.addToStatusArea('pm2ProcessManager', this.ui.container);
    },
    updateProcessList: function () {
      const { section } = this.ui;
      Lib.log('Populating processes.');
      try {
        PM2.getProcesses().then(processes => {
          section.removeAll();
          Lib.log('Retrieved processes.');
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

          Lib.log('Done adding UI processes.');
        });
      } catch (e) {
        section.addMenuItem(Ui.createSimpleMenuItem('Error getting data from PM2. See gnome-shell logs.'))
        Lib.log(`Error reading PM2 processes:`);
        Lib.log(e);
      }
      Lib.log('Returned from click signal');
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
