// TODO: Plan what to do about that JSON.parse in PM2 lib (it's sync and seems to be getting big inputs)
// TODO: Convert initCmdPromise to a be only a promise and not null
const Lang = imports.lang;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;

const GObject = imports.gi.GObject;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const Lib = Me.imports.lib.util;
const Ui = Me.imports.lib.ui;
const PM2 = Me.imports.lib.pm2;

const STATUS_AREA_ROLE = 'pm2-manager';

var PM2ProcessManager = GObject.registerClass(
  class SystemMenu extends PanelMenu.Button {
    _init() {
      try {
        super._init(0, _('PM2 Process Manager'));

        this.Name = 'PM2ProcessManager';
        this.ui = {};
        PM2.checkInstall()
          .then((result => this.installState = result).bind(this));
    
        // promise holding the initial process retrieval call from pm2
        // gets set to null when no execution is in progress
        this.initCmdPromise = null;
    
        this.processes = [];

        // creates icon button that will stay on the system status panel
        this.ui = Ui.createStatusPanel(
          this,
          { iconFile: `${Me.path}/assets/pm2-logo-symbolic.svg` }, 
          Lang.bind(this, function() {
            this.updateProcessList();
            return true;
          })
        );

        // prepare extension menu UI sections and default items
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
      } catch (e) {
        Lib.log(e);
      }
    }

    async updateProcessList() {
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
        section.removeAll();
        if (this.installState.status === 'error') {
          const installMessages = {
            node: 'Can\'t check NodeJS version. Check that you have installed NodeJS and is available to the $PATH of your GNOME session.',
            pm2: 'Can\'t check PM2 version. Make sure the \'pm2\' command is available to your GNOME session.'
          };
          const message = installMessages[this.installState.type] + '\nSee the Troubleshooting section of the project README.md for more info.';
          section.addMenuItem(Ui.createSimpleMenuItem(message));
        }

        section.addMenuItem(Ui.createSimpleMenuItem('Error getting data from PM2.\nSee gnome-shell logs for more details.'));
        Lib.log('Error reading PM2 processes:');
        Lib.log(e);
      }
      return true;
    }
  
    async toggleProcess(process, menuItem, toggled) {
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
    }

    async comandForAll(cmd) {
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
    }

    destroy() {
      this.ui.container.destroy();
    }
  });


var processManagerIndicator;

/* exported enable */
function enable() {
  processManagerIndicator = new PM2ProcessManager;
  
  // add extension button to the system status panel
  Main.panel.addToStatusArea(STATUS_AREA_ROLE, processManagerIndicator);
}

/* exported disable */
function disable() {
  processManagerIndicator.destroy();
}
