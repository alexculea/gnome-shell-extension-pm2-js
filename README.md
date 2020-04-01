# PM2 Process Manager Gnome Shell Extension
This is a simple toggle on/off extension for starting and stopping processes managed with PM2 (https://pm2.keymetrics.io/).


<img src="screenshot.png">

## Manual Installation
```BASH
# ensure PM2 is available in your `PATH` (or just install it globally)
npm i pm2 -g

# go to your extensions dir
cd ~/.local/share/gnome-shell/extensions

# download extension
git clone https:github.com/alexculea/gnome-shell-extension-pm2-js.git

# rename to UUID
mv gnome-shell-extension-pm2-js pm2-process-manager@bitplot.dev
```
Restart your shell. Alt+F2, type 'r' and Enter. Activate the extension with Gnome Tweaks. If you don't have it, install it with ``sudo apt install gnome-tweaks``.

## Troubleshooting

Errors will be logged by the extension in the gnome-shell log. On Ubuntu you can see it by running
```journalctl /usr/bin/gnome-shell -f```. Your distro might have a different way of storing the shell logs.

## Roadmap
Pull requests welcome.

1.1:
 - don't close menu as soon as toggle is clicked, instead change toggle after command completed and then close the menu
 - ✔ fix clicking the panel button <img src="assets/pm2-logo-dark.svg"> button while the menu is visible makes the menu recreate and flicker 

1.2:
 - show loading indicator if startup takes more than 0.5s
 - add show logs button for each entry, open the user default terminal instead of hardcoding
 - convert shell command running to async (maybe even include it in 1.0?)
