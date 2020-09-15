const PopupMenu = imports.ui.popupMenu;
const St = imports.gi.St;
const Gio = imports.gi.Gio;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const PopupProcessItem = Me.imports.lib.popupProcessItem.PopupProcessItem;

/*
 * To avoid the menu items automatically closing the top menu,
 * inherit PopupMenuBase and override itemActivated() member method.
 */
/**
 * @typedef {Object} StatusPanelUI
 * @property {PanelMenu.Button} StatusPanelUI.container
 * @property {St.BoxLayout} StatusPanelUI.hbox
 * @property {PopupMenu.PopupMenuSection} StatusPanelUI.section
 */

/**
  * Creates the menu attached to the PanelMenu.Button. It's the basis
  * for the processes found running with PM2 and the 'all' section
  * as well.
  * 
  * @param {PanelMenu.Button} container
  * @param {Object} options
  * @param {string} options.boxLayout.style_class
  * @param {string} options.icon.style_class
  * @param {string} options.icon.iconSize
  * @param {string} options.iconFile
  * @param {string} options.actor.style_class
  * @param {function} clickCallBack
  * 
  * @return {StatusPanelUI}
  */
function createStatusPanel(container, options, clickCallBack) {
  const defaults = {
    boxLayout: {
      style_class: 'panel-status-menu-box' 
      // we use camel case, gnome uses snake case thus this mix here
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

/**
 * Makes simple clickable menu item that only has text
 * 
 * @param {string} text 
 * @param {function} onClick 
 */
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

/**
 * Makes an expandable accordeon style menu item
 * that can host other menu items as children.
 * 
 * This is the parent item that has the arrow
 * and when clicked it expands to show the children.
 * 
 * @param {string} text 
 * @param {function} onClick Callback for the click event.
 */
function createSubMenu(text, onClick) {
  const item = new PopupMenu.PopupSubMenuMenuItem(_(text));
  if (onClick) { 
    item.connect('activate', onClick); 
  }

  return item;
}

/**
 * Makes the menu item representing the PM2 process.
 * Comes with a on/off toggle and expandable section that 
 * hosts the additional actions like showing logs or process
 * info.
 * 
 * @typedef {Object} SubItem
 * @property {string} SubItem.text
 * @property {function} SubItem.onClick
 * 
 * @param {string} text 
 * @param {boolean} active 
 * @param {function} onToggle 
 * @param {SubItem[]} subitems
 * 
 * @return {PopupProcessItem}
 */
function createToggleMenuItem(text, active, onToggle, subitems) {
  const item = new PopupProcessItem(_(text), active, { restartButton: true });
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