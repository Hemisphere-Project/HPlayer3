
#!/bin/bash

# exit when any command fails
set -e

# keep track of the last executed command
trap 'last_command=$current_command; current_command=$BASH_COMMAND' DEBUG
# echo an error message before exiting
trap 'echo "\"${last_command}\" command filed with exit code $?."' EXIT

rw 
chmod -R 777 /tmp
date -s "$(curl -s --head http://google.com | grep ^Date: | sed 's/Date: //g')"

pacman -Syu --noconfirm --overwrite '/usr/lib/node_modules/npm/*'

# KEEP WPE 2.36, the new version breaks fadeIN / fadeOUT !!
pacman -U /var/cache/pacman/pkg/wpewebkit-2.36.1-1-aarch64.pkg.tar.xz  

# KEEP LIBWPE 1.12, the new version prevents video play
pacman -U /var/cache/pacman/pkg/libwpe-1.12.0-2-aarch64.pkg.tar.xz

# Update HPLAYER3
cd /opt/HPlayer3
git checkout main
git stash
git pull
npm install

# Update Pi-tools
cd /opt/Pi-tools
git checkout main
git stash
git pull

# Boot
sed -i '$ s/$/ vt.global_cursor_default=0/' /boot/cmdline.txt
sed -i '$ s/vt.global_cursor_default=0 vt.global_cursor_default=0/vt.global_cursor_default=0/' /boot/cmdline.txt
plymouth-set-default-theme -R spinner


echo "H: 03-GadagneC" >> /boot/VERSION

echo "SUCCESS !" 
reboot

exit 0
