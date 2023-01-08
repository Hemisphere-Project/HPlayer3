#!/bin/bash

# Image from https://manjaro.org/download/
# Burn it with Etcher
# Edit partition with gparted: ROOT partition > 5Gb + create DATA partition (ext4) > 1Gb

#!/bin/bash

#
#   :: HBerry 1 :: aarch64 :: manjaro :: 13/03/2022
#


### Init Pacman & update
###
pacman -Syu --noconfirm
pacman-db-upgrade
pacman -Sc --noconfirm


### Change passwords
###
echo "root:rootpi" | chpasswd
echo "pi:pi" | chpasswd


### Add pi to sudoer
###
pacman -S sudo --noconfirm
echo 'pi ALL=(ALL) NOPASSWD: ALL' | EDITOR='tee -a' visudo


### enable SSH root login
###
sed -i "s/PermitRootLogin.*/PermitRootLogin yes/g" /etc/ssh/sshd_config
sed -i "s/#PermitRootLogin/PermitRootLogin/g" /etc/ssh/sshd_config
sed -i "s/UsePAM yes/UsePAM no/g" /etc/ssh/sshd_config
echo "IPQoS 0x00" >> /etc/ssh/ssh_config
echo "IPQoS 0x00" >> /etc/ssh/sshd_config

### generate root ssh keys
###
cd /root
cat /dev/zero | ssh-keygen -q -N ""      # => no password

### restart ssh
###
systemctl restart sshd
# [from remote machine] ssh-copy-id root@<IP-ADDRESS>


### python & tools
###
pacman -S python python-pip python-setuptools python-wheel git wget imagemagick htop base-devel --noconfirm --needed


### pikaur
###
cd /opt
git clone https://aur.archlinux.org/pikaur.git
chmod 777 -R pikaur/
cd pikaur
sudo -u pi makepkg -fsri --noconfirm

### Pi Kernel
###
# pacman -S linux-rpi --noconfirm

### RPi.GPIO
###
# pikaur -S python-raspberry-gpio --noconfirm
pip install RPi.GPIO


### mosquitto server
###
pacman -S mosquitto --noconfirm --needed

### Audio Analog
##
modprobe snd_bcm2835
echo 'snd_bcm2835'  >>  /etc/modules



### avahi
###
pacman -S avahi nss-mdns  --noconfirm --needed
sed -i 's/use-ipv6=yes/use-ipv6=no/g' /etc/avahi/avahi-daemon.conf
systemctl enable avahi-daemon
systemctl start avahi-daemon



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

echo "hberry" > /etc/hostname

echo " [main]
plugins=keyfile
dns=none" > /etc/NetworkManager/NetworkManager.conf

mkdir -p /etc/dnsmasq.d/
systemctl enable dnsmasq
systemctl start dnsmasq
systemctl enable NetworkManager
systemctl start NetworkManager
nmcli con add type ethernet con-name eth0-dhcp ifname eth0

## AP - DHCP
cp /etc/dnsmasq.conf /etc/dnsmasq.conf.orig
echo 'listen-address=10.0.0.1                             
dhcp-range=10.0.1.1,10.0.2.250,255.255.0.0,12h
dhcp-leasefile=/var/lib/dnsmasq/dnsmasq.leases
' > /etc/dnsmasq.conf

### NETWORK
###
# Get current name
NAME=$(cat /etc/hostname)

# Add wifi profiles
rm /etc/NetworkManager/system-connections/*

echo "[connection]
id=wlan0-service
type=wifi
interface-name=wlan0
autoconnect=true
autoconnect-retries=0

[wifi]
hidden=false
mode=infrastructure
ssid=hmsphr

[wifi-security]
key-mgmt=wpa-psk
psk=hemiproject

[ipv4]
method=auto
route-metric=70
" > /etc/NetworkManager/system-connections/wlan0-service.nmconnection

echo "[connection]
id=wlan0-hotspot
type=wifi
interface-name=wlan0
autoconnect=false

[wifi]
hidden=false
mode=ap
band=bg
channel=6
ssid=HBerry

[wifi-security]
key-mgmt=wpa-psk
psk=Gadagne69*

[ipv4]
method=manual
address1=10.0.0.1/16,10.0.0.1
" > /etc/NetworkManager/system-connections/wlan0-hotspot.nmconnection

echo "[connection]
id=eth0-dhcp
type=ethernet
interface-name=eth0
permissions=

[ethernet]
mac-address-blacklist=

[ipv4]
dns-search=
method=auto
" > /etc/NetworkManager/system-connections/eth0-dhcp.nmconnection

chmod 600 -R /etc/NetworkManager/system-connections/



### disable ipv6
###
echo '# Disable IPv6
net.ipv6.conf.all.disable_ipv6 = 1
net.ipv6.conf.lo.disable_ipv6 = 1
net.ipv6.conf.eth0.disable_ipv6 = 1
net.ipv6.conf.wlan0.disable_ipv6 = 1
net.ipv6.conf.wlan1.disable_ipv6 = 1' > /etc/sysctl.d/40-ipv6.conf

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

### touch fix (iiyama)
sed -i '$ s/$/ usbhid.mousepoll=0/' /boot/cmdline.txt
rm -f /usr/local/bin/setnet

### spinner splash
plymouth-set-default-theme -R spinner

### version
###
echo "7.1  --  bootstraped with https://github.com/Hemisphere-Project/HPlayer3/blob/main/upgrades/bootstrap-manjaro.sh" > /boot/VERSION

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


# Pi-tools
##########
cd /opt
git clone https://github.com/Hemisphere-Project/Pi-tools.git

# extendfs
cd /opt/Pi-tools/extendfs
./install.sh
systemctl enable extendfs

# audioselect
cd /opt/Pi-tools/audioselect
./install.sh

# usbautomount
cd /opt/Pi-tools/usbautomount
./install.sh

# kiosk-chromium
cd /opt/Pi-tools/kiosk-chromium
./install.sh

# uplink-fwd
# TODO: split setnet and other network-tools
ln -sf "/opt/Pi-tools/network-tools/uplink-fwd@.service" /etc/systemd/system/
ln -sf "/opt/Pi-tools/network-tools/uplink-fwd" /usr/local/bin/
systemctl daemon-reload
systemctl enable uplink-fwd@eth0

# rorw
cd /opt/Pi-tools/rorw
./install.sh


# HPlayer3
##########
cd /opt
git clone https://github.com/Hemisphere-Project/HPlayer3.git
cd HPlayer3
./install.sh