/* exported PopupProcessItem*/

const PopupMenu = imports.ui.popupMenu;
const St = imports.gi.St;

class PopupProcessItem extends PopupMenu.PopupSubMenuMenuItem {
  /**
   * @typedef {import('./ui.js').SubItem} SubItem
   * 
   * 
   * @param {string} text 
   * @param {boolean} active Marks the switch as either on or off
   * @param {function} onToggle Called when the switch is toggle
   * @param {SubItem[]} subitems Submenu children
   */
  constructor(text, active, onToggle, subitems) {
    super(text, active);

    this.switch = new PopupMenu.Switch(active);
    this.switch.connect('click')
    this.actor.add(this.switch, { expand: false, x_align: St.Align.END });
    
  }

  activate(event) {
    
  }
}
