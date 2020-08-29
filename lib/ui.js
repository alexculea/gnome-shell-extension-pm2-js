const PopupMenu = imports.ui.popupMenu;
const St = imports.gi.St;
const Gio = imports.gi.Gio;
const Me = imports.misc.extensionUtils.getCurrentExtension();

/*
 * To avoid the menu items automatically closing the top menu,
 * inherit PopupMenuBase and override itemActivated() member method.
 */

function createStatusPanel(container, options, clickCallBack) {
  const defaults = {
    boxLayout: {
      style_class: 'panel-status-menu-box'
    },
    icon: {
      style_class: 'system-status-icon',
      iconSize: '24',
    },
    iconFile: Me.path + '/assets/pm2-logo-light.svg',
    actor: {
      style_class: 'panel-status-button'
    }
  };

  const parameters = Object.assign(defaults, options);
  const gicon = Gio.icon_new_for_string(parameters.iconFile);

  const section = createMenuSection();
  const hbox = new St.BoxLayout({ ...parameters.boxLayout });
  const icon = new St.Icon({ gicon, ...parameters.icon });
  hbox.add_child(icon);
  container.actor.add_actor(hbox);
  container.actor.add_style_class_name(parameters.actor.style_class);
  container.menu.addMenuItem(section);
  container.actor.connect('button-press-event', clickCallBack);
  return { container, hbox, section };
}

function createSeparatorMenuItem() {
  return new PopupMenu.PopupSeparatorMenuItem();
}

function createSimpleMenuItem(text, onClick) {
  const item = new PopupMenu.PopupMenuItem(_(text));
  if (onClick) { 
    item.connect('activate', onClick); 
  }
  return item;
}

function createMenuSection() {
  return new PopupMenu.PopupMenuSection();
}

function createSubMenu(text, onClick) {
  const item = new PopupMenu.PopupSubMenuMenuItem(_(text));
  if (onClick) { 
    item.connect('activate', onClick); 
  }

  return item;
}

function createToggleMenuItem(text, active, onToggle) {
  const item = new PopupMenu.PopupSwitchMenuItem(_(text), active);
  item.connect('toggled', onToggle);
  return item;
}

/* 
  exported createToggleMenuItem
  exported createSubMenu
  exported createMenuSection
  exported createSimpleMenuItem
  exported createSeparatorMenuItem
  exported createStatusPanel
*/