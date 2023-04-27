
#!/bin/bash

# exit when any command fails
set -e

# keep track of the last executed command
trap 'last_command=$current_command; current_command=$BASH_COMMAND' DEBUG
# echo an error message before exiting
trap 'echo "\"${last_command}\" command filed with exit code $?."' EXIT

rw 
chmod -R 777 /tmp

### Fixed asound.conf

echo "# define jack
#

pcm.jack { 
    type hw
    card Headphones
}

ctl.jack {
    type hw
    card Headphones
}

# define hdmi0
#

pcm.hdmi0 { 
   type iec958
   slave {
      format IEC958_SUBFRAME_LE
      pcm {
         type hw
         card vc4hdmi0
      }
   }
}

ctl.hdmi0 {
   type plug
	slave.pcm {
		type softvol
		slave.pcm {
			type hw
         		card vc4hdmi0
		}
		control {
			name "HDMI Playback Volume"
			card vc4hdmi0
		}
	}
}

# define hdmi1
#

pcm.hdmi1 { 
   type iec958
   slave {
      format IEC958_SUBFRAME_LE
      pcm {
         type hw
         card vc4hdmi1
      }
   }
}

ctl.hdmi1 {
   type plug
	slave.pcm {
		type softvol
		slave.pcm {
			type hw
         		card vc4hdmi1
		}
		control {
			name "HDMI Playback Volume"
			card vc4hdmi1
		}
	}
}

# define usb TODO !!
#

# pcm.usb {
#     type hw
#     card 1
# }

# ctl.usb {
#     type hw
#     card 1
# }


#
# SELECT OUTPUT ( jack / hdmi0 / hdmi1 / usb (broken) / both (broken) )
#
pcm.!default jack
ctl.!default jack

# the fun begins... 
pcm.both { 
   #add the software volume control plugin to the chain first - creates a volume control for "everything" fed into the default alsa device 
   type softvol 
   slave { 
      pcm { 
         # add the plug plugin, the "Automatic conversion plugin" - allows a 2 channel source to feed what is technically a 4 channel plugin 
         type plug 
         slave { 
            pcm { 
            # add the route plugin - used to rearrange the channels 
               type route 
               slave { 
                  pcm { 
                     # add the multi plugin - used to merge the 2 sound cards together 
                     type multi; 
                     slaves.a.pcm "internal" 
                     slaves.b.pcm "usb"

                     # this creates a 4 channel stream using 2 inputs from each card 
                     slaves.a.channels 2; 
                     slaves.b.channels 2; 
                     bindings.0.slave a; 
                     bindings.0.channel 0; 
                     bindings.1.slave a; 
                     bindings.1.channel 1; 
                     bindings.2.slave b; 
                     bindings.2.channel 0; 
                     bindings.3.slave b; 
                     bindings.3.channel 1; 
                     } 
                  } 
               #this merges channel 2 and 3 into 0 and 1 respectively 
               ttable.0.0 1; 
               ttable.1.1 1; 
               ttable.0.2 1; 
               ttable.1.3 1; 
            } 
         } 
      } 
   } 
   control{ 
      # define volume control name - i used master on Headset as my Headset did not create one and most ( of my ) apps try to change "Master" by default 
      # if you already have a "Master" volume control you will need to name it something else 
      name Master 
      # the card used to add the software control to - used for accessing the control does not affect the output of that card directly ( ie it changes the output of both devices just shows up in the one selected ) 
      # you also will need to change the device set in the first block (ctl.!default) to the same card to ensure it is chosen as the default 
      card vc4hdmi0 
   } 
} 
" > /etc/asound.conf


echo "H: 05-GadagneE" >> /boot/VERSION

echo "SUCCESS !" 
reboot

exit 0

