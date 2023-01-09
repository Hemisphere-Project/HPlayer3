#!/bin/bash

#
#   :: HBerry 2 :: aarch64 :: raspbian lite :: 05/01/2023
#

##
## Burn image Raspbian Lite 64bits
## Add empty file "ssh" in /boot
## Add file "userconf" in /boot with pi:$6$HhQGK7MqwNyMuEhP$IqCauP./ebVszo6eiFgP15LrBiNktMFnIgM6XGnXBl0xIMQ7tyZtkQQKun0iXAWa5omCDVgp40Z0HraYudPxg.
## Boot
## ssh pi@<IP-ADDRESS>

### update
###
sudo apt update
sudo apt upgrade

### locals
# -> enable fr_FR.UTF-8
# using https://stackoverflow.com/a/9727654/869688

### raspi-config
###
# System -> Boot / Auto Login -> Console Autologin
# System -> Network at Boot -> No
# Performance -> GPU Memory -> 256MB
# Localisation -> Timezone -> Europe -> Paris
# Localisation -> Keyboard -> Generic 105-key (Intl) PC -> Other -> French -> The default for the keyboard layout -> No compose key
# Advanced -> Network Interface Names -> Yes 
# Advanced -> Network Config -> NetworkManager
# Reboot


# X + OpenBox + Chromium
sudo apt install mesa-utils # ??
sudo apt install --no-install-recommends xserver-xorg x11-xserver-utils xinit openbox
sudo apt-get install --no-install-recommends chromium-browser


# Autostart Chromium in kiosk mode on startx
echo "
# Disable any form of screen saver / screen blanking / power management
xset s off
xset s noblank
xset -dpms

# Allow quitting the X server with CTRL-ATL-Backspace
setxkbmap -option terminate:ctrl_alt_bksp

# Start Chromium in kiosk mode
sed -i 's/\"exited_cleanly\":false/\"exited_cleanly\":true/' ~/.config/chromium/'Local State'
sed -i 's/\"exited_cleanly\":false/\"exited_cleanly\":true/; s/\"exit_type\":\"[^\"]\+\"/\"exit_type\":\"Normal\"/' ~/.config/chromium/Default/Preferences

chromium-browser \
        --enable-accelerated-video-decode --enable-gpu-rasterization --enable-unsafe-webgpu --ignore-gpu-blocklist --enable-zero-copy \
        --enable-features=CanvasOopRasterization,EnableDrDc \
        --disable-infobars --kiosk 'http://localhost'
        #--window-size=1920,1080 'chrome://gpu'

" | sudo tee /etc/xdg/openbox/autostart


### python / node / tools
###
sudo apt install python3 python3-pip python3-setuptools python3-wheel 
sudo apt install git wget imagemagick htop build-essential 
sudo apt install pigpio

sudo apt install nodejs npm 
sudo npm install n -g
sudo n stable
hash -r

# HPlayer3
cd ~ 
git clone https://github.com/Hemisphere-Project/HPlayer3.git
cd HPlayer3
npm install

### Audio 
sudo cp ./asound.conf /etc/asound.conf

### /data
sudo mkdir /data
sudo mkdir /data/conf
sudo chown -R pi:pi /data

### RPi.GPIO
### (might conflict with pigpio ?)
# pip install RPi.GPIO


### mosquitto server
###
sudo apt install mosquitto 


### Audio Analog
## (already here in raspbian lite)
# modprobe snd_bcm2835
# echo 'snd_bcm2835'  >>  /etc/modules


### avahi
###
echo "hberry" > /etc/hostname
sudo apt install avahi-daemon
sudo sed -i 's/use-ipv6=yes/use-ipv6=no/g' /etc/avahi/avahi-daemon.conf
systemctl enable avahi-daemon
systemctl start avahi-daemon


### disable ipv6
###
echo '# Disable IPv6
net.ipv6.conf.all.disable_ipv6 = 1
net.ipv6.conf.lo.disable_ipv6 = 1
net.ipv6.conf.eth0.disable_ipv6 = 1
net.ipv6.conf.wlan0.disable_ipv6 = 1
net.ipv6.conf.wlan1.disable_ipv6 = 1' | sudo tee /etc/sysctl.d/40-ipv6.conf

