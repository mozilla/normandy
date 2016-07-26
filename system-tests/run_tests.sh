#!/bin/bash
xpra --xvfb="Xorg -dpi 96 -noreset -nolisten tcp +extension GLX +extension RANDR +extension RENDER -config /test/xorg.conf" start :100
sleep 2
firefox -marionette &
firefoxPID=$!
echo "from marionette import Marionette; client = Marionette(host='localhost', port=2828); client.start_session(); client.delete_session()" | python
sleep 2
kill $firefoxPID
firefox -marionette &
py.test -s