### Pi-tools
cd ~
git clone https://github.com/Hemisphere-Project/Pi-tools.git
cd Pi-tools

### RORW
cd rorw
sudo ./install.sh


exit



# ////////////////////////////////// LEGACY 

### switch from netctl/networkd to NetworkManager
###
pacman -S networkmanager dnsmasq --noconfirm --needed
pacman -R dhcpcd --noconfirm
pacman -R netctl --noconfirm
systemctl stop systemd-resolved
systemctl disable systemd-resolved
systemctl stop systemd-networkd.socket
systemctl disable systemd-networkd.socket
systemctl stop systemd-networkd
systemctl disable systemd-networkd

rm /etc/resolv.conf
echo "nameserver 8.8.8.8
nameserver 1.1.1.1" > /etc/resolv.conf

echo " [main]
plugins=keyfile
dns=none" > /etc/NetworkManager/NetworkManager.conf

mkdir -p /etc/dnsmasq.d/
systemctl enable dnsmasq
systemctl start dnsmasq
systemctl enable NetworkManager
systemctl start NetworkManager
nmcli con add type ethernet con-name eth0-dhcp ifname eth0


### network interface name persistence
### 
sed -i '$ s/$/ net.ifnames=0/' /boot/cmdline.txt

### i2c
###
echo "i2c-dev" >> /etc/modules-load.d/raspberrypi.conf

### blackboot
###
systemctl disable getty@tty1
sed -i '$ s/tty1/tty3/' /boot/cmdline.txt
sed -i '$ s/$/ loglevel=1 vt.global_cursor_default=0/' /boot/cmdline.txt      # logo.nologo vt.global_cursor_default=0 consoleblank=0 quiet vga=current

### spinner splash
plymouth-set-default-theme -R spinner

### version
###
echo "7.0  --  bootstraped with https://github.com/Hemisphere-Project/Pi-tools" > /boot/VERSION

### write config.txt
### (check if there is no new config.txt settings that you should keep)
###
cp /boot/config.txt /boot/config.txt.origin
echo "
##
## HBERRY settings
##
initramfs initramfs-linux.img followkernel
kernel=kernel8.img
arm_64bit=1
disable_overscan=1

#
# GPU 
# See https://www.raspberrypi.org/documentation/configuration/config-txt/video.md
#
gpu_mem=200
dtoverlay=vc4-kms-v3d
max_framebuffers=2

#
# VIDEO 
# See https://www.raspberrypi.org/documentation/configuration/config-txt/video.md
#
hdmi_force_hotplug=1    # Force HDMI (even without cable)
hdmi_drive=2            # 1: DVI mode / 2: HDMI mode
hdmi_group=2            # 0: autodetect / 1: CEA (TVs) / 2: DMT (PC Monitor)
hdmi_mode=82            # 82: 1080p / 85: 720p / 16: 1024x768 / 51: 1600x1200 / 9: 800x600

#
# AUDIO
#
dtoverlay=pisound    # necessary to get analog jack working on Pi4 ! 
dtparam=audio=on
audio_pwm_mode=2

#
# I2C
#
dtparam=i2c_arm=on
dtparam=i2c1=on

#
# USB
#
#dwc_otg.speed=1 #legacy USB1.1

#
# Display
#
# dtoverlay=i2c-gpio,i2c_gpio_sda=15,i2c_gpio_scl=14  ## I2C (small 35 TFT touchscreen ?)
# dtoverlay=tft35a:rotate=90  # GPIO 3.5TFT screen
# display_lcd_rotate=2        # Onboard display

#
# FastBoot
#
avoid_warnings=1
initial_turbo=30
boot_delay=0
disable_splash=1                        # Disable the rainbow splash screen
# dtoverlay=sdtweak,overclock_50=100    # Overclock the SD Card from 50 to 100MHz / This can only be done with at least a UHS Class 1 card

" > /boot/config.txt


## MyRepos
# cd /opt
# git clone git://myrepos.branchable.com/ myrepos
# cp /opt/myrepos/mr /usr/local/bin/
# rm -Rf myrepos



